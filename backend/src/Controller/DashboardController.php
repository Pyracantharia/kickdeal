<?php

namespace App\Controller;

use App\Entity\Team;
use App\Entity\Transfer\TransferNegociation;
use App\Entity\User;
use App\Enum\TransferNegociationStatusEnum;
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
            'pendingOffersCount' => $transferOfferRepository->countForTeam($team),
            'unreadMessagesCount' => $transferMessageRepository->countIncomingForTeam($team, $teamUserIds)
                + $contractMessageRepository->countIncomingForTeam($team, $teamUserIds),
            'pendingRenewalsCount' => $contractNegociationRepository->countPendingForTeam($team),
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
            'eventLabel' => 'Deal transfert',
            'eventDate' => $eventDate?->format(\DateTimeInterface::ATOM),
            'homeClub' => $sellerTeam?->getName(),
            'awayClub' => $buyerTeam?->getName(),
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

}
