<?php

namespace App\Controller;

use App\Entity\ClubProfile;
use App\Entity\ClubRequest;
use App\Entity\Agent;
use App\Entity\MessageReport;
use App\Entity\Player;
use App\Entity\PlayerAgentRequest;
use App\Entity\TeamMembership;
use App\Entity\User;
use App\Enum\ClubRequestStatusEnum;
use App\Enum\MembershipRoleEnum;
use App\Enum\PlayerAgentRequestStatusEnum;
use App\Enum\PlayerAgentRequestTypeEnum;
use App\Enum\TransferNegociationStatusEnum;
use App\Repository\ClubRequestRepository;
use App\Repository\MessageReportRepository;
use App\Repository\PlayerAgentRequestRepository;
use App\Repository\Transfer\TransferNegociationRepository;
use App\Repository\UserRepository;
use App\Service\Mail\TransactionalMailer;
use App\Service\Notification\NotificationService;
use App\Service\Security\PasswordPolicy;
use App\Service\AdminAuditLogger;
use DateTimeImmutable;
use Doctrine\DBAL\Exception\ForeignKeyConstraintViolationException;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('api/admin')]
final class AdminController extends AbstractController
{
    private const array MANAGED_ROLES = [
        User::ROLE_ADMIN,
        User::ROLE_AGENT,
        User::ROLE_CLUB,
    ];

    #[Route('/dashboard', name: 'admin_dashboard', methods: ['GET'])]
    public function dashboard(
        #[CurrentUser] ?User $user,
        UserRepository $userRepository,
        ClubRequestRepository $clubRequestRepository,
        PlayerAgentRequestRepository $playerAgentRequestRepository,
        MessageReportRepository $messageReportRepository,
    ): JsonResponse {
        if (!$this->isAdmin($user)) {
            return $this->json([
                'error' => 'Unauthorized',
            ], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $now = new DateTimeImmutable();
        $clubStatus = ClubRequestStatusEnum::PENDING;
        $agentStatus = PlayerAgentRequestStatusEnum::PENDING;
        $reportStatus = MessageReport::STATUS_PENDING;

        $pendingClubRequests = $clubRequestRepository->count(['status' => $clubStatus]);
        $pendingAgentRequests = $playerAgentRequestRepository->count(['status' => $agentStatus]);
        $pendingReports = $messageReportRepository->count(['status' => $reportStatus]);

        $oldestClubRequest = $clubRequestRepository->findOneBy(
            ['status' => $clubStatus],
            ['createdAt' => 'ASC'],
        );
        $oldestAgentRequest = $playerAgentRequestRepository->findOneBy(
            ['status' => $agentStatus],
            ['createdAt' => 'ASC'],
        );
        $oldestReport = $messageReportRepository->findOneBy(
            ['status' => $reportStatus],
            ['createdAt' => 'ASC'],
        );

        return $this->json([
            'stats' => [
                'totalUsers' => $userRepository->count([]),
                'newUsersLast30Days' => $userRepository->countCreatedSince($now->modify('-30 days')),
                'pendingValidations' => $pendingClubRequests + $pendingAgentRequests,
                'currentlyBannedUsers' => $userRepository->countCurrentlyBanned($now),
            ],
            'alerts' => array_values(array_filter([
                $this->dashboardAlert(
                    'club_requests',
                    'Demandes de club à vérifier',
                    $pendingClubRequests,
                    $oldestClubRequest?->getCreatedAt(),
                    '/admin/club-requests',
                    $now,
                ),
                $this->dashboardAlert(
                    'player_agent_requests',
                    'Demandes agent-joueur à vérifier',
                    $pendingAgentRequests,
                    $oldestAgentRequest?->getCreatedAt(),
                    '/admin/player-agent-requests',
                    $now,
                ),
                $this->dashboardAlert(
                    'message_reports',
                    'Signalements à modérer',
                    $pendingReports,
                    $oldestReport?->getCreatedAt(),
                    '/admin/message-reports',
                    $now,
                ),
            ])),
            'generatedAt' => $now->format(\DateTimeInterface::ATOM),
        ]);
    }

    #[Route('/users', name: 'admin_users_index', methods: ['GET'])]
    public function listUsers(
        Request $request,
        #[CurrentUser] ?User $user,
        UserRepository $userRepository,
    ): JsonResponse {
        if (!$this->isAdmin($user)) {
            return $this->json([
                'error' => 'Unauthorized',
            ], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $search = trim((string) $request->query->get('search', ''));
        $users = $userRepository->searchForAdmin('' === $search ? null : $search);

        return $this->json([
            'users' => array_map($this->serializeAdminUser(...), $users),
        ]);
    }

    #[Route('/users', name: 'admin_users_create', methods: ['POST'])]
    public function createUser(
        Request $request,
        #[CurrentUser] ?User $admin,
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher,
        ValidatorInterface $validator,
        PasswordPolicy $passwordPolicy,
        AdminAuditLogger $audit,
    ): JsonResponse {
        if (!$this->isAdmin($admin)) {
            return $this->json([
                'error' => 'Unauthorized',
            ], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $payload = $this->jsonPayload($request);
        if (null === $payload) {
            return $this->json([
                'message' => 'Payload invalide.',
            ], JsonResponse::HTTP_BAD_REQUEST);
        }

        $password = $this->requiredString($payload['password'] ?? null);
        if (null === $password || !$passwordPolicy->isValid($password)) {
            return $this->json([
                'errors' => [
                    'password' => PasswordPolicy::MESSAGE,
                ],
            ], JsonResponse::HTTP_UNPROCESSABLE_ENTITY);
        }

        $newUser = (new User())
            ->setFirstName($this->requiredString($payload['firstName'] ?? null) ?? '')
            ->setLastName($this->requiredString($payload['lastName'] ?? null) ?? '')
            ->setEmail(strtolower($this->requiredString($payload['email'] ?? null) ?? ''))
            ->setRoles($this->normalizeRoles($payload['roles'] ?? []));
        $newUser->setPassword($passwordHasher->hashPassword($newUser, $password));
        $newUser->markPasswordChanged();

        $errors = $this->validateUser($newUser, $validator);
        if ([] !== $errors) {
            return $this->json(['errors' => $errors], JsonResponse::HTTP_UNPROCESSABLE_ENTITY);
        }

        try {
            $entityManager->persist($newUser);
            $entityManager->flush();
        } catch (UniqueConstraintViolationException) {
            return $this->json([
                'errors' => [
                    'email' => 'Utilisateur existant.',
                ],
            ], JsonResponse::HTTP_CONFLICT);
        }

        $audit->record($admin, 'user.created', 'users', 'user', $newUser->getId()?->toRfc4122(), (string) $newUser->getEmail(), [], ['firstName' => $newUser->getFirstName(), 'lastName' => $newUser->getLastName(), 'email' => $newUser->getEmail(), 'roles' => $newUser->getRoles()]);

        return $this->json([
            'message' => 'Utilisateur créé.',
            'user' => $this->serializeAdminUser($newUser),
        ], JsonResponse::HTTP_CREATED);
    }

    #[Route('/users/{id}', name: 'admin_users_update', methods: ['PUT'])]
    public function updateUser(
        Request $request,
        #[CurrentUser] ?User $admin,
        User $managedUser,
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher,
        ValidatorInterface $validator,
        PasswordPolicy $passwordPolicy,
        UserRepository $userRepository,
    ): JsonResponse {
        if (!$this->isAdmin($admin)) {
            return $this->json([
                'error' => 'Unauthorized',
            ], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $payload = $this->jsonPayload($request);
        if (null === $payload) {
            return $this->json([
                'message' => 'Payload invalide.',
            ], JsonResponse::HTTP_BAD_REQUEST);
        }

        $nextRoles = $this->normalizeRoles($payload['roles'] ?? $managedUser->getRoles());
        if (!$this->canChangeAdminRole($admin, $managedUser, $nextRoles, $userRepository)) {
            return $this->json([
                'message' => 'Impossible de retirer le dernier accès administrateur.',
            ], JsonResponse::HTTP_CONFLICT);
        }

        $managedUser
            ->setFirstName($this->requiredString($payload['firstName'] ?? null) ?? '')
            ->setLastName($this->requiredString($payload['lastName'] ?? null) ?? '')
            ->setEmail(strtolower($this->requiredString($payload['email'] ?? null) ?? ''))
            ->setRoles($nextRoles);

        $password = $this->optionalString($payload['password'] ?? null);
        if (null !== $password) {
            if (!$passwordPolicy->isValid($password)) {
                return $this->json([
                    'errors' => [
                        'password' => PasswordPolicy::MESSAGE,
                    ],
                ], JsonResponse::HTTP_UNPROCESSABLE_ENTITY);
            }

            $managedUser->setPassword($passwordHasher->hashPassword($managedUser, $password));
            $managedUser->markPasswordChanged();
        }

        $errors = $this->validateUser($managedUser, $validator);
        if ([] !== $errors) {
            return $this->json(['errors' => $errors], JsonResponse::HTTP_UNPROCESSABLE_ENTITY);
        }

        try {
            $entityManager->flush();
        } catch (UniqueConstraintViolationException) {
            return $this->json([
                'errors' => [
                    'email' => 'Utilisateur existant.',
                ],
            ], JsonResponse::HTTP_CONFLICT);
        }

        return $this->json([
            'message' => 'Utilisateur mis à jour.',
            'user' => $this->serializeAdminUser($managedUser),
        ]);
    }

    #[Route('/users/{id}', name: 'admin_users_delete', methods: ['DELETE'])]
    public function deleteUser(
        #[CurrentUser] ?User $admin,
        User $managedUser,
        EntityManagerInterface $entityManager,
        UserRepository $userRepository,
        AdminAuditLogger $audit,
    ): JsonResponse {
        if (!$this->isAdmin($admin)) {
            return $this->json([
                'error' => 'Unauthorized',
            ], JsonResponse::HTTP_UNAUTHORIZED);
        }

        if ($admin->getId()?->toRfc4122() === $managedUser->getId()?->toRfc4122()) {
            return $this->json([
                'message' => 'Vous ne pouvez pas supprimer votre propre compte.',
            ], JsonResponse::HTTP_CONFLICT);
        }

        if (in_array(User::ROLE_ADMIN, $managedUser->getRoles(), true) && count($userRepository->findAdminUsers()) <= 1) {
            return $this->json([
                'message' => 'Impossible de supprimer le dernier administrateur.',
            ], JsonResponse::HTTP_CONFLICT);
        }

        $deletedId=$managedUser->getId()?->toRfc4122();$deletedLabel=(string)$managedUser->getEmail();$deletedData=['firstName'=>$managedUser->getFirstName(),'lastName'=>$managedUser->getLastName(),'email'=>$managedUser->getEmail(),'roles'=>$managedUser->getRoles()];
        try {
            $entityManager->remove($managedUser);
            $entityManager->flush();
        } catch (ForeignKeyConstraintViolationException) {
            return $this->json([
                'message' => 'Cet utilisateur possède encore des données liées et ne peut pas être supprimé.',
            ], JsonResponse::HTTP_CONFLICT);
        }

        $audit->record($admin, 'user.deleted', 'users', 'user', $deletedId, $deletedLabel, $deletedData, []);

        return $this->json([
            'message' => 'Utilisateur supprimé.',
        ]);
    }

    #[Route('/users/{id}/unban', name: 'admin_users_unban', methods: ['POST'])]
    public function unbanUser(
        #[CurrentUser] ?User $admin,
        User $managedUser,
        EntityManagerInterface $entityManager,
        MailerInterface $mailer,
        AdminAuditLogger $audit,
    ): JsonResponse {
        if (!$this->isAdmin($admin)) {
            return $this->json([
                'error' => 'Unauthorized',
            ], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $managedUser
            ->setBannedUntil(null)
            ->setBanReason(null)
            ->setBannedAt(null);
        $entityManager->flush();
        $audit->record($admin, 'user.reinstated', 'users', 'user', $managedUser->getId()?->toRfc4122(), (string)$managedUser->getEmail(), ['banned'=>true], ['banned'=>false]);

        $this->sendModerationEmail(
            $mailer,
            $managedUser,
            'Votre compte KickDeal est réactivé',
            'Votre compte a été débanni. Vous pouvez à nouveau accéder à KickDeal.'
        );

        return $this->json([
            'message' => 'Utilisateur débanni.',
            'user' => $this->serializeAdminUser($managedUser),
        ]);
    }

    #[Route('/message-reports', name: 'admin_message_reports_index', methods: ['GET'])]
    public function listMessageReports(
        Request $request,
        #[CurrentUser] ?User $user,
        MessageReportRepository $messageReportRepository,
    ): JsonResponse {
        if (!$this->isAdmin($user)) {
            return $this->json([
                'error' => 'Unauthorized',
            ], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $status = $request->query->get('status');
        $status = is_string($status) && '' !== $status ? $status : MessageReport::STATUS_PENDING;

        return $this->json([
            'reports' => array_map(
                $this->serializeMessageReport(...),
                $messageReportRepository->findForAdmin($status),
            ),
        ]);
    }

    #[Route('/message-reports/{id}/warn', name: 'admin_message_reports_warn', methods: ['POST'])]
    public function warnReportedUser(
        Request $request,
        #[CurrentUser] ?User $admin,
        MessageReport $messageReport,
        EntityManagerInterface $entityManager,
        MailerInterface $mailer,
        AdminAuditLogger $audit,
    ): JsonResponse {
        if (!$this->isAdmin($admin)) {
            return $this->json([
                'error' => 'Unauthorized',
            ], JsonResponse::HTTP_UNAUTHORIZED);
        }

        if (MessageReport::STATUS_PENDING !== $messageReport->getStatus()) {
            return $this->json([
                'message' => 'Ce signalement a déjà été traité.',
            ], JsonResponse::HTTP_CONFLICT);
        }

        $payload = $this->jsonPayload($request) ?? [];
        $comment = $this->optionalString($payload['comment'] ?? null);
        $reportedUser = $messageReport->getReportedUser();

        if (!$reportedUser instanceof User) {
            return $this->json([
                'message' => 'Utilisateur signalé introuvable.',
            ], JsonResponse::HTTP_UNPROCESSABLE_ENTITY);
        }

        $messageReport
            ->setStatus(MessageReport::STATUS_WARNED)
            ->setAdminComment($comment)
            ->setDecidedBy($admin)
            ->setDecidedAt(new DateTimeImmutable());
        $entityManager->flush();
        $audit->record($admin, 'report.warning_issued', 'moderation', 'user', $reportedUser->getId()?->toRfc4122(), (string)$reportedUser->getEmail(), [], ['warning'=>true], ['reportId'=>$messageReport->getId()?->toRfc4122(),'comment'=>$comment]);

        $this->sendModerationEmail(
            $mailer,
            $reportedUser,
            'Avertissement concernant votre comportement sur KickDeal',
            sprintf(
                "Un de vos messages a été signalé puis examiné par l'administration.\n\nMessage concerné : \"%s\"\n\n%s",
                $messageReport->getMessageContent(),
                $comment ? "Commentaire de l'administration : {$comment}" : 'Merci de respecter les autres utilisateurs dans vos échanges.'
            )
        );

        return $this->json([
            'message' => 'Avertissement envoyé.',
            'report' => $this->serializeMessageReport($messageReport),
        ]);
    }

    #[Route('/message-reports/{id}/ban', name: 'admin_message_reports_ban', methods: ['POST'])]
    public function banReportedUser(
        Request $request,
        #[CurrentUser] ?User $admin,
        MessageReport $messageReport,
        EntityManagerInterface $entityManager,
        MailerInterface $mailer,
        AdminAuditLogger $audit,
    ): JsonResponse {
        if (!$this->isAdmin($admin)) {
            return $this->json([
                'error' => 'Unauthorized',
            ], JsonResponse::HTTP_UNAUTHORIZED);
        }

        if (MessageReport::STATUS_PENDING !== $messageReport->getStatus()) {
            return $this->json([
                'message' => 'Ce signalement a déjà été traité.',
            ], JsonResponse::HTTP_CONFLICT);
        }

        $payload = $this->jsonPayload($request) ?? [];
        $durationDays = isset($payload['durationDays']) && is_numeric($payload['durationDays'])
            ? max(1, min(180, (int) $payload['durationDays']))
            : 1;
        $comment = $this->optionalString($payload['comment'] ?? null);
        $reportedUser = $messageReport->getReportedUser();

        if (!$reportedUser instanceof User) {
            return $this->json([
                'message' => 'Utilisateur signalé introuvable.',
            ], JsonResponse::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($this->isAdmin($reportedUser)) {
            return $this->json([
                'message' => 'Un administrateur ne peut pas être banni depuis un signalement.',
            ], JsonResponse::HTTP_CONFLICT);
        }

        $banUntil = new DateTimeImmutable(sprintf('+%d days', $durationDays));
        $banReason = $comment ?? 'Message déplacé ou insultant signalé puis validé par la modération.';

        $reportedUser
            ->setBannedAt(new DateTimeImmutable())
            ->setBannedUntil($banUntil)
            ->setBanReason($banReason);
        $messageReport
            ->setStatus(MessageReport::STATUS_BANNED)
            ->setAdminComment($comment)
            ->setDecidedBy($admin)
            ->setDecidedAt(new DateTimeImmutable())
            ->setBanUntil($banUntil);
        $entityManager->flush();
        $audit->record($admin, 'report.user_banned', 'moderation', 'user', $reportedUser->getId()?->toRfc4122(), (string)$reportedUser->getEmail(), ['bannedUntil'=>null], ['bannedUntil'=>$banUntil->format(DATE_ATOM)], ['reportId'=>$messageReport->getId()?->toRfc4122(),'comment'=>$comment]);

        $this->sendModerationEmail(
            $mailer,
            $reportedUser,
            'Suspension temporaire de votre compte KickDeal',
            sprintf(
                "Votre compte est suspendu jusqu'au %s.\n\nMessage concerné : \"%s\"\n\nMotif : %s",
                $banUntil->format('d/m/Y H:i'),
                $messageReport->getMessageContent(),
                $banReason
            )
        );

        return $this->json([
            'message' => 'Utilisateur banni temporairement.',
            'report' => $this->serializeMessageReport($messageReport),
        ]);
    }

    #[Route('/club-requests/pending', name: 'admin_pending_club_requests', methods: ['GET'])]
    public function getPendingClubRequests(
        Request $request,
        #[CurrentUser] ?User $user,
        ClubRequestRepository $clubRequestRepository
    ) :JsonResponse
    {
        if (!$user || !in_array('ROLE_ADMIN', $user->getRoles())) {
            return $this->json([
                'error' => 'Unauthorized'
            ], 401);
        }

        $limit = $request->query->get('limit');
        $limit = $limit && is_numeric($limit) ? (int) $limit : null;

        $pendingRequests = $clubRequestRepository->findPendingRequests($limit);

        return $this->json([
            "pendingRequests" => $pendingRequests
        ], 200, [], ['groups' => 'admin:club_request:read']);
    }

    #[Route('/club-requests/{id}', name: 'admin_club_request_show', methods: ['GET'])]
    public function getClubRequest(
        #[CurrentUser] ?User $user,
        ClubRequest $clubRequest,
    ): JsonResponse {
        if (!$this->isAdmin($user)) {
            return $this->json([
                'error' => 'Unauthorized',
            ], JsonResponse::HTTP_UNAUTHORIZED);
        }

        return $this->json([
            'request' => $this->serializeClubRequest($clubRequest),
        ]);
    }

    #[Route('/club-requests/approve/{id}', name: 'admin_approve_club_request', methods: ['PUT'])]
    public function approveClubRequest(
        #[CurrentUser] ?User $user,
        ClubRequest $clubRequest,
        EntityManagerInterface $entityManager,
        NotificationService $notificationService,
        TransferNegociationRepository $transferNegociationRepository,
        TransactionalMailer $transactionalMailer,
        AdminAuditLogger $audit,
    ): JsonResponse
    {

        if (!$user || !in_array('ROLE_ADMIN', $user->getRoles())) {
            return $this->json([
                'error' => 'Unauthorized'
            ], 401);
        }

        if($clubRequest->getStatus() !== ClubRequestStatusEnum::PENDING) {
            return $this->json([
                'error' => 'Only pending requests can be approved'
            ], 400);
        }

        $clubRequest->setStatus(ClubRequestStatusEnum::APPROVED);
        $clubRequest->setUpdatedAt(new DateTimeImmutable());

        $entityManager->persist($clubRequest);

        // Create a new TeamMembership for the requester and the team
        $teamMembership = (new TeamMembership())
            ->setTeam($clubRequest->getTeam())
            ->setUser($clubRequest->getRequester())
            ->setRole(MembershipRoleEnum::CLUB_MANAGER)
            ->setPrimary(true)
            ->setCreatedAt(new DateTimeImmutable());
        
        $entityManager->persist($teamMembership);


        // create a new clubProfile for the team
        $clubProfile = (new ClubProfile())
            ->setUser($clubRequest->getRequester())
            ->setJobTitle("Gérant du club")
            ->setProfessionalContact($clubRequest->getRequester()->getPhone())
            ->setClub($clubRequest->getTeam()->getClub())
            ->setCreatedAt(new DateTimeImmutable());

        $entityManager->persist($clubProfile);

        $awaitingNegotiations = null !== $clubRequest->getTeam()
            ? $transferNegociationRepository->findAwaitingSellerClubForTeam($clubRequest->getTeam())
            : [];

        foreach ($awaitingNegotiations as $negociation) {
            $negociation
                ->setStatus(TransferNegociationStatusEnum::OPEN)
                ->setUpdatedAt(new DateTimeImmutable());
        }

        $entityManager->flush();
        $audit->record($user, 'club_request.approved', 'requests', 'club_request', $clubRequest->getId()?->toRfc4122(), (string)$clubRequest->getTeam()?->getName(), ['status'=>'pending'], ['status'=>'approved']);

        $notificationService->resolveSource('club_request', $clubRequest->getId()?->toRfc4122() ?? '');
        $notificationService->notify(
            recipient: $clubRequest->getRequester(),
            type: 'club_request.approved',
            category: 'account',
            title: 'Demande de club acceptée',
            body: sprintf('Vous êtes maintenant gestionnaire de %s.', $clubRequest->getTeam()?->getName() ?? 'votre club'),
            actionUrl: '/dashboard',
            targetRoute: '/dashboard',
            requiresAction: false,
            severity: 'success',
            actor: $user,
            sourceType: 'club_request',
            sourceId: $clubRequest->getId()?->toRfc4122(),
        );
        if ($clubRequest->getRequester() instanceof User && $clubRequest->getTeam() instanceof \App\Entity\Team) {
            $transactionalMailer->sendClubRequestDecision($clubRequest->getRequester(), $clubRequest->getTeam(), true);
        }

        if (count($awaitingNegotiations) > 0) {
            $notificationService->notify(
                recipient: $clubRequest->getRequester(),
                type: 'transfer_seller_club.joined',
                category: 'negotiations',
                title: 'Offres en attente retrouvées',
                body: sprintf(
                    '%d offre(s) concernant %s sont maintenant disponibles dans votre espace marché.',
                    count($awaitingNegotiations),
                    $clubRequest->getTeam()?->getName() ?? 'votre club',
                ),
                actionUrl: '/market/transfers',
                targetRoute: '/market',
                requiresAction: true,
                severity: 'warning',
                actor: $user,
                sourceType: 'club_request',
                sourceId: $clubRequest->getId()?->toRfc4122(),
            );
        }

        return $this->json([
            "message" => "Club request approved successfully",
            "approvedClubRequest" => [
                "id" => $clubRequest->getId(),
                "teamId" => $clubRequest->getTeam()->getId(),
                "status" => true
            ]
        ], 200, []);
    }

    #[Route('/player-agent-requests/pending', name: 'admin_pending_player_agent_requests', methods: ['GET'])]
    public function getPendingPlayerAgentRequests(
        Request $request,
        #[CurrentUser] ?User $user,
        PlayerAgentRequestRepository $playerAgentRequestRepository,
    ): JsonResponse {
        if (!$this->isAdmin($user)) {
            return $this->json([
                'error' => 'Unauthorized',
            ], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $limit = $request->query->get('limit');
        $limit = $limit && is_numeric($limit) ? (int) $limit : null;

        return $this->json([
            'pendingRequests' => array_map(
                $this->serializePlayerAgentRequest(...),
                $playerAgentRequestRepository->findPendingAdminRequests($limit),
            ),
        ]);
    }

    #[Route('/player-agent-requests/{id}', name: 'admin_player_agent_request_show', methods: ['GET'])]
    public function getPlayerAgentRequest(
        #[CurrentUser] ?User $user,
        PlayerAgentRequest $playerAgentRequest,
    ): JsonResponse {
        if (!$this->isAdmin($user)) {
            return $this->json([
                'error' => 'Unauthorized',
            ], JsonResponse::HTTP_UNAUTHORIZED);
        }

        return $this->json([
            'request' => $this->serializePlayerAgentRequest($playerAgentRequest),
        ]);
    }

    #[Route('/player-agent-requests/approve/{id}', name: 'admin_approve_player_agent_request', methods: ['PUT'])]
    public function approvePlayerAgentRequest(
        #[CurrentUser] ?User $user,
        PlayerAgentRequest $playerAgentRequest,
        EntityManagerInterface $entityManager,
        NotificationService $notificationService,
        TransactionalMailer $transactionalMailer,
        AdminAuditLogger $audit,
    ): JsonResponse {
        if (!$this->isAdmin($user)) {
            return $this->json([
                'error' => 'Unauthorized',
            ], JsonResponse::HTTP_UNAUTHORIZED);
        }

        if (PlayerAgentRequestStatusEnum::PENDING !== $playerAgentRequest->getStatus()) {
            return $this->json([
                'message' => 'Cette demande a déjà été traitée.',
            ], JsonResponse::HTTP_CONFLICT);
        }

        $player = $playerAgentRequest->getPlayer();
        $requestingAgent = $playerAgentRequest->getAgent();

        if (!$player instanceof Player || !$requestingAgent instanceof Agent) {
            return $this->json([
                'message' => 'Demande incomplète.',
            ], JsonResponse::HTTP_UNPROCESSABLE_ENTITY);
        }

        $notificationService->resolveSource('player_agent_request', $playerAgentRequest->getId()?->toRfc4122() ?? '', false);

        if (PlayerAgentRequestTypeEnum::AGENT_HANDOVER === $playerAgentRequest->getType()) {
            $currentAgent = $playerAgentRequest->getCurrentAgent();
            if (
                !$currentAgent instanceof Agent
                || $player->getAgent()?->getId()?->toRfc4122() !== $currentAgent->getId()?->toRfc4122()
            ) {
                return $this->json([
                    'message' => 'Cette passation n’est plus cohérente avec l’agent actuel du joueur.',
                ], JsonResponse::HTTP_CONFLICT);
            }

            $playerAgentRequest->setStatus(PlayerAgentRequestStatusEnum::ADMIN_APPROVED);
            $message = 'Demande validée par l’administration. Elle est maintenant transmise à l’agent actuel.';

            if ($currentAgent->getUser() instanceof User) {
                $notificationService->notify(
                    recipient: $currentAgent->getUser(),
                    type: 'agent_handover.agent_decision_required',
                    category: 'players',
                    title: 'Passation agent à traiter',
                    body: sprintf('%s souhaite récupérer %s.', $this->agentName($requestingAgent), $this->playerName($player)),
                    actionUrl: '/mes-joueurs',
                    targetRoute: '/mes-joueurs',
                    requiresAction: true,
                    severity: 'warning',
                    actor: $user,
                    sourceType: 'player_agent_request',
                    sourceId: $playerAgentRequest->getId()?->toRfc4122(),
                );
            }
            $transactionalMailer->sendPlayerAgentRequestDecision($playerAgentRequest, true);
        } else {
            if (null !== $player->getAgent()) {
                return $this->json([
                    'message' => 'Ce joueur possède déjà un agent. Créez une demande de passation.',
                ], JsonResponse::HTTP_CONFLICT);
            }

            $player
                ->setAgent($requestingAgent)
                ->setUpdatedAt(new DateTimeImmutable());
            $playerAgentRequest
                ->setStatus(PlayerAgentRequestStatusEnum::APPROVED)
                ->setDecidedAt(new DateTimeImmutable());
            $message = 'Demande validée. Le joueur a été ajouté au portefeuille de l’agent.';

            if ($requestingAgent->getUser() instanceof User) {
                $notificationService->notify(
                    recipient: $requestingAgent->getUser(),
                    type: 'player_representation.approved',
                    category: 'players',
                    title: 'Demande joueur acceptée',
                    body: sprintf('%s a été ajouté à votre portefeuille.', $this->playerName($player)),
                    actionUrl: '/mes-joueurs',
                    targetRoute: '/mes-joueurs',
                    requiresAction: false,
                    severity: 'success',
                    actor: $user,
                    sourceType: 'player_agent_request',
                    sourceId: $playerAgentRequest->getId()?->toRfc4122(),
                );
            }
            $transactionalMailer->sendPlayerAgentRequestDecision($playerAgentRequest, true);
        }

        $entityManager->flush();
        $auditAction=PlayerAgentRequestTypeEnum::AGENT_HANDOVER===$playerAgentRequest->getType()?'agent_handover.admin_approved':'representation_request.approved';
        $audit->record($user, $auditAction, 'requests', 'player_agent_request', $playerAgentRequest->getId()?->toRfc4122(), $this->playerName($playerAgentRequest->getPlayer()), ['status'=>'pending'], ['status'=>$playerAgentRequest->getStatus()->value], ['requestingAgent'=>$this->agentName($requestingAgent),'currentAgent'=>$playerAgentRequest->getCurrentAgent() ? $this->agentName($playerAgentRequest->getCurrentAgent()) : null]);

        return $this->json([
            'message' => $message,
            'request' => $this->serializePlayerAgentRequest($playerAgentRequest),
        ]);
    }

    #[Route('/player-agent-requests/reject/{id}', name: 'admin_reject_player_agent_request', methods: ['PUT'])]
    public function rejectPlayerAgentRequest(
        #[CurrentUser] ?User $user,
        PlayerAgentRequest $playerAgentRequest,
        EntityManagerInterface $entityManager,
        NotificationService $notificationService,
        TransactionalMailer $transactionalMailer,
        AdminAuditLogger $audit,
    ): JsonResponse {
        if (!$this->isAdmin($user)) {
            return $this->json([
                'error' => 'Unauthorized',
            ], JsonResponse::HTTP_UNAUTHORIZED);
        }

        if (PlayerAgentRequestStatusEnum::PENDING !== $playerAgentRequest->getStatus()) {
            return $this->json([
                'message' => 'Cette demande a déjà été traitée.',
            ], JsonResponse::HTTP_CONFLICT);
        }

        $playerAgentRequest
            ->setStatus(PlayerAgentRequestStatusEnum::REJECTED)
            ->setDecidedAt(new DateTimeImmutable());

        $notificationService->resolveSource('player_agent_request', $playerAgentRequest->getId()?->toRfc4122() ?? '', false);
        $requestingAgent = $playerAgentRequest->getAgent();
        if ($requestingAgent?->getUser() instanceof User) {
            $notificationService->notify(
                recipient: $requestingAgent->getUser(),
                type: 'player_agent_request.rejected',
                category: 'players',
                title: 'Demande joueur refusée',
                body: sprintf('La demande pour %s a été refusée par l’administration.', $this->playerName($playerAgentRequest->getPlayer())),
                actionUrl: '/mes-joueurs',
                targetRoute: '/mes-joueurs',
                requiresAction: false,
                severity: 'danger',
                actor: $user,
                sourceType: 'player_agent_request',
                sourceId: $playerAgentRequest->getId()?->toRfc4122(),
            );
        }
        $transactionalMailer->sendPlayerAgentRequestDecision($playerAgentRequest, false);

        $entityManager->flush();
        $auditAction=PlayerAgentRequestTypeEnum::AGENT_HANDOVER===$playerAgentRequest->getType()?'agent_handover.rejected':'representation_request.rejected';
        $audit->record($user, $auditAction, 'requests', 'player_agent_request', $playerAgentRequest->getId()?->toRfc4122(), $this->playerName($playerAgentRequest->getPlayer()), ['status'=>'pending'], ['status'=>'rejected'], ['requestingAgent'=>$this->agentName($requestingAgent),'currentAgent'=>$playerAgentRequest->getCurrentAgent() ? $this->agentName($playerAgentRequest->getCurrentAgent()) : null]);

        return $this->json([
            'message' => 'Demande refusée par l’administration.',
            'request' => $this->serializePlayerAgentRequest($playerAgentRequest),
        ]);
    }

    #[Route('/club-requests/reject/{id}', name: 'admin_reject_club_request', methods: ['PUT'])]
    public function rejectClubRequest(
        #[CurrentUser] ?User $user,
        ClubRequest $clubRequest,
        EntityManagerInterface $entityManager,
        NotificationService $notificationService,
        TransactionalMailer $transactionalMailer,
        AdminAuditLogger $audit,
    ): JsonResponse {
        if (!$this->isAdmin($user)) {
            return $this->json([
                'error' => 'Unauthorized',
            ], JsonResponse::HTTP_UNAUTHORIZED);
        }

        if($clubRequest->getStatus() !== ClubRequestStatusEnum::PENDING) {
            return $this->json([
                'error' => 'Only pending requests can be rejected'
            ], 400);
        }

        $clubRequest->setStatus(ClubRequestStatusEnum::REJECTED);
        $clubRequest->setUpdatedAt(new DateTimeImmutable());
        $entityManager->flush();
        $audit->record($user, 'club_request.rejected', 'requests', 'club_request', $clubRequest->getId()?->toRfc4122(), (string)$clubRequest->getTeam()?->getName(), ['status'=>'pending'], ['status'=>'rejected']);

        $notificationService->resolveSource('club_request', $clubRequest->getId()?->toRfc4122() ?? '');
        $notificationService->notify(
            recipient: $clubRequest->getRequester(),
            type: 'club_request.rejected',
            category: 'account',
            title: 'Demande de club refusée',
            body: sprintf('Votre demande pour %s a été refusée.', $clubRequest->getTeam()?->getName() ?? 'ce club'),
            actionUrl: '/club',
            targetRoute: '/club',
            requiresAction: false,
            severity: 'danger',
            actor: $user,
            sourceType: 'club_request',
            sourceId: $clubRequest->getId()?->toRfc4122(),
        );
        if ($clubRequest->getRequester() instanceof User && $clubRequest->getTeam() instanceof \App\Entity\Team) {
            $transactionalMailer->sendClubRequestDecision($clubRequest->getRequester(), $clubRequest->getTeam(), false);
        }

        return $this->json([
            'message' => 'Demande de club refusée.',
            'request' => $this->serializeClubRequest($clubRequest),
        ]);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function jsonPayload(Request $request): ?array
    {
        $payload = json_decode($request->getContent(), true);

        return is_array($payload) ? $payload : null;
    }

    private function requiredString(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $value = trim($value);

        return '' === $value ? null : $value;
    }

    private function optionalString(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $value = trim($value);

        return '' === $value ? null : $value;
    }

    /**
     * @return array<string, int|string|null>|null
     */
    private function dashboardAlert(
        string $id,
        string $title,
        int $count,
        ?\DateTimeInterface $oldestCreatedAt,
        string $href,
        DateTimeImmutable $now,
    ): ?array {
        if (0 === $count) {
            return null;
        }

        $ageInDays = null === $oldestCreatedAt
            ? 0
            : max(0, (int) $oldestCreatedAt->diff($now)->format('%a'));

        return [
            'id' => $id,
            'title' => $title,
            'count' => $count,
            'oldestCreatedAt' => $oldestCreatedAt?->format(\DateTimeInterface::ATOM),
            'ageInDays' => $ageInDays,
            'severity' => $ageInDays >= 7 ? 'critical' : ($ageInDays >= 3 ? 'warning' : 'info'),
            'href' => $href,
        ];
    }

    /**
     * @return array<int, string>
     */
    private function normalizeRoles(mixed $roles): array
    {
        if (!is_array($roles)) {
            return [];
        }

        $normalizedRoles = [];
        foreach ($roles as $role) {
            if (is_string($role) && in_array($role, self::MANAGED_ROLES, true)) {
                $normalizedRoles[] = $role;
            }
        }

        return array_values(array_unique($normalizedRoles));
    }

    /**
     * @return array<string, string>
     */
    private function validateUser(User $user, ValidatorInterface $validator): array
    {
        $errors = [];
        foreach ($validator->validate($user) as $error) {
            $errors[$error->getPropertyPath()] = $error->getMessage();
        }

        return $errors;
    }

    /**
     * @param array<int, string> $nextRoles
     */
    private function canChangeAdminRole(User $admin, User $managedUser, array $nextRoles, UserRepository $userRepository): bool
    {
        $managedUserId = $managedUser->getId()?->toRfc4122();
        $isSelf = $admin->getId()?->toRfc4122() === $managedUserId;
        $currentlyAdmin = in_array(User::ROLE_ADMIN, $managedUser->getRoles(), true);
        $willRemainAdmin = in_array(User::ROLE_ADMIN, $nextRoles, true);

        if (!$currentlyAdmin || $willRemainAdmin) {
            return true;
        }

        if ($isSelf) {
            return false;
        }

        return count($userRepository->findAdminUsers()) > 1;
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeAdminUser(User $user): array
    {
        $roles = array_values(array_filter(
            $user->getRoles(),
            static fn (string $role): bool => in_array($role, self::MANAGED_ROLES, true),
        ));

        return [
            'id' => $user->getId()?->toRfc4122(),
            'firstName' => $user->getFirstName(),
            'lastName' => $user->getLastName(),
            'email' => $user->getEmail(),
            'roles' => $roles,
            'phone' => $user->getPhone(),
            'twoFactorEnabled' => $user->isTwoFactorEnabled(),
            'passwordExpired' => $user->isPasswordExpired(),
            'banned' => $user->isBanned(),
            'bannedUntil' => $user->getBannedUntil()?->format(DATE_ATOM),
            'banReason' => $user->getBanReason(),
            'createdAt' => $user->getCreatedAt()?->format(DATE_ATOM),
            'updatedAt' => $user->getUpdatedAt()?->format(DATE_ATOM),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeMessageReport(MessageReport $report): array
    {
        return [
            'id' => $report->getId()?->toRfc4122(),
            'status' => $report->getStatus(),
            'reason' => $report->getReason(),
            'messageContent' => $report->getMessageContent(),
            'adminComment' => $report->getAdminComment(),
            'createdAt' => $report->getCreatedAt()?->format(DATE_ATOM),
            'decidedAt' => $report->getDecidedAt()?->format(DATE_ATOM),
            'banUntil' => $report->getBanUntil()?->format(DATE_ATOM),
            'message' => $report->getMessage() ? [
                'id' => $report->getMessage()?->getId()?->toRfc4122(),
                'createdAt' => $report->getMessage()?->getCreatedAt()?->format(DATE_ATOM),
            ] : null,
            'conversation' => $report->getConversation() ? [
                'id' => $report->getConversation()?->getId()?->toRfc4122(),
            ] : null,
            'reporter' => $report->getReporter() instanceof User ? $this->serializeModerationUser($report->getReporter()) : null,
            'reportedUser' => $report->getReportedUser() instanceof User ? $this->serializeModerationUser($report->getReportedUser()) : null,
            'decidedBy' => $report->getDecidedBy() instanceof User ? $this->serializeModerationUser($report->getDecidedBy()) : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeModerationUser(User $user): array
    {
        return [
            'id' => $user->getId()?->toRfc4122(),
            'firstName' => $user->getFirstName(),
            'lastName' => $user->getLastName(),
            'email' => $user->getEmail(),
            'banned' => $user->isBanned(),
            'bannedUntil' => $user->getBannedUntil()?->format(DATE_ATOM),
        ];
    }

    private function sendModerationEmail(MailerInterface $mailer, User $recipient, string $subject, string $body): void
    {
        $email = (new Email())
            ->from((string) $this->getParameter('mailer_from'))
            ->to($recipient->getEmail())
            ->subject($subject)
            ->text("Bonjour,\n\n{$body}\n\nL'équipe KickDeal");

        $mailer->send($email);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeClubRequest(ClubRequest $request): array
    {
        $requester = $request->getRequester();
        $team = $request->getTeam();

        return [
            'id' => $request->getId()?->toRfc4122(),
            'status' => $request->getStatus()->value,
            'verificationEmail' => $request->getVerificationEmail(),
            'verificationMessage' => $request->getVerificationMessage(),
            'verificationDocumentPath' => $request->getVerificationDocumentPath(),
            'verificationDocumentOriginalName' => $request->getVerificationDocumentOriginalName(),
            'createdAt' => $request->getCreatedAt()?->format(DATE_ATOM),
            'updatedAt' => $request->getUpdatedAt()?->format(DATE_ATOM),
            'requester' => $requester ? [
                'id' => $requester->getId()?->toRfc4122(),
                'firstName' => $requester->getFirstName(),
                'lastName' => $requester->getLastName(),
                'email' => $requester->getEmail(),
                'phone' => $requester->getPhone(),
            ] : null,
            'team' => $team ? [
                'id' => $team->getId()?->toRfc4122(),
                'name' => $team->getName(),
                'country' => $team->getCountry(),
                'league' => $team->getLeague(),
                'logoUrl' => $team->getLogoUrl(),
                'transferBudget' => $team->getTransferBudget(),
                'verificationStatus' => $team->getVerificationStatus()?->value,
            ] : null,
        ];
    }

    private function isAdmin(?User $user): bool
    {
        return $user instanceof User && in_array('ROLE_ADMIN', $user->getRoles(), true);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializePlayerAgentRequest(PlayerAgentRequest $request): array
    {
        $player = $request->getPlayer();
        $requestingAgent = $request->getAgent();
        $currentAgent = $request->getCurrentAgent();

        return [
            'id' => $request->getId()?->toRfc4122(),
            'type' => $request->getType()->value,
            'status' => $request->getStatus()->value,
            'createdAt' => $request->getCreatedAt()?->format(DATE_ATOM),
            'decidedAt' => $request->getDecidedAt()?->format(DATE_ATOM),
            'message' => $request->getMessage(),
            'verificationDocumentPath' => $request->getVerificationDocumentPath(),
            'verificationDocumentOriginalName' => $request->getVerificationDocumentOriginalName(),
            'player' => [
                'id' => $player?->getId()?->toRfc4122(),
                'firstName' => $player?->getFirstName(),
                'lastName' => $player?->getLastName(),
                'photoUrl' => $player?->getPhotoUrl(),
                'position' => $player?->getPosition(),
                'nationality' => $player?->getNationality(),
                'birthDate' => $player?->getBirthDate()?->format('Y-m-d'),
                'marketValue' => $player?->getMarketValue(),
                'contractStatus' => $player?->getContractStatus()?->value,
                'marketStatus' => $player?->getMarketStatus()?->value,
                'team' => $player?->getTeam() ? [
                    'id' => $player->getTeam()?->getId()?->toRfc4122(),
                    'name' => $player->getTeam()?->getName(),
                    'country' => $player->getTeam()?->getCountry(),
                    'league' => $player->getTeam()?->getLeague(),
                    'logoUrl' => $player->getTeam()?->getLogoUrl(),
                ] : null,
            ],
            'requestingAgent' => $requestingAgent ? [
                'id' => $requestingAgent->getId()?->toRfc4122(),
                'name' => $this->agentName($requestingAgent),
                'email' => $requestingAgent->getUser()?->getEmail(),
                'country' => $requestingAgent->getCountry(),
                'user' => $requestingAgent->getUser() ? [
                    'id' => $requestingAgent->getUser()?->getId()?->toRfc4122(),
                    'firstName' => $requestingAgent->getUser()?->getFirstName(),
                    'lastName' => $requestingAgent->getUser()?->getLastName(),
                    'phone' => $requestingAgent->getUser()?->getPhone(),
                ] : null,
            ] : null,
            'currentAgent' => $currentAgent ? [
                'id' => $currentAgent->getId()?->toRfc4122(),
                'name' => $this->agentName($currentAgent),
                'email' => $currentAgent->getUser()?->getEmail(),
                'country' => $currentAgent->getCountry(),
                'user' => $currentAgent->getUser() ? [
                    'id' => $currentAgent->getUser()?->getId()?->toRfc4122(),
                    'firstName' => $currentAgent->getUser()?->getFirstName(),
                    'lastName' => $currentAgent->getUser()?->getLastName(),
                    'phone' => $currentAgent->getUser()?->getPhone(),
                ] : null,
            ] : null,
        ];
    }

    private function agentName(Agent $agent): string
    {
        $name = $agent->getAgencyName()
            ?: trim(sprintf('%s %s', $agent->getUser()?->getFirstName(), $agent->getUser()?->getLastName()));

        return '' !== $name ? $name : 'Agent sans nom';
    }

    private function playerName(?Player $player): string
    {
        if (!$player instanceof Player) {
            return 'ce joueur';
        }

        $name = trim(sprintf('%s %s', $player->getFirstName(), $player->getLastName()));

        return '' !== $name ? $name : 'ce joueur';
    }
}
