<?php

namespace App\Controller;

use App\Entity\Agent;
use App\Entity\AgentClubProspect;
use App\Entity\Player;
use App\Entity\PlayerAgentRequest;
use App\Entity\Team;
use App\Entity\User;
use App\Enum\AgentClubProspectStatusEnum;
use App\Enum\PlayerAgentRequestStatusEnum;
use App\Enum\PlayerAgentRequestTypeEnum;
use App\Enum\PlayerContractStatusEnum;
use App\Enum\PlayerMarketAuthorizationStatusEnum;
use App\Enum\PlayerMarketListingSourceEnum;
use App\Enum\PlayerMarketStatusEnum;
use App\Repository\AgentClubProspectRepository;
use App\Repository\AgentRepository;
use App\Repository\PlayerAgentRequestRepository;
use App\Repository\PlayerRepository;
use App\Repository\TeamRepository;
use App\Repository\TeamMembershipRepository;
use App\Repository\UserRepository;
use App\Service\Notification\NotificationService;
use App\Service\Player\PlayerMarketContextResolver;
use App\Service\PublicFeed\PublicFeedPublisher;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Csrf\CsrfToken;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;
use Symfony\Component\String\Slugger\SluggerInterface;

#[Route('/api/agents')]
final class AgentPlayerController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly AgentRepository $agentRepository,
        private readonly AgentClubProspectRepository $prospectRepository,
        private readonly PlayerRepository $playerRepository,
        private readonly PlayerAgentRequestRepository $requestRepository,
        private readonly TeamRepository $teamRepository,
        private readonly UserRepository $userRepository,
        private readonly PlayerMarketContextResolver $marketContextResolver,
        private readonly PublicFeedPublisher $publicFeedPublisher,
        private readonly NotificationService $notificationService,
        private readonly CsrfTokenManagerInterface $csrfTokenManager,
        private readonly SluggerInterface $slugger,
        #[Autowire('%kernel.project_dir%/public/uploads/player-agent-verifications')]
        private readonly string $verificationDirectory,
    ) {
    }

    #[Route('/players/candidates', name: 'api_agent_player_candidates', methods: ['GET'])]
    public function candidates(Request $request): JsonResponse
    {
        $agent = $this->getOrCreateAgent();
        if ($agent instanceof JsonResponse) {
            return $agent;
        }

        $players = $this->playerRepository->searchAvailableForAgent(
            (string) $request->query->get('query', ''),
            30,
            $agent,
        );

        return $this->json([
            'players' => array_map($this->serializePlayer(...), $players),
        ]);
    }

    #[Route('/player-requests/mine', name: 'api_agent_player_requests_mine', methods: ['GET'])]
    public function requests(): JsonResponse
    {
        $agent = $this->getOrCreateAgent();
        if ($agent instanceof JsonResponse) {
            return $agent;
        }

        $requests = $this->requestRepository->findRecentForAgent($agent);
        $receivedHandoverRequests = $this->requestRepository->findHandoverRequestsForCurrentAgent($agent);
        $mustFlush = false;

        foreach ($requests as $representationRequest) {
            if (
                PlayerAgentRequestStatusEnum::APPROVED === $representationRequest->getStatus()
                && PlayerAgentRequestTypeEnum::REPRESENTATION === $representationRequest->getType()
                && null === $representationRequest->getPlayer()?->getAgent()
            ) {
                $representationRequest->getPlayer()?->setAgent($agent);
                $mustFlush = true;
            }
        }

        if ($mustFlush) {
            $this->entityManager->flush();
        }

        return $this->json([
            'requests' => array_map($this->serializeAgentRequest(...), $requests),
            'receivedHandoverRequests' => array_map($this->serializeAgentRequest(...), $receivedHandoverRequests),
        ]);
    }

    #[Route('/player-requests', name: 'api_agent_player_request_create', methods: ['POST'])]
    public function createRequest(Request $request): JsonResponse
    {
        if (!$this->isCsrfValid($request)) {
            return $this->json(['errorMessage' => 'Token CSRF invalide.'], JsonResponse::HTTP_FORBIDDEN);
        }

        $agent = $this->getOrCreateAgent();
        if ($agent instanceof JsonResponse) {
            return $agent;
        }

        $playerId = trim((string) $request->request->get('playerId'));
        $player = '' !== $playerId ? $this->playerRepository->find($playerId) : null;
        if (!$player instanceof Player) {
            return $this->json(['message' => 'Joueur introuvable.'], JsonResponse::HTTP_NOT_FOUND);
        }

        if ($this->requestRepository->hasPendingRequest($agent, $player)) {
            return $this->json(
                ['message' => 'Une demande est déjà en cours pour ce joueur.'],
                JsonResponse::HTTP_CONFLICT
            );
        }

        $currentAgent = $player->getAgent();
        $sameAgent = $currentAgent?->getId()?->toRfc4122() === $agent->getId()?->toRfc4122();
        if ($sameAgent) {
            return $this->json(
                ['message' => 'Ce joueur fait déjà partie de votre portefeuille.'],
                JsonResponse::HTTP_CONFLICT
            );
        }

        if ($currentAgent instanceof Agent && $this->requestRepository->hasPendingHandoverForPlayer($player)) {
            return $this->json(
                ['message' => 'Une demande de passation est déjà en attente pour ce joueur.'],
                JsonResponse::HTTP_CONFLICT
            );
        }

        $document = $request->files->get('verificationDocument');
        if (!$document instanceof UploadedFile) {
            return $this->json(
                ['message' => 'Un justificatif officiel est obligatoire.'],
                JsonResponse::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        $extension = strtolower($document->getClientOriginalExtension());
        if (!in_array($extension, ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'], true)) {
            return $this->json(
                ['message' => 'Format non accepté. Utilisez PDF, DOC, DOCX, JPG ou PNG.'],
                JsonResponse::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        if ($document->getSize() > 10 * 1024 * 1024) {
            return $this->json(
                ['message' => 'Le justificatif ne doit pas dépasser 10 Mo.'],
                JsonResponse::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        if (!is_dir($this->verificationDirectory)) {
            mkdir($this->verificationDirectory, 0775, true);
        }

        $safeName = $this->slugger->slug(pathinfo($document->getClientOriginalName(), PATHINFO_FILENAME));
        $fileName = sprintf('%s-%s.%s', $safeName, uniqid('', true), $extension);
        $document->move($this->verificationDirectory, $fileName);

        $representationRequest = (new PlayerAgentRequest())
            ->setAgent($agent)
            ->setPlayer($player)
            ->setType($currentAgent instanceof Agent ? PlayerAgentRequestTypeEnum::AGENT_HANDOVER : PlayerAgentRequestTypeEnum::REPRESENTATION)
            ->setCurrentAgent($currentAgent)
            ->setVerificationDocumentPath('/uploads/player-agent-verifications/'.$fileName)
            ->setVerificationDocumentOriginalName($document->getClientOriginalName())
            ->setMessage($this->nullableString($request->request->get('message')));

        $this->entityManager->persist($representationRequest);
        $this->entityManager->flush();

        foreach ($this->userRepository->findAdminUsers() as $adminUser) {
            $this->notificationService->notify(
                recipient: $adminUser,
                type: $currentAgent instanceof Agent ? 'agent_handover.admin_requested' : 'player_representation.admin_requested',
                category: 'admin',
                title: $currentAgent instanceof Agent ? 'Passation agent à valider' : 'Demande joueur à valider',
                body: sprintf(
                    '%s souhaite %s %s.',
                    $this->agentName($agent),
                    $currentAgent instanceof Agent ? 'récupérer' : 'représenter',
                    $this->playerName($player),
                ),
                actionUrl: '/admin',
                targetRoute: '/admin',
                requiresAction: true,
                severity: 'warning',
                actor: $agent->getUser(),
                sourceType: 'player_agent_request',
                sourceId: $representationRequest->getId()?->toRfc4122(),
            );
        }

        return $this->json([
            'message' => $currentAgent instanceof Agent
                ? 'Votre demande de passation a été transmise à l’administration. L’agent actuel pourra se prononcer après validation.'
                : 'Votre demande a été transmise à un administrateur.',
            'requestId' => $representationRequest->getId()?->toRfc4122(),
            'status' => $representationRequest->getStatus()->value,
        ], JsonResponse::HTTP_CREATED);
    }

    #[Route('/player-requests/{id}/approve', name: 'api_agent_player_request_approve_handover', methods: ['POST'])]
    public function approveHandover(PlayerAgentRequest $representationRequest): JsonResponse
    {
        $agent = $this->getOrCreateAgent();
        if ($agent instanceof JsonResponse) {
            return $agent;
        }

        $decisionGuard = $this->guardHandoverDecision($representationRequest, $agent);
        if ($decisionGuard instanceof JsonResponse) {
            return $decisionGuard;
        }

        $player = $representationRequest->getPlayer();
        $newAgent = $representationRequest->getAgent();

        if (!$player instanceof Player || !$newAgent instanceof Agent) {
            return $this->json(['message' => 'Demande incomplète.'], JsonResponse::HTTP_UNPROCESSABLE_ENTITY);
        }

        $player->setAgent($newAgent);
        $representationRequest
            ->setStatus(PlayerAgentRequestStatusEnum::APPROVED)
            ->setDecidedAt(new \DateTimeImmutable());

        $this->entityManager->flush();

        $this->notificationService->resolveSource('player_agent_request', (string) $representationRequest->getId());
        if ($newAgent->getUser() instanceof User) {
            $this->notificationService->notify(
                recipient: $newAgent->getUser(),
                type: 'agent_handover.approved',
                category: 'players',
                title: 'Passation acceptée',
                body: sprintf('%s fait maintenant partie de votre portefeuille.', $this->playerName($player)),
                actionUrl: '/mes-joueurs',
                targetRoute: '/mes-joueurs',
                requiresAction: false,
                severity: 'success',
                actor: $agent->getUser(),
                sourceType: 'player_agent_request',
                sourceId: $representationRequest->getId()?->toRfc4122(),
            );
        }

        return $this->json([
            'message' => 'Passation validée. Le joueur a été transféré au nouvel agent.',
            'request' => $this->serializeAgentRequest($representationRequest),
        ]);
    }

    #[Route('/player-requests/{id}/reject', name: 'api_agent_player_request_reject_handover', methods: ['POST'])]
    public function rejectHandover(PlayerAgentRequest $representationRequest): JsonResponse
    {
        $agent = $this->getOrCreateAgent();
        if ($agent instanceof JsonResponse) {
            return $agent;
        }

        $decisionGuard = $this->guardHandoverDecision($representationRequest, $agent);
        if ($decisionGuard instanceof JsonResponse) {
            return $decisionGuard;
        }

        $representationRequest
            ->setStatus(PlayerAgentRequestStatusEnum::REJECTED)
            ->setDecidedAt(new \DateTimeImmutable());

        $this->entityManager->flush();

        $this->notificationService->resolveSource('player_agent_request', (string) $representationRequest->getId());
        $newAgent = $representationRequest->getAgent();
        if ($newAgent?->getUser() instanceof User) {
            $this->notificationService->notify(
                recipient: $newAgent->getUser(),
                type: 'agent_handover.rejected',
                category: 'players',
                title: 'Passation refusée',
                body: sprintf('La demande de passation pour %s a été refusée.', $this->playerName($representationRequest->getPlayer())),
                actionUrl: '/mes-joueurs',
                targetRoute: '/mes-joueurs',
                requiresAction: false,
                severity: 'danger',
                actor: $agent->getUser(),
                sourceType: 'player_agent_request',
                sourceId: $representationRequest->getId()?->toRfc4122(),
            );
        }

        return $this->json([
            'message' => 'Demande de passation refusée.',
            'request' => $this->serializeAgentRequest($representationRequest),
        ]);
    }

    #[Route('/players/{id}/market-authorization-request', name: 'api_agent_player_market_authorization_request', methods: ['POST'])]
    public function requestMarketAuthorization(
        Player $player,
        Request $request,
        TeamMembershipRepository $teamMembershipRepository,
    ): JsonResponse
    {
        if (!$this->isCsrfValid($request)) {
            return $this->json(['errorMessage' => 'Token CSRF invalide.'], JsonResponse::HTTP_FORBIDDEN);
        }

        $agent = $this->getOrCreateAgent();
        if ($agent instanceof JsonResponse) {
            return $agent;
        }

        if (!$this->agentRepresentsPlayer($agent, $player)) {
            return $this->json(
                ['message' => 'Vous ne représentez pas ce joueur.'],
                JsonResponse::HTTP_FORBIDDEN
            );
        }

        if (PlayerContractStatusEnum::FREE_AGENT === $player->getContractStatus() || null === $player->getTeam()) {
            return $this->json([
                'message' => 'Ce joueur est libre. Aucune autorisation club n’est nécessaire.',
                'marketContext' => $this->marketContextResolver->resolve($player),
            ]);
        }

        $marketContext = $this->marketContextResolver->resolve($player);
        if ('listed_by_club' === $marketContext['state']) {
            return $this->json([
                'message' => 'Le club a déjà mis ce joueur sur le marché.',
                'marketContext' => $marketContext,
            ]);
        }

        if (PlayerMarketAuthorizationStatusEnum::PENDING === $player->getMarketAuthorizationStatus()) {
            return $this->json([
                'message' => 'Une demande est déjà en attente de décision du club.',
                'marketContext' => $marketContext,
            ]);
        }

        if (PlayerMarketAuthorizationStatusEnum::APPROVED === $player->getMarketAuthorizationStatus()) {
            return $this->json([
                'message' => 'L’autorisation a déjà été accordée par le club.',
                'marketContext' => $marketContext,
            ]);
        }

        $player
            ->setMarketAuthorizationStatus(PlayerMarketAuthorizationStatusEnum::PENDING)
            ->setMarketAuthorizationRequestedAt(new \DateTimeImmutable())
            ->setMarketAuthorizationDecidedAt(null);

        $this->entityManager->flush();

        if ($player->getTeam() instanceof Team) {
            $playerId = $player->getId()?->toRfc4122();
            foreach ($teamMembershipRepository->findUsersByTeam($player->getTeam()) as $clubUser) {
                $this->notificationService->notify(
                    recipient: $clubUser,
                    type: 'market_authorization.requested',
                    category: 'players',
                    title: 'Autorisation marché demandée',
                    body: sprintf('%s souhaite proposer %s à d’autres clubs.', $this->agentName($agent), $this->playerName($player)),
                    actionUrl: '/players?playerId='.$playerId.'&manage=1',
                    targetRoute: '/players',
                    requiresAction: true,
                    severity: 'warning',
                    actor: $agent->getUser(),
                    sourceType: 'player_market_authorization',
                    sourceId: $playerId,
                );
            }
        }

        return $this->json([
            'message' => 'La demande d’autorisation a été envoyée au club.',
            'marketContext' => $this->marketContextResolver->resolve($player),
        ], JsonResponse::HTTP_CREATED);
    }

    #[Route('/players/{id}/club-prospects', name: 'api_agent_player_club_prospects', methods: ['GET'])]
    public function clubProspects(Player $player): JsonResponse
    {
        $agent = $this->getOrCreateAgent();
        if ($agent instanceof JsonResponse) {
            return $agent;
        }

        if (!$this->agentRepresentsPlayer($agent, $player)) {
            return $this->json(
                ['errorMessage' => 'Vous ne représentez pas ce joueur.'],
                JsonResponse::HTTP_FORBIDDEN
            );
        }

        $contacts = $this->prospectRepository->findForPlayer($agent, $player);
        $contactsByTeamId = [];
        foreach ($contacts as $contact) {
            $teamId = $contact->getTeam()?->getId()?->toRfc4122();
            if (null !== $teamId) {
                $contactsByTeamId[$teamId] = $contact;
            }
        }

        $currentTeamId = $player->getTeam()?->getId()?->toRfc4122();
        $clubs = [];
        foreach ($this->teamRepository->findAgentProspectRows($player->getPosition() ?? '') as $row) {
            $team = $row[0] ?? null;
            if (!$team instanceof Team || $team->getId()?->toRfc4122() === $currentTeamId) {
                continue;
            }

            $teamId = $team->getId()?->toRfc4122();
            $clubs[] = $this->serializeClubProspect(
                $team,
                (int) ($row['squadSize'] ?? 0),
                (int) ($row['positionCount'] ?? 0),
                (int) ($row['squadValue'] ?? 0),
                $player,
                null !== $teamId ? ($contactsByTeamId[$teamId] ?? null) : null,
            );
        }

        usort(
            $clubs,
            static fn (array $a, array $b): int => $b['compatibilityScore'] <=> $a['compatibilityScore']
        );

        return $this->json([
            'player' => $this->serializePlayer($player),
            'eligibility' => $this->getProspectingEligibility($player),
            'suggestedMessage' => $this->buildSuggestedMessage($player),
            'clubs' => $clubs,
        ]);
    }

    #[Route('/players/{id}/club-prospects', name: 'api_agent_player_club_prospect_create', methods: ['POST'])]
    public function createClubProspect(
        Player $player,
        Request $request,
        TeamMembershipRepository $teamMembershipRepository,
    ): JsonResponse
    {
        if (!$this->isCsrfValid($request)) {
            return $this->json(['errorMessage' => 'Token CSRF invalide.'], JsonResponse::HTTP_FORBIDDEN);
        }

        $agent = $this->getOrCreateAgent();
        if ($agent instanceof JsonResponse) {
            return $agent;
        }

        if (!$this->agentRepresentsPlayer($agent, $player)) {
            return $this->json(
                ['errorMessage' => 'Vous ne représentez pas ce joueur.'],
                JsonResponse::HTTP_FORBIDDEN
            );
        }

        $eligibility = $this->getProspectingEligibility($player);
        if (!$eligibility['canContact']) {
            return $this->json([
                'errorMessage' => $eligibility['reason'],
                'authorizationPath' => '/mes-joueurs?playerId='.$player->getId()?->toRfc4122().'&manage=1',
            ], JsonResponse::HTTP_UNPROCESSABLE_ENTITY);
        }

        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            return $this->json(['errorMessage' => 'Payload invalide.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $teamId = trim((string) ($payload['teamId'] ?? ''));
        $team = '' !== $teamId ? $this->teamRepository->find($teamId) : null;
        if (!$team instanceof Team) {
            return $this->json(['errorMessage' => 'Club introuvable.'], JsonResponse::HTTP_NOT_FOUND);
        }

        if ($team->getId()?->toRfc4122() === $player->getTeam()?->getId()?->toRfc4122()) {
            return $this->json(
                ['errorMessage' => 'Vous ne pouvez pas proposer le joueur à son club actuel.'],
                JsonResponse::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        $existingProspect = $this->prospectRepository->findOneForTarget($agent, $player, $team);
        if ($existingProspect instanceof AgentClubProspect) {
            return $this->json([
                'errorMessage' => 'Ce club a déjà été contacté pour ce joueur.',
                'prospect' => $this->serializeContact($existingProspect),
            ], JsonResponse::HTTP_CONFLICT);
        }

        $message = trim((string) ($payload['message'] ?? ''));
        if ('' === $message) {
            $message = $this->buildSuggestedMessage($player);
        }

        $prospect = (new AgentClubProspect())
            ->setAgent($agent)
            ->setPlayer($player)
            ->setTeam($team)
            ->setStatus(AgentClubProspectStatusEnum::PROPOSAL_SENT)
            ->setMessage($message)
            ->setCreatedAt(new \DateTimeImmutable())
            ->setUpdatedAt(new \DateTimeImmutable());

        $this->entityManager->persist($prospect);
        $this->entityManager->flush();

        foreach ($teamMembershipRepository->findUsersByTeam($team) as $clubUser) {
            $this->notificationService->notify(
                recipient: $clubUser,
                type: 'agent_prospect.created',
                category: 'market',
                title: 'Joueur proposé par un agent',
                body: sprintf('%s vous propose %s.', $this->agentName($agent), $this->playerName($player)),
                actionUrl: '/market',
                targetRoute: '/market',
                requiresAction: true,
                severity: 'info',
                actor: $agent->getUser(),
                sourceType: 'agent_club_prospect',
                sourceId: $prospect->getId()?->toRfc4122(),
            );
        }

        return $this->json([
            'message' => 'La proposition a été enregistrée et transmise au club.',
            'prospect' => $this->serializeContact($prospect),
        ], JsonResponse::HTTP_CREATED);
    }

    #[Route('/players/{id}/market-status', name: 'api_agent_player_market_status', methods: ['PUT'])]
    public function updateMarketStatus(Player $player, Request $request): JsonResponse
    {
        if (!$this->isCsrfValid($request)) {
            return $this->json(['errorMessage' => 'Token CSRF invalide.'], JsonResponse::HTTP_FORBIDDEN);
        }

        $agent = $this->getOrCreateAgent();
        if ($agent instanceof JsonResponse) {
            return $agent;
        }

        if ($player->getAgent()?->getId()?->toRfc4122() !== $agent->getId()?->toRfc4122()) {
            return $this->json(
                ['message' => 'Vous ne représentez pas ce joueur.'],
                JsonResponse::HTTP_FORBIDDEN
            );
        }

        $payload = json_decode($request->getContent(), true);
        $status = PlayerMarketStatusEnum::tryFrom((string) ($payload['status'] ?? ''));
        if (!$status instanceof PlayerMarketStatusEnum) {
            return $this->json(['message' => 'Statut de marché invalide.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $marketContext = $this->marketContextResolver->resolve($player);
        if (!$marketContext['canAgentSetMarketStatus']) {
            return $this->json([
                'message' => $marketContext['message'],
                'marketContext' => $marketContext,
            ], JsonResponse::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (
            PlayerMarketListingSourceEnum::CLUB === $player->getMarketListingSource()
            && $this->marketContextResolver->isListed($player)
        ) {
            return $this->json([
                'message' => 'Le joueur est actuellement listé par son club. Seul le club peut modifier cet état.',
                'marketContext' => $marketContext,
            ], JsonResponse::HTTP_UNPROCESSABLE_ENTITY);
        }

        $previousStatus = $player->getMarketStatus();
        $player->setMarketStatus($status);
        $player->setMarketListingSource(
            PlayerMarketStatusEnum::NOT_LISTED === $status
                ? null
                : PlayerMarketListingSourceEnum::AGENT
        );
        if ($previousStatus !== $status) {
            $this->publicFeedPublisher->publishPlayerMarketStatus($player, $previousStatus);
        }
        $this->entityManager->flush();

        return $this->json([
            'message' => 'Le statut du joueur a été mis à jour.',
            'status' => $status->value,
            'marketContext' => $this->marketContextResolver->resolve($player),
        ]);
    }

    private function getOrCreateAgent(): Agent|JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User || !in_array('ROLE_AGENT', $user->getRoles(), true)) {
            return $this->json(['message' => 'Accès réservé aux agents.'], JsonResponse::HTTP_FORBIDDEN);
        }

        $agent = $this->agentRepository->findOneBy(['user' => $user]);
        if ($agent instanceof Agent) {
            return $agent;
        }

        $agent = (new Agent())->setUser($user);
        $user->setAgentProfile($agent);
        $this->entityManager->persist($agent);
        $this->entityManager->flush();

        return $agent;
    }

    private function isCsrfValid(Request $request): bool
    {
        return $this->csrfTokenManager->isTokenValid(
            new CsrfToken('api_auth', (string) $request->headers->get('X-CSRF-TOKEN'))
        );
    }

    private function agentRepresentsPlayer(Agent $agent, Player $player): bool
    {
        return $player->getAgent()?->getId()?->toRfc4122() === $agent->getId()?->toRfc4122();
    }

    /**
     * @return array{canContact: bool, requiresAuthorization: bool, reason: string, state: string, actionLabel: ?string}
     */
    private function getProspectingEligibility(Player $player): array
    {
        $marketContext = $this->marketContextResolver->resolve($player);

        return [
            'canContact' => $marketContext['canAgentProspect'],
            'requiresAuthorization' => $marketContext['requiresClubAuthorization'],
            'reason' => $marketContext['message'],
            'state' => $marketContext['state'],
            'actionLabel' => $marketContext['actionLabel'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeClubProspect(
        Team $team,
        int $squadSize,
        int $positionCount,
        int $squadValue,
        Player $player,
        ?AgentClubProspect $contact,
    ): array {
        $playerValue = max(1, $player->getMarketValue() ?? 0);
        $budget = $team->getTransferBudget() ?? 0;
        $budgetRatio = $budget / $playerValue;
        $financialScore = match (true) {
            $budgetRatio >= 1.5 => 40,
            $budgetRatio >= 1 => 34,
            $budgetRatio >= 0.75 => 25,
            $budgetRatio >= 0.5 => 15,
            default => 6,
        };
        $financialFit = match (true) {
            $budgetRatio >= 1.5 => 'Très favorable',
            $budgetRatio >= 1 => 'Compatible',
            $budgetRatio >= 0.75 => 'À négocier',
            default => 'Budget contraint',
        };

        $sportingScore = match (true) {
            $positionCount <= 2 => 35,
            $positionCount <= 4 => 29,
            $positionCount <= 6 => 21,
            $positionCount <= 8 => 14,
            default => 8,
        };
        $sportingNeed = match (true) {
            $positionCount <= 2 => 'Besoin fort au poste',
            $positionCount <= 4 => 'Concurrence limitée',
            $positionCount <= 6 => 'Rotation possible',
            default => 'Secteur déjà fourni',
        };

        $squadRatio = $squadValue / $playerValue;
        $levelScore = match (true) {
            $squadRatio >= 20 => 25,
            $squadRatio >= 12 => 21,
            $squadRatio >= 7 => 16,
            default => 10,
        };
        $clubLevel = match (true) {
            $squadRatio >= 20 => 'Niveau très élevé',
            $squadRatio >= 12 => 'Club établi',
            $squadRatio >= 7 => 'Club compétitif',
            default => 'Projet en développement',
        };

        $compatibilityScore = min(100, $financialScore + $sportingScore + $levelScore);
        $interestPotential = match (true) {
            $compatibilityScore >= 82 => 'Très élevé',
            $compatibilityScore >= 68 => 'Élevé',
            $compatibilityScore >= 52 => 'Modéré',
            default => 'Faible',
        };

        return [
            'id' => $team->getId()?->toRfc4122(),
            'name' => $team->getName(),
            'logoUrl' => $team->getLogoUrl(),
            'country' => $team->getCountry(),
            'league' => $team->getLeague(),
            'transferBudget' => $this->formatMoney($budget),
            'transferBudgetValue' => $budget / 100,
            'squadSize' => $squadSize,
            'positionCount' => $positionCount,
            'sportingNeed' => $sportingNeed,
            'financialFit' => $financialFit,
            'clubLevel' => $clubLevel,
            'interestPotential' => $interestPotential,
            'compatibilityScore' => $compatibilityScore,
            'contact' => $contact ? $this->serializeContact($contact) : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeContact(AgentClubProspect $prospect): array
    {
        return [
            'id' => $prospect->getId()?->toRfc4122(),
            'teamId' => $prospect->getTeam()?->getId()?->toRfc4122(),
            'status' => $prospect->getStatus()->value,
            'message' => $prospect->getMessage(),
            'createdAt' => $prospect->getCreatedAt()?->format(DATE_ATOM),
            'updatedAt' => $prospect->getUpdatedAt()?->format(DATE_ATOM),
        ];
    }

    private function buildSuggestedMessage(Player $player): string
    {
        $playerName = trim(($player->getFirstName() ?? '').' '.($player->getLastName() ?? ''));
        $clubName = $player->getTeam()?->getName();
        $situation = null !== $clubName
            ? sprintf('actuellement à %s', $clubName)
            : 'actuellement libre';

        return sprintf(
            "Bonjour,\n\nJe représente %s, %s de %d ans, %s. Son profil pourrait correspondre à votre projet sportif et nous souhaiterions connaître votre intérêt.\n\nJe reste disponible pour vous transmettre son dossier complet et échanger sur les conditions possibles.\n\nCordialement,",
            $playerName,
            $player->getPosition() ?? 'joueur',
            null === $player->getBirthDate() ? 0 : (int) $player->getBirthDate()->diff(new \DateTimeImmutable())->y,
            $situation,
        );
    }

    private function nullableString(mixed $value): ?string
    {
        $value = trim((string) $value);

        return '' === $value ? null : $value;
    }

    private function guardHandoverDecision(PlayerAgentRequest $representationRequest, Agent $agent): ?JsonResponse
    {
        if (PlayerAgentRequestTypeEnum::AGENT_HANDOVER !== $representationRequest->getType()) {
            return $this->json(['message' => 'Cette demande n’est pas une passation agent.'], JsonResponse::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (PlayerAgentRequestStatusEnum::PENDING === $representationRequest->getStatus()) {
            return $this->json(['message' => 'Cette demande attend encore la validation de l’administration.'], JsonResponse::HTTP_CONFLICT);
        }

        if (PlayerAgentRequestStatusEnum::ADMIN_APPROVED !== $representationRequest->getStatus()) {
            return $this->json(['message' => 'Cette demande a déjà été traitée.'], JsonResponse::HTTP_CONFLICT);
        }

        if ($representationRequest->getCurrentAgent()?->getId()?->toRfc4122() !== $agent->getId()?->toRfc4122()) {
            return $this->json(['message' => 'Vous ne pouvez pas traiter cette demande.'], JsonResponse::HTTP_FORBIDDEN);
        }

        if ($representationRequest->getPlayer()?->getAgent()?->getId()?->toRfc4122() !== $agent->getId()?->toRfc4122()) {
            return $this->json(['message' => 'Vous ne représentez plus ce joueur.'], JsonResponse::HTTP_CONFLICT);
        }

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeAgentRequest(PlayerAgentRequest $representationRequest): array
    {
        $requestingAgent = $representationRequest->getAgent();
        $currentAgent = $representationRequest->getCurrentAgent();

        return [
            'id' => $representationRequest->getId()?->toRfc4122(),
            'type' => $representationRequest->getType()->value,
            'status' => $representationRequest->getStatus()->value,
            'createdAt' => $representationRequest->getCreatedAt()?->format(DATE_ATOM),
            'decidedAt' => $representationRequest->getDecidedAt()?->format(DATE_ATOM),
            'message' => $representationRequest->getMessage(),
            'player' => [
                'id' => $representationRequest->getPlayer()?->getId()?->toRfc4122(),
                'firstName' => $representationRequest->getPlayer()?->getFirstName(),
                'lastName' => $representationRequest->getPlayer()?->getLastName(),
            ],
            'requestingAgent' => $requestingAgent ? [
                'id' => $requestingAgent->getId()?->toRfc4122(),
                'name' => $requestingAgent->getAgencyName()
                    ?: trim(sprintf('%s %s', $requestingAgent->getUser()?->getFirstName(), $requestingAgent->getUser()?->getLastName())),
            ] : null,
            'currentAgent' => $currentAgent ? [
                'id' => $currentAgent->getId()?->toRfc4122(),
                'name' => $currentAgent->getAgencyName()
                    ?: trim(sprintf('%s %s', $currentAgent->getUser()?->getFirstName(), $currentAgent->getUser()?->getLastName())),
            ] : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializePlayer(Player $player): array
    {
        $team = $player->getTeam();
        $agent = $player->getAgent();
        $birthDate = $player->getBirthDate();

        return [
            'id' => $player->getId()?->toRfc4122(),
            'firstName' => $player->getFirstName(),
            'lastName' => $player->getLastName(),
            'photoUrl' => $player->getPhotoUrl(),
            'age' => null === $birthDate ? 0 : (int) $birthDate->diff(new \DateTimeImmutable())->y,
            'position' => $player->getPosition(),
            'nationality' => $player->getNationality() ?? 'Inconnue',
            'country' => $team?->getCountry() ?? '',
            'league' => $team?->getLeague() ?? '',
            'club' => $team?->getName() ?? 'Sans club',
            'clubLogoUrl' => $team?->getLogoUrl(),
            'agent' => $agent ? [
                'id' => $agent->getId()?->toRfc4122(),
                'name' => $agent->getAgencyName()
                    ?: trim(sprintf('%s %s', $agent->getUser()?->getFirstName(), $agent->getUser()?->getLastName())),
            ] : null,
            'transferStatus' => $this->marketStatusLabel($player->getMarketStatus()),
            'marketValue' => $this->formatMoney($player->getMarketValue()),
            'weeklySalary' => $this->formatMoney($player->getWeeklySalary()),
            'releaseClause' => $this->formatMoney($player->getReleaseClause(), true),
            'contractEndDate' => $player->getContractEndDate()?->format('Y-m-d'),
            'contractStatus' => $player->getContractStatus()?->value,
            'marketStatusValue' => $player->getMarketStatus()?->value,
            'marketContext' => $this->marketContextResolver->resolve($player),
        ];
    }

    private function marketStatusLabel(?PlayerMarketStatusEnum $status): string
    {
        return match ($status) {
            PlayerMarketStatusEnum::ON_MARKET => 'Sur le marché',
            PlayerMarketStatusEnum::LOAN_LISTED => 'Disponible en prêt',
            PlayerMarketStatusEnum::NOT_LISTED => 'Non listé',
            default => 'Non listé',
        };
    }

    private function playerName(?Player $player): string
    {
        if (!$player instanceof Player) {
            return 'ce joueur';
        }

        $name = trim(sprintf('%s %s', $player->getFirstName(), $player->getLastName()));

        return '' !== $name ? $name : 'ce joueur';
    }

    private function agentName(Agent $agent): string
    {
        $name = $agent->getAgencyName()
            ?: trim(sprintf('%s %s', $agent->getUser()?->getFirstName(), $agent->getUser()?->getLastName()));

        return '' !== $name ? $name : 'Un agent';
    }

    private function formatMoney(?int $amountInCents, bool $allowNone = false): string
    {
        if (null === $amountInCents) {
            return $allowNone ? 'Aucune' : '-';
        }

        $amount = $amountInCents / 100;
        if ($amount >= 1_000_000) {
            return number_format($amount / 1_000_000, 1, ',', ' ').' M EUR';
        }
        if ($amount >= 1_000) {
            return number_format($amount / 1_000, 0, ',', ' ').' K EUR';
        }

        return number_format($amount, 0, ',', ' ').' EUR';
    }
}
