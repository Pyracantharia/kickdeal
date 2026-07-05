<?php

namespace App\Controller;

use App\Entity\Agent;
use App\Entity\Contract\ContractNegociation;
use App\Entity\Contract\ContractOffer;
use App\Entity\Player;
use App\Entity\Team;
use App\Entity\Transfer\TransferNegociation;
use App\Entity\User;
use App\Enum\TransferNegociationStatusEnum;
use App\Enum\ContractNegotiationTypeEnum;
use App\Enum\OfferStatusEnum;
use App\Enum\PlayerContractNegociationStatusEnum;
use App\Enum\PlayerMarketStatusEnum;
use App\Repository\AgentRepository;
use App\Repository\AppNotificationRepository;
use App\Repository\PlayerRepository;
use App\Repository\Contract\ContractOfferRepository;
use App\Repository\Contract\ContractMessageRepository;
use App\Repository\Contract\ContractNegociationRepository;
use App\Repository\TeamMembershipRepository;
use App\Repository\Transfer\TransferMessageRepository;
use App\Repository\Transfer\TransferNegociationRepository;
use App\Repository\Transfer\TransferOfferRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/dashboard')]
final class DashboardController extends AbstractController
{
    #[Route('/home', name: 'app_dashboard_home', methods: ['GET'])]
    public function home(
        #[CurrentUser] ?User $user,
        TeamMembershipRepository $teamMembershipRepository,
        TransferNegociationRepository $transferNegociationRepository,
        TransferOfferRepository $transferOfferRepository,
        TransferMessageRepository $transferMessageRepository,
        ContractMessageRepository $contractMessageRepository,
        ContractNegociationRepository $contractNegociationRepository,
        AppNotificationRepository $notificationRepository,
    ): JsonResponse {
        if (!$user) {
            return $this->json([
                'errorMessage' => 'Utilisateur non authentifié.',
            ], 401);
        }

        $membership = $teamMembershipRepository->findPrimaryForUser($user);

        if (null === $membership || null === $membership->getTeam()) {
            return $this->json([
                'activeDeal' => null,
                'pendingOffersCount' => 0,
                'unreadMessagesCount' => 0,
                'pendingRenewalsCount' => 0,
            ]);
        }

        $team = $membership->getTeam();
        $teamUserIds = $teamMembershipRepository->findUserIdsByTeam($team);
        $activeDeal = $transferNegociationRepository->findLatestActiveForTeam($team);

        return $this->json([
            'activeDeal' => $this->serializeActiveDeal($activeDeal, $team),
            'pendingOffersCount' => $transferOfferRepository->countPendingReceivedByTeam($team),
            'unreadMessagesCount' => $notificationRepository->countUnreadForUserByCategory($user, 'messages')
                + $transferMessageRepository->countIncomingForTeam($team, $teamUserIds)
                + $contractMessageRepository->countIncomingForTeam($team, $teamUserIds),
            'pendingRenewalsCount' => $contractNegociationRepository->countPendingForTeam($team),
        ]);
    }

    #[Route('/agent', name: 'app_dashboard_agent', methods: ['GET'])]
    public function agentHome(
        #[CurrentUser] ?User $user,
        AgentRepository $agentRepository,
        PlayerRepository $playerRepository,
        ContractNegociationRepository $contractNegociationRepository,
        ContractOfferRepository $contractOfferRepository,
    ): JsonResponse {
        if (!$user) {
            return $this->json([
                'errorMessage' => 'Utilisateur non authentifié.',
            ], 401);
        }

        $agent = $agentRepository->findOneBy(['user' => $user]);

        if (!$agent instanceof Agent) {
            return $this->json([
                'profile' => null,
                'stats' => [
                    'representedPlayers' => 0,
                    'activeNegotiations' => 0,
                    'pendingOffers' => 0,
                    'availablePlayers' => 0,
                ],
                'players' => [],
                'negotiations' => [],
            ]);
        }

        $players = $playerRepository->findRepresentedByAgent($agent);
        $recentPlayers = array_slice($players, 0, 4);
        $recentNegotiations = $contractNegociationRepository->findRecentForAgent($agent, 4);

        return $this->json([
            'profile' => [
                'agencyName' => $agent->getAgencyName(),
                'country' => $agent->getCountry(),
            ],
            'stats' => [
                'representedPlayers' => count($players),
                'activeNegotiations' => $contractNegociationRepository->countActiveForAgent($agent),
                'pendingOffers' => $contractOfferRepository->countPendingForAgent($agent),
                'availablePlayers' => count(array_filter(
                    $players,
                    static fn (Player $player): bool => PlayerMarketStatusEnum::NOT_LISTED !== $player->getMarketStatus(),
                )),
            ],
            'players' => array_map(
                fn (Player $player): array => $this->serializeAgentPlayer($player),
                $recentPlayers,
            ),
            'negotiations' => array_map(
                fn (ContractNegociation $negociation): array => $this->serializeAgentNegotiation($negociation),
                $recentNegotiations,
            ),
        ]);
    }

    private function serializeActiveDeal(?TransferNegociation $negociation, Team $team): ?array
    {
        if (null === $negociation) {
            return null;
        }

        $listing = $negociation->getListing();
        $player = $listing?->getPlayer();
        $sellerTeam = $listing?->getSellerTeam();
        $buyerTeam = $negociation->getBuyerTeam();
        $eventDate = $negociation->getUpdatedAt() ?? $negociation->getCreatedAt();

        return [
            'id' => $negociation->getId()?->toRfc4122(),
            'type' => 'transfer',
            'typeLabel' => 'Transfert',
            'eventLabel' => 'Deal transfert',
            'eventDate' => $eventDate?->format(\DateTimeInterface::ATOM),
            'homeClub' => $sellerTeam?->getName(),
            'homeClubLogoUrl' => $sellerTeam?->getLogoUrl(),
            'awayClub' => $buyerTeam?->getName(),
            'awayClubLogoUrl' => $buyerTeam?->getLogoUrl(),
            'playerName' => trim(sprintf('%s %s', $player?->getFirstName() ?? '', $player?->getLastName() ?? '')),
            'status' => [
                'value' => $negociation->getStatus()?->value,
                'label' => $this->getTransferStatusLabel($negociation->getStatus()),
            ],
            'isCurrentClubBuyer' => $buyerTeam?->getId()?->equals($team->getId()),
        ];
    }

    private function getTransferStatusLabel(?TransferNegociationStatusEnum $status): string
    {
        return match ($status) {
            TransferNegociationStatusEnum::OPEN => 'Négociation ouverte',
            TransferNegociationStatusEnum::COUNTER_OFFER => 'Contre-offre en cours',
            TransferNegociationStatusEnum::PERMISSION_TO_SPEAK => 'Permission de discuter',
            TransferNegociationStatusEnum::AGREED_CLUBS => 'Accord entre clubs',
            TransferNegociationStatusEnum::COMPLETED => 'Transfert conclu',
            TransferNegociationStatusEnum::EXPIRED => 'Négociation expirée',
            TransferNegociationStatusEnum::REJECTED => 'Négociation rejetée',
            default => 'Statut inconnu',
        };
    }

    private function serializeAgentPlayer(Player $player): array
    {
        $team = $player->getTeam();

        return [
            'id' => $player->getId()?->toRfc4122(),
            'firstName' => $player->getFirstName(),
            'lastName' => $player->getLastName(),
            'photoUrl' => $player->getPhotoUrl(),
            'position' => $player->getPosition(),
            'age' => $this->getPlayerAge($player),
            'club' => $team?->getName() ?? 'Sans club',
            'clubLogoUrl' => $team?->getLogoUrl(),
            'marketStatus' => $this->getPlayerMarketStatusLabel($player->getMarketStatus()),
            'marketStatusValue' => $player->getMarketStatus()?->value,
            'contractEndDate' => $player->getContractEndDate()?->format('Y-m-d'),
            'marketValue' => $this->formatMoney($player->getMarketValue()),
        ];
    }

    private function serializeAgentNegotiation(ContractNegociation $negociation): array
    {
        $offers = $negociation->getContractOffers()->toArray();
        usort(
            $offers,
            static fn (ContractOffer $left, ContractOffer $right): int =>
                ($right->getUpdatedAt()?->getTimestamp() ?? 0) <=> ($left->getUpdatedAt()?->getTimestamp() ?? 0),
        );

        $latestOffer = $offers[0] ?? null;
        $player = $negociation->getPlayer();
        $buyerTeam = $negociation->getBuyerTeam();

        return [
            'id' => $negociation->getId()?->toRfc4122(),
            'player' => $player ? $this->serializeAgentPlayer($player) : null,
            'club' => [
                'name' => $buyerTeam?->getName() ?? 'Club inconnu',
                'logoUrl' => $buyerTeam?->getLogoUrl(),
            ],
            'status' => [
                'value' => $negociation->getStatus()?->value,
                'label' => $this->getContractNegotiationStatusLabel($negociation->getStatus()),
            ],
            'updatedAt' => ($negociation->getUpdatedAt() ?? $negociation->getCreatedAt())?->format(\DateTimeInterface::ATOM),
            'latestOffer' => $latestOffer instanceof ContractOffer ? [
                'annualSalary' => $this->formatMoney($latestOffer->getAnnualSalary()),
                'displayAmount' => ContractNegotiationTypeEnum::TERMINATION === $negociation->getType()
                    ? $this->formatMoney($latestOffer->getTerminationCompensation())
                    : $this->formatMoney($latestOffer->getAnnualSalary()).' / an',
                'durationMonths' => $latestOffer->getDurationMonths(),
                'status' => $latestOffer->getStatus()?->value,
                'statusLabel' => $this->getOfferStatusLabel($latestOffer->getStatus()),
            ] : null,
        ];
    }

    private function getContractNegotiationStatusLabel(?PlayerContractNegociationStatusEnum $status): string
    {
        return match ($status) {
            PlayerContractNegociationStatusEnum::OPEN => 'Discussion ouverte',
            PlayerContractNegociationStatusEnum::COUNTER_OFFER => 'Contre-offre reçue',
            PlayerContractNegociationStatusEnum::SENT_TO_PLAYER => 'Soumise au joueur',
            PlayerContractNegociationStatusEnum::PLAYER_ACCEPTED => 'Acceptée par le joueur',
            PlayerContractNegociationStatusEnum::AGENT_ACCEPTED => 'Acceptée par l’agent',
            PlayerContractNegociationStatusEnum::COMPLETED => 'Contrat finalisé',
            PlayerContractNegociationStatusEnum::EXPIRED => 'Négociation expirée',
            PlayerContractNegociationStatusEnum::REJECTED => 'Négociation refusée',
            default => 'Statut inconnu',
        };
    }

    private function getOfferStatusLabel(?OfferStatusEnum $status): string
    {
        return match ($status) {
            OfferStatusEnum::PENDING => 'En attente',
            OfferStatusEnum::ACCEPTED => 'Acceptée',
            OfferStatusEnum::REJECTED => 'Refusée',
            OfferStatusEnum::EXPIRED => 'Expirée',
            default => 'Statut inconnu',
        };
    }

    private function getPlayerMarketStatusLabel(?PlayerMarketStatusEnum $status): string
    {
        return match ($status) {
            PlayerMarketStatusEnum::ON_MARKET => 'Disponible',
            PlayerMarketStatusEnum::LOAN_LISTED => 'Disponible en prêt',
            PlayerMarketStatusEnum::NOT_LISTED => 'Non disponible',
            default => 'Statut inconnu',
        };
    }

    private function getPlayerAge(Player $player): int
    {
        return $player->getBirthDate()
            ? (int) $player->getBirthDate()->diff(new \DateTimeImmutable())->y
            : 0;
    }

    private function formatMoney(?int $amountInCents): string
    {
        if (null === $amountInCents) {
            return '-';
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
