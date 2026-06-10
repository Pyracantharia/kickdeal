<?php

namespace App\Controller;

use App\Entity\ClubRequest;
use App\Entity\Player;
use App\Entity\Team;
use App\Entity\TeamMembership;
use App\Entity\User;
use App\Enum\ClubRequestStatusEnum;
use App\Enum\MembershipRoleEnum;
use App\Enum\PlayerAvailabilityStatusEnum;
use App\Enum\PlayerContractStatusEnum;
use App\Enum\PlayerMarketStatusEnum;
use App\Enum\TeamVerificationStatusEnum;
use App\Repository\ClubRequestRepository;
use App\Repository\TeamMembershipRepository;
use App\Repository\TeamRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Csrf\CsrfToken;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Uid\Uuid;

#[Route('/api/clubs')]
final class ClubController extends AbstractController
{
    private const string CSRF_TOKEN_ID = 'api_auth';

    #[Route('/mine', name: 'app_club_mine', methods: ['GET'])]
    public function mine(
        #[CurrentUser] ?User $user,
        TeamMembershipRepository $teamMembershipRepository,
    ): JsonResponse {
        $membership = $this->getCurrentMembership($user, $teamMembershipRepository);

        if ($membership instanceof JsonResponse) {
            return $membership;
        }

        return $this->json([
            'club' => $this->serializeClubDetail($membership),
        ]);
    }

    #[Route('/mine/players', name: 'app_club_player_create', methods: ['POST'])]
    public function createPlayer(
        Request $request,
        #[CurrentUser] ?User $user,
        TeamMembershipRepository $teamMembershipRepository,
        EntityManagerInterface $entityManager,
        CsrfTokenManagerInterface $csrfTokenManager,
    ): JsonResponse {
        if ($csrfError = $this->validateCsrfToken($request, $csrfTokenManager)) {
            return $csrfError;
        }

        $membership = $this->getCurrentMembership($user, $teamMembershipRepository);

        if ($membership instanceof JsonResponse) {
            return $membership;
        }

        $team = $membership->getTeam();
        $payload = json_decode($request->getContent(), true);

        if (!is_array($payload)) {
            return $this->json([
                'errorMessage' => 'Payload invalide.',
            ], 400);
        }

        $firstName = trim((string) ($payload['firstName'] ?? ''));
        $lastName = trim((string) ($payload['lastName'] ?? ''));
        $position = trim((string) ($payload['position'] ?? ''));

        if ('' === $firstName || '' === $lastName || '' === $position) {
            return $this->json([
                'errorMessage' => 'Le prénom, le nom et le poste sont requis.',
            ], 422);
        }

        $birthDate = $this->parseDate($payload['birthDate'] ?? null);
        $contractEndDate = $this->parseDate($payload['contractEndDate'] ?? null);

        $player = (new Player())
            ->setFirstName($firstName)
            ->setLastName($lastName)
            ->setPosition($position)
            ->setBirthDate($birthDate ?? new \DateTimeImmutable('-18 years'))
            ->setNationality($this->optionalString($payload['nationality'] ?? null))
            ->setPhotoUrl($this->optionalString($payload['photoUrl'] ?? null))
            ->setHeightCm($this->optionalInt($payload['heightCm'] ?? null))
            ->setWeightKg($this->optionalInt($payload['weightKg'] ?? null))
            ->setPreferredFoot($this->optionalString($payload['preferredFoot'] ?? null))
            ->setMarketValue($this->moneyToCents($payload['marketValue'] ?? null))
            ->setWeeklySalary($this->moneyToCents($payload['weeklySalary'] ?? null))
            ->setReleaseClause($this->moneyToCents($payload['releaseClause'] ?? null))
            ->setContractStatus(PlayerContractStatusEnum::UNDER_CONTRACT)
            ->setContractEndDate($contractEndDate)
            ->setJoinedAt(new \DateTimeImmutable('today'))
            ->setMarketStatus(PlayerMarketStatusEnum::NOT_LISTED)
            ->setAvailabilityStatus(PlayerAvailabilityStatusEnum::NORMAL)
            ->setTeam($team);

        $entityManager->persist($player);
        $entityManager->flush();

        return $this->json([
            'message' => 'Joueur créé avec succès.',
            'club' => $this->serializeClubDetail($membership),
        ], 201);
    }

    #[Route('/mine/budget', name: 'app_club_budget_update', methods: ['PUT', 'PATCH'])]
    public function updateBudget(
        Request $request,
        #[CurrentUser] ?User $user,
        TeamMembershipRepository $teamMembershipRepository,
        EntityManagerInterface $entityManager,
        CsrfTokenManagerInterface $csrfTokenManager,
    ): JsonResponse {
        if ($csrfError = $this->validateCsrfToken($request, $csrfTokenManager)) {
            return $csrfError;
        }

        $membership = $this->getCurrentMembership($user, $teamMembershipRepository);

        if ($membership instanceof JsonResponse) {
            return $membership;
        }

        $payload = json_decode($request->getContent(), true);

        if (!is_array($payload) || !array_key_exists('totalBudget', $payload)) {
            return $this->json([
                'errorMessage' => 'Budget requis.',
            ], 422);
        }

        $budget = $this->moneyToCents($payload['totalBudget']);

        if (null === $budget || $budget < 0) {
            return $this->json([
                'errorMessage' => 'Budget invalide.',
            ], 422);
        }

        $membership->getTeam()->setTransferBudget($budget);

        $entityManager->flush();

        return $this->json([
            'message' => 'Budget mis à jour.',
            'club' => $this->serializeClubDetail($membership),
        ]);
    }

    #[Route('/join', name: 'app_club_join', methods: ['POST'])]
    public function join(
        Request $request,
        #[CurrentUser] ?User $user,
        TeamRepository $teamRepository,
        TeamMembershipRepository $teamMembershipRepository,
        EntityManagerInterface $entityManager,
        CsrfTokenManagerInterface $csrfTokenManager,
    ): JsonResponse {
        if ($csrfError = $this->validateCsrfToken($request, $csrfTokenManager)) {
            return $csrfError;
        }

        if (!$user) {
            return $this->json([
                'errorMessage' => 'Utilisateur non authentifié.',
            ], 401);
        }

        $payload = json_decode($request->getContent(), true);
        $invitationCode = trim((string) ($payload['invitationCode'] ?? ''));

        if ('' === $invitationCode) {
            return $this->json([
                'errorMessage' => 'Code d’invitation requis.',
            ], 422);
        }

        $team = $this->resolveTeamFromInvitationCode($teamRepository, $invitationCode);

        if (!$team instanceof Team) {
            return $this->json([
                'errorMessage' => 'Code d’invitation invalide.',
            ], 404);
        }

        $existingMembership = $teamMembershipRepository->findOneBy([
            'user' => $user,
            'team' => $team,
        ]);

        if ($existingMembership instanceof TeamMembership) {
            return $this->json([
                'errorMessage' => 'Vous êtes déjà membre de ce club.',
            ], 409);
        }

        if (!$this->teamHasAvailableSeat($team, $teamMembershipRepository)) {
            return $this->json([
                'errorMessage' => 'La limite de comptes du club est atteinte. Le gestionnaire doit passer sur une offre supérieure.',
            ], 402);
        }

        $hasPrimaryMembership = $teamMembershipRepository->findOneBy([
            'user' => $user,
            'primary' => true,
        ]);

        $membership = (new TeamMembership())
            ->setUser($user)
            ->setTeam($team)
            ->setRole(MembershipRoleEnum::STAFF)
            ->setPrimary(null === $hasPrimaryMembership);

        $entityManager->persist($membership);
        $entityManager->flush();

        return $this->json([
            'message' => 'Club rejoint avec succès.',
            'club' => $this->serializeClubDetail($membership),
        ], 201);
    }

    #[Route('/search', name: 'app_club_search', methods: ['GET'])]
    public function search(Request $request, TeamRepository $teamRepository): JsonResponse
    {
        $query = $request->query->getString('query', '');
        $league = trim($request->query->getString('league', ''));

        $teams = '' !== $league
            ? $teamRepository->findByLeague($league)
            : $teamRepository->searchByQuery($query, 30);

        $clubs = array_map(static fn (Team $team): array => [
            'id' => $team->getId()?->toRfc4122(),
            'name' => $team->getName(),
            'league' => $team->getLeague() ?? '',
            'country' => $team->getCountry() ?? '',
            'logoUrl' => $team->getLogoUrl(),
            'isClaimed' => !$team->getTeamMemberships()->isEmpty(),
        ], $teams);

        return $this->json([
            'clubs' => $clubs,
        ]);
    }

    #[Route('/leagues', name: 'app_club_leagues', methods: ['GET'])]
    public function leagues(TeamRepository $teamRepository): JsonResponse
    {
        return $this->json([
            'leagues' => $teamRepository->findAvailableLeagues(),
        ]);
    }

    #[Route('/requests/mine', name: 'app_club_request_mine', methods: ['GET'])]
    public function myRequest(
        #[CurrentUser] ?User $user,
        ClubRequestRepository $clubRequestRepository,
        TeamMembershipRepository $teamMembershipRepository,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        if (!$user) {
            return $this->json([
                'errorMessage' => 'Utilisateur non authentifié.',
            ], 401);
        }

        $clubRequest = $clubRequestRepository->findLatestUnresolvedForUser($user);

        if ($clubRequest instanceof ClubRequest && ClubRequestStatusEnum::APPROVED === $clubRequest->getStatus()) {
            $this->ensureApprovedClubMembership($clubRequest, $teamMembershipRepository, $entityManager);
        }

        $membership = $teamMembershipRepository->findPrimaryForUser($user);

        return $this->json([
            'clubRequest' => $clubRequest instanceof ClubRequest ? $this->serializeClubRequest($clubRequest) : null,
            'hasClubAccess' => $membership instanceof TeamMembership && null !== $membership->getTeam(),
        ]);
    }

    #[Route('/requests', name: 'app_club_request_create', methods: ['POST'])]
    public function createRequest(
        Request $request,
        #[CurrentUser] ?User $user,
        TeamRepository $teamRepository,
        TeamMembershipRepository $teamMembershipRepository,
        ClubRequestRepository $clubRequestRepository,
        EntityManagerInterface $entityManager,
        CsrfTokenManagerInterface $csrfTokenManager,
    ): JsonResponse {
        if ($csrfError = $this->validateCsrfToken($request, $csrfTokenManager)) {
            return $csrfError;
        }

        if (!$user) {
            return $this->json([
                'errorMessage' => 'Utilisateur non authentifié.',
            ], 401);
        }

        $teamId = trim((string) $request->request->get('teamId', ''));
        $clubName = trim((string) $request->request->get('clubName', ''));
        $league = trim((string) $request->request->get('league', ''));
        $country = trim((string) $request->request->get('country', ''));

        $verificationEmail = trim((string) $request->request->get('verificationEmail', ''));
        $verificationMessage = trim((string) $request->request->get('verificationMessage', ''));
        $verificationDocument = $request->files->get('verificationDocument');

        if ('' === $teamId && '' === $clubName) {
            return $this->json([
                'errorMessage' => 'Le club sélectionné est requis.',
            ], 422);
        }

        if ('' === $verificationEmail && '' === $verificationMessage && !$verificationDocument instanceof UploadedFile) {
            return $this->json([
                'errorMessage' => 'Au moins une méthode de vérification est requise.',
            ], 422);
        }

        if ('' !== $verificationEmail && !filter_var($verificationEmail, FILTER_VALIDATE_EMAIL)) {
            return $this->json([
                'errorMessage' => 'Email professionnel invalide.',
            ], 422);
        }

        $team = $this->resolveTeam($teamRepository, $entityManager, $teamId, $clubName, $league, $country);

        if (!$team) {
            return $this->json([
                'errorMessage' => 'Club introuvable.',
            ], 404);
        }

        $pendingRequest = $clubRequestRepository->findLatestUnresolvedForUser($user);

        if ($pendingRequest instanceof ClubRequest) {
            return $this->json([
                'errorMessage' => ClubRequestStatusEnum::APPROVED === $pendingRequest->getStatus()
                    ? 'Votre demande de gestion a déjà été validée.'
                    : 'Vous avez déjà une demande de gestion de club en attente de validation.',
                'clubRequest' => $this->serializeClubRequest($pendingRequest),
            ], 409);
        }

        if ($clubRequestRepository->hasPendingRequest($user, $team)) {
            return $this->json([
                'errorMessage' => 'Une demande de gestion est déjà en attente pour ce club.',
            ], 409);
        }

        $existingMembership = $teamMembershipRepository->findOneBy(['user' => $user, 'team' => $team]);

        if ($existingMembership instanceof TeamMembership) {
            return $this->json([
                'errorMessage' => 'Vous êtes déjà rattaché à ce club.',
            ], 409);
        }

        if ($teamMembershipRepository->countByTeam($team) > 0) {
            return $this->json([
                'errorMessage' => 'Ce club est déjà géré sur KickDeal. Demandez un code d’invitation au gestionnaire principal pour le rejoindre.',
            ], 409);
        }

        $clubRequest = (new ClubRequest())
            ->setRequester($user)
            ->setTeam($team)
            ->setVerificationEmail('' === $verificationEmail ? null : $verificationEmail)
            ->setVerificationMessage('' === $verificationMessage ? null : $verificationMessage);

        if ($verificationDocument instanceof UploadedFile) {
            $uploadResult = $this->storeVerificationDocument($verificationDocument);

            if (null === $uploadResult) {
                return $this->json([
                    'errorMessage' => 'Impossible de sauvegarder le document de vérification.',
                ], 500);
            }

            $clubRequest
                ->setVerificationDocumentPath($uploadResult['path'])
                ->setVerificationDocumentOriginalName($uploadResult['originalName']);
        }

        if (null === $team->getVerificationStatus()) {
            $team->setVerificationStatus(TeamVerificationStatusEnum::PENDING);
        }

        $entityManager->persist($clubRequest);
        $entityManager->flush();

        return $this->json([
            'message' => 'Demande de gestion soumise avec succès.',
            'clubRequestId' => $clubRequest->getId()?->toRfc4122(),
            'teamId' => $team->getId()?->toRfc4122(),
            'clubRequest' => $this->serializeClubRequest($clubRequest),
        ], 201);
    }

    private function validateCsrfToken(Request $request, CsrfTokenManagerInterface $csrfTokenManager): ?JsonResponse
    {
        $token = $request->headers->get('X-CSRF-TOKEN');

        if (!$token || !$csrfTokenManager->isTokenValid(new CsrfToken(self::CSRF_TOKEN_ID, $token))) {
            return $this->json([
                'errorMessage' => 'Token CSRF invalide.',
            ], 403);
        }

        return null;
    }

    private function getCurrentMembership(?User $user, TeamMembershipRepository $teamMembershipRepository): TeamMembership|JsonResponse
    {
        if (!$user) {
            return $this->json([
                'errorMessage' => 'Utilisateur non authentifié.',
            ], 401);
        }

        $membership = $teamMembershipRepository->findPrimaryForUser($user);

        if (!$membership instanceof TeamMembership || null === $membership->getTeam()) {
            return $this->json([
                'errorMessage' => 'Aucun club associé à votre compte.',
            ], 403);
        }

        return $membership;
    }

    private function serializeClubDetail(TeamMembership $membership): array
    {
        $team = $membership->getTeam();
        $players = $team->getPlayers()->toArray();
        $activeListings = $team->getListings()->filter(
            static fn ($listing): bool => 'active' === $listing->getStatus()?->value,
        );
        $totalSalaries = array_sum(array_map(
            static fn (Player $player): int => $player->getWeeklySalary() ?? 0,
            $players,
        ));
        $playerValue = array_sum(array_map(
            static fn (Player $player): int => $player->getMarketValue() ?? 0,
            $players,
        ));
        $transferBudget = $team->getTransferBudget() ?? 0;

        return [
            'id' => $team->getId()?->toRfc4122(),
            'name' => $team->getName(),
            'logoUrl' => $team->getLogoUrl(),
            'league' => $team->getLeague() ?? '',
            'country' => $team->getCountry() ?? '',
            'joinDate' => $membership->getCreatedAt()?->format('Y-m-d') ?? '',
            'stats' => [
                'totalPlayers' => count($players),
                'playersOnMarket' => $activeListings->count(),
                'injuredPlayers' => count(array_filter(
                    $players,
                    static fn (Player $player): bool => PlayerAvailabilityStatusEnum::INJURED === $player->getAvailabilityStatus(),
                )),
                'offersReceived' => 0,
                'blockedOffers' => 0,
                'negotiations' => $team->getTransferNegociations()->count(),
            ],
            'finances' => [
                'totalBudget' => $this->centsToMillions($transferBudget),
                'remainingBudget' => $this->centsToMillions($transferBudget),
                'totalSalaries' => $this->centsToMillions($totalSalaries * 52),
                'playerValue' => $this->centsToMillions($playerValue),
                'recentRevenues' => 0,
            ],
            'accounts' => $this->serializeClubAccounts($membership),
        ];
    }

    private function serializeClubAccounts(TeamMembership $currentMembership): array
    {
        $team = $currentMembership->getTeam();
        $memberships = $team->getTeamMemberships()->toArray();
        usort(
            $memberships,
            static function (TeamMembership $a, TeamMembership $b): int {
                if ($a->isPrimary() !== $b->isPrimary()) {
                    return $a->isPrimary() ? -1 : 1;
                }

                return ($a->getCreatedAt()?->getTimestamp() ?? 0) <=> ($b->getCreatedAt()?->getTimestamp() ?? 0);
            },
        );

        $managerMembership = $this->findManagerMembership($memberships) ?? $currentMembership;
        $seatsIncluded = $managerMembership->getUser()?->getSubscriptionPlan()->clubSeatsIncluded();
        $usedSeats = count($memberships);

        return [
            'canManage' => MembershipRoleEnum::CLUB_MANAGER === $currentMembership->getRole(),
            'invitationCode' => $this->buildInvitationCode($team),
            'seats' => [
                'used' => $usedSeats,
                'included' => $seatsIncluded,
                'remaining' => null === $seatsIncluded ? null : max(0, $seatsIncluded - $usedSeats),
                'unlimited' => null === $seatsIncluded,
            ],
            'members' => array_map(fn (TeamMembership $membership): array => $this->serializeClubMember($membership), $memberships),
        ];
    }

    /**
     * @param TeamMembership[] $memberships
     */
    private function findManagerMembership(array $memberships): ?TeamMembership
    {
        foreach ($memberships as $membership) {
            if (MembershipRoleEnum::CLUB_MANAGER === $membership->getRole()) {
                return $membership;
            }
        }

        return $memberships[0] ?? null;
    }

    private function serializeClubMember(TeamMembership $membership): array
    {
        $user = $membership->getUser();

        return [
            'id' => $membership->getId()?->toRfc4122(),
            'userId' => $user?->getId()?->toRfc4122(),
            'name' => trim(sprintf('%s %s', $user?->getFirstName() ?? '', $user?->getLastName() ?? '')) ?: $user?->getEmail(),
            'email' => $user?->getEmail(),
            'role' => $membership->getRole()?->value,
            'roleLabel' => $this->membershipRoleLabel($membership->getRole()),
            'isPrimary' => $membership->isPrimary(),
            'joinedAt' => $membership->getCreatedAt()?->format('Y-m-d'),
        ];
    }

    private function membershipRoleLabel(?MembershipRoleEnum $role): string
    {
        return match ($role) {
            MembershipRoleEnum::CLUB_MANAGER => 'Gestionnaire',
            MembershipRoleEnum::SPORTING_DIRECTOR => 'Directeur sportif',
            MembershipRoleEnum::RECRUITER => 'Recruteur',
            MembershipRoleEnum::STAFF => 'Staff',
            null => 'Membre',
        };
    }

    private function serializeClubRequest(ClubRequest $clubRequest): array
    {
        $team = $clubRequest->getTeam();

        return [
            'id' => $clubRequest->getId()?->toRfc4122(),
            'status' => $clubRequest->getStatus()->value,
            'createdAt' => $clubRequest->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'team' => $team instanceof Team ? [
                'id' => $team->getId()?->toRfc4122(),
                'name' => $team->getName(),
                'league' => $team->getLeague() ?? '',
                'country' => $team->getCountry() ?? '',
                'logoUrl' => $team->getLogoUrl(),
            ] : null,
        ];
    }

    private function ensureApprovedClubMembership(
        ClubRequest $clubRequest,
        TeamMembershipRepository $teamMembershipRepository,
        EntityManagerInterface $entityManager,
    ): void {
        $user = $clubRequest->getRequester();
        $team = $clubRequest->getTeam();

        if (!$user instanceof User || !$team instanceof Team) {
            return;
        }

        $existingMembership = $teamMembershipRepository->findOneBy([
            'user' => $user,
            'team' => $team,
        ]);

        if ($existingMembership instanceof TeamMembership) {
            return;
        }

        $hasPrimaryMembership = $teamMembershipRepository->findOneBy([
            'user' => $user,
            'primary' => true,
        ]);

        $teamMembership = (new TeamMembership())
            ->setUser($user)
            ->setTeam($team)
            ->setRole(MembershipRoleEnum::CLUB_MANAGER)
            ->setPrimary(null === $hasPrimaryMembership);

        $entityManager->persist($teamMembership);
        $entityManager->flush();
    }

    private function parseDate(mixed $value): ?\DateTimeImmutable
    {
        if (!is_string($value) || '' === trim($value)) {
            return null;
        }

        try {
            return new \DateTimeImmutable($value);
        } catch (\Throwable) {
            return null;
        }
    }

    private function optionalString(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $value = trim($value);

        return '' === $value ? null : $value;
    }

    private function optionalInt(mixed $value): ?int
    {
        if (null === $value || '' === $value) {
            return null;
        }

        return is_numeric($value) ? (int) $value : null;
    }

    private function moneyToCents(mixed $value): ?int
    {
        if (null === $value || '' === $value || !is_numeric($value)) {
            return null;
        }

        return (int) round(((float) $value) * 100);
    }

    private function centsToMillions(int $amountInCents): float
    {
        return round($amountInCents / 100 / 1_000_000, 1);
    }

    private function resolveTeam(
        TeamRepository $teamRepository,
        EntityManagerInterface $entityManager,
        string $teamId,
        string $clubName,
        string $league,
        string $country,
    ): ?Team {
        if ('' !== $teamId && Uuid::isValid($teamId)) {
            $team = $teamRepository->find(Uuid::fromString($teamId));
            if ($team instanceof Team) {
                return $team;
            }
        }

        if ('' === $clubName) {
            return null;
        }

        $existingTeam = $teamRepository->findOneBy(['name' => $clubName]);
        if ($existingTeam instanceof Team) {
            return $existingTeam;
        }

        $team = (new Team())
            ->setName($clubName)
            ->setCountry('' === $country ? 'Inconnu' : $country)
            ->setLeague('' === $league ? 'Inconnue' : $league)
            ->setVerificationStatus(TeamVerificationStatusEnum::PENDING);

        $entityManager->persist($team);

        return $team;
    }

    private function buildInvitationCode(Team $team): string
    {
        $teamId = $team->getId()?->toRfc4122();

        if (null === $teamId) {
            return '';
        }

        return 'KD-'.strtoupper(str_replace('-', '', $teamId));
    }

    private function resolveTeamFromInvitationCode(TeamRepository $teamRepository, string $invitationCode): ?Team
    {
        $normalizedCode = strtoupper(preg_replace('/[^A-Z0-9]/', '', $invitationCode) ?? '');

        if (str_starts_with($normalizedCode, 'KD')) {
            $normalizedCode = substr($normalizedCode, 2);
        }

        if (!preg_match('/^[A-F0-9]{32}$/', $normalizedCode)) {
            return null;
        }

        $teamId = strtolower(sprintf(
            '%s-%s-%s-%s-%s',
            substr($normalizedCode, 0, 8),
            substr($normalizedCode, 8, 4),
            substr($normalizedCode, 12, 4),
            substr($normalizedCode, 16, 4),
            substr($normalizedCode, 20),
        ));

        if (!Uuid::isValid($teamId)) {
            return null;
        }

        $team = $teamRepository->find(Uuid::fromString($teamId));

        return $team instanceof Team ? $team : null;
    }

    private function teamHasAvailableSeat(Team $team, TeamMembershipRepository $teamMembershipRepository): bool
    {
        $memberships = $teamMembershipRepository->findByTeamOrdered($team);
        $managerMembership = $this->findManagerMembership($memberships);
        $seatsIncluded = $managerMembership?->getUser()?->getSubscriptionPlan()->clubSeatsIncluded();

        if (null === $seatsIncluded) {
            return true;
        }

        return count($memberships) < $seatsIncluded;
    }

    /**
     * @return array{path: string, originalName: string}|null
     */
    private function storeVerificationDocument(UploadedFile $file): ?array
    {
        $uploadDirectory = $this->getParameter('kernel.project_dir').'/public/uploads/club-verifications';

        if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0775, true) && !is_dir($uploadDirectory)) {
            return null;
        }

        $safeName = preg_replace('/[^a-zA-Z0-9\-_]/', '-', pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) ?: 'document';
        $extension = $file->guessExtension() ?? $file->getClientOriginalExtension() ?? 'bin';
        $fileName = sprintf('%s-%s.%s', $safeName, Uuid::v4()->toRfc4122(), $extension);

        try {
            $file->move($uploadDirectory, $fileName);
        } catch (\Throwable) {
            return null;
        }

        return [
            'path' => '/uploads/club-verifications/'.$fileName,
            'originalName' => $file->getClientOriginalName(),
        ];
    }
}
