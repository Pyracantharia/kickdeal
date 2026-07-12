<?php

namespace App\Controller;

use App\Entity\Player;
use App\Entity\User;
use App\Enum\PlayerAvailabilityStatusEnum;
use App\Enum\PlayerMarketStatusEnum;
use App\Repository\PlayerRepository;
use App\Repository\AgentRepository;
use App\Repository\TeamRepository;
use App\Repository\TeamMembershipRepository;
use App\Service\Player\PlayerMarketContextResolver;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/players')]
final class PlayerController extends AbstractController
{
    public function __construct(
        private readonly PlayerMarketContextResolver $marketContextResolver,
    ) {
    }

    #[Route('/agent-roster', name: 'app_player_agent_roster', methods: ['GET'])]
    public function agentRoster(
        #[CurrentUser] ?User $user,
        AgentRepository $agentRepository,
        PlayerRepository $playerRepository,
    ): JsonResponse {
        if (!$user) {
            return $this->json([
                'errorMessage' => 'Utilisateur non authentifié.',
            ], 401);
        }

        $agent = $agentRepository->findOneBy(['user' => $user]);

        if (null === $agent) {
            return $this->json(['players' => []]);
        }

        return $this->json([
            'players' => array_map(
                fn (Player $player): array => $this->serializeMarketPlayer($player),
                $playerRepository->findRepresentedByAgent($agent),
            ),
        ]);
    }

    #[Route('/club-roster', name: 'app_player_club_roster', methods: ['GET'])]
    public function clubRoster(
        #[CurrentUser] ?User $user,
        TeamMembershipRepository $teamMembershipRepository,
        PlayerRepository $playerRepository,
    ): JsonResponse {
        if (!$user) {
            return $this->json([
                'errorMessage' => 'Utilisateur non authentifie.',
            ], 401);
        }

        $membership = $teamMembershipRepository->findPrimaryForUser($user);

        if (null === $membership || null === $membership->getTeam()) {
            return $this->json([
                'players' => [],
            ]);
        }

        $players = array_map(
            fn (Player $player): array => $this->serializeClubRosterPlayer($player),
            $playerRepository->findRosterForTeam($membership->getTeam()),
        );

        return $this->json([
            'players' => $players,
        ]);
    }

    #[Route('/team/{teamId}/roster', name: 'app_player_team_roster', methods: ['GET'])]
    public function teamRoster(
        string $teamId,
        TeamRepository $teamRepository,
        PlayerRepository $playerRepository,
    ): JsonResponse {
        $team = $teamRepository->find($teamId);

        if (null === $team) {
            return $this->json([
                'errorMessage' => 'Club introuvable.',
            ], 404);
        }

        $players = array_map(
            fn (Player $player): array => $this->serializeClubRosterPlayer($player),
            $playerRepository->findRosterForTeam($team),
        );

        return $this->json([
            'players' => $players,
        ]);
    }

    #[Route('', name: 'app_player_list', methods: ['GET'])]
    public function list(PlayerRepository $playerRepository): JsonResponse
    {
        $players = array_map(
            fn (Player $player): array => $this->serializeMarketPlayer($player),
            $playerRepository->findAllWithRelations(),
        );

        return $this->json([
            'players' => $players,
        ]);
    }

    #[Route('/{id}', name: 'app_player_show', methods: ['GET'])]
    public function show(Player $player): JsonResponse
    {
        return $this->json($this->serializeMarketPlayer($player));
    }

    private function serializeMarketPlayer(Player $player): array
    {
        $team = $player->getTeam();

        return [
            'id' => $player->getId()?->toRfc4122(),
            'firstName' => $player->getFirstName(),
            'lastName' => $player->getLastName(),
            'photoUrl' => $player->getPhotoUrl(),
            'age' => $this->getAge($player),
            'position' => $player->getPosition(),
            'nationality' => $player->getNationality() ?? 'Inconnue',
            'country' => $team?->getCountry() ?? '',
            'league' => $team?->getLeague() ?? '',
            'club' => $team?->getName() ?? 'Sans club',
            'clubLogoUrl' => $team?->getLogoUrl(),
            'transferStatus' => $this->getMarketStatusLabel($player->getMarketStatus()),
            'height' => $player->getHeightCm(),
            'weight' => $player->getWeightKg(),
            'foot' => $player->getPreferredFoot(),
            'marketValue' => $this->formatMoney($player->getMarketValue()),
            'weeklySalary' => $this->formatMoney($player->getWeeklySalary()),
            'releaseClause' => $this->formatMoney($player->getReleaseClause(), true),
            'contractEndDate' => $player->getContractEndDate()?->format('Y-m-d'),
            'contractStatus' => $player->getContractStatus()?->value,
            'marketStatusValue' => $player->getMarketStatus()?->value,
            'marketContext' => $this->marketContextResolver->resolve($player),
        ];
    }

    private function serializeClubRosterPlayer(Player $player): array
    {
        return [
            'id' => $player->getId()?->toRfc4122(),
            'firstName' => $player->getFirstName(),
            'lastName' => $player->getLastName(),
            'photoUrl' => $player->getPhotoUrl(),
            'position' => $player->getPosition(),
            'age' => $this->getAge($player),
            'height' => $player->getHeightCm() ?? 0,
            'weight' => $player->getWeightKg() ?? 0,
            'foot' => $player->getPreferredFoot() ?? 'Inconnu',
            'marketValue' => $this->formatMoney($player->getMarketValue()),
            'weeklySalary' => $this->formatWeeklySalary($player->getWeeklySalary()),
            'contract' => (string) $this->getRemainingContractYears($player),
            'status' => $this->getAvailabilityStatusLabel($player->getAvailabilityStatus()),
            'nationality' => $player->getNationality() ?? 'Inconnue',
            'joinDate' => $player->getJoinedAt()?->format('Y-m-d') ?? '',
            'agentName' => $player->getAgent()?->getAgencyName(),
            'contractStatus' => $player->getContractStatus()?->value,
            'marketStatusValue' => $player->getMarketStatus()?->value,
            'marketContext' => $this->marketContextResolver->resolve($player),
        ];
    }

    private function getAge(Player $player): int
    {
        $birthDate = $player->getBirthDate();

        if (null === $birthDate) {
            return 0;
        }

        return (int) $birthDate->diff(new \DateTimeImmutable())->y;
    }

    private function getRemainingContractYears(Player $player): int
    {
        $contractEndDate = $player->getContractEndDate();

        if (null === $contractEndDate) {
            return 0;
        }

        $today = new \DateTimeImmutable('today');
        if ($contractEndDate < $today) {
            return 0;
        }

        $interval = $today->diff($contractEndDate);
        $years = (int) $interval->y;

        return $interval->m > 0 || $interval->d > 0 ? $years + 1 : $years;
    }

    private function formatMoney(?int $amountInCents, bool $allowNone = false): string
    {
        if (null === $amountInCents) {
            return $allowNone ? 'Aucun(e)' : '-';
        }

        $amount = $amountInCents / 100;

        if ($amount >= 1_000_000_000) {
            return number_format($amount / 1_000_000_000, 1, ',', ' ').' Md EUR';
        }

        if ($amount >= 1_000_000) {
            return number_format($amount / 1_000_000, 1, ',', ' ').' M EUR';
        }

        if ($amount >= 1_000) {
            return number_format($amount / 1_000, 0, ',', ' ').' K EUR';
        }

        return number_format($amount, 0, ',', ' ').' EUR';
    }

    private function formatWeeklySalary(?int $amountInCents): string
    {
        if (null === $amountInCents) {
            return '-';
        }

        $amount = $amountInCents / 100;

        if ($amount >= 1_000_000) {
            return number_format($amount / 1_000_000, 1, ',', ' ').' MEUR/sem';
        }

        if ($amount >= 1_000) {
            return number_format($amount / 1_000, 0, ',', ' ').' kEUR/sem';
        }

        return number_format($amount, 0, ',', ' ').' EUR/sem';
    }

    private function getMarketStatusLabel(?PlayerMarketStatusEnum $status): string
    {
        return match ($status) {
            PlayerMarketStatusEnum::ON_MARKET => 'Sur le marche',
            PlayerMarketStatusEnum::LOAN_LISTED => 'Liste de pret',
            PlayerMarketStatusEnum::NOT_LISTED => 'Non liste',
            default => 'Inconnu',
        };
    }

    private function getAvailabilityStatusLabel(?PlayerAvailabilityStatusEnum $status): string
    {
        return match ($status) {
            PlayerAvailabilityStatusEnum::NORMAL => 'Normal',
            PlayerAvailabilityStatusEnum::INJURED => 'Blesse',
            PlayerAvailabilityStatusEnum::SUSPENDED => 'Suspendu',
            default => 'Normal',
        };
    }
}
