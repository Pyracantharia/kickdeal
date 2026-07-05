<?php

namespace App\Controller;

use App\Entity\ClubProfile;
use App\Entity\ClubRequest;
use App\Entity\Agent;
use App\Entity\Player;
use App\Entity\PlayerAgentRequest;
use App\Entity\TeamMembership;
use App\Entity\User;
use App\Enum\ClubRequestStatusEnum;
use App\Enum\MembershipRoleEnum;
use App\Enum\PlayerAgentRequestStatusEnum;
use App\Enum\PlayerAgentRequestTypeEnum;
use App\Repository\ClubRequestRepository;
use App\Repository\PlayerAgentRequestRepository;
use App\Service\Notification\NotificationService;
use DateTimeImmutable;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('api/admin')]
final class AdminController extends AbstractController
{
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

    #[Route('/club-requests/approve/{id}', name: 'admin_approve_club_request', methods: ['PUT'])]
    public function approveClubRequest(
        #[CurrentUser] ?User $user,
        ClubRequest $clubRequest,
        EntityManagerInterface $entityManager,
        NotificationService $notificationService,
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
        $entityManager->flush();

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

    #[Route('/player-agent-requests/approve/{id}', name: 'admin_approve_player_agent_request', methods: ['PUT'])]
    public function approvePlayerAgentRequest(
        #[CurrentUser] ?User $user,
        PlayerAgentRequest $playerAgentRequest,
        EntityManagerInterface $entityManager,
        NotificationService $notificationService,
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
        }

        $entityManager->flush();

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

        $entityManager->flush();

        return $this->json([
            'message' => 'Demande refusée par l’administration.',
            'request' => $this->serializePlayerAgentRequest($playerAgentRequest),
        ]);
    }

    #[Route('/club-requests/reject/{id}', name: 'admin_reject_club_request', methods: ['PUT'])]
    public function rejectClubRequest(): JsonResponse
    {
        return $this->json([
            "message" => "Club request rejected successfully"
        ], 200, [], []);
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
            ],
            'requestingAgent' => $requestingAgent ? [
                'id' => $requestingAgent->getId()?->toRfc4122(),
                'name' => $this->agentName($requestingAgent),
                'email' => $requestingAgent->getUser()?->getEmail(),
            ] : null,
            'currentAgent' => $currentAgent ? [
                'id' => $currentAgent->getId()?->toRfc4122(),
                'name' => $this->agentName($currentAgent),
                'email' => $currentAgent->getUser()?->getEmail(),
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
