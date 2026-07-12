<?php

namespace App\Service;

use App\Entity\Contract\ContractNegociation;
use App\Entity\Team;
use App\Entity\Transfer\TransferOffer;
use App\Entity\User;
use App\Repository\TeamMembershipRepository;

final class MarketRealtimePublisher
{
    public function __construct(
        private readonly MercurePublisher $mercurePublisher,
        private readonly TeamMembershipRepository $teamMembershipRepository,
    ) {
    }

    public function topicForUser(User $user): string
    {
        return sprintf('/users/%s/market', $user->getId()?->toRfc4122());
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function publishToUsers(array $users, string $type, array $payload = []): void
    {
        $topics = [];

        foreach ($users as $user) {
            if (!$user instanceof User || null === $user->getId()) {
                continue;
            }

            $topics[$user->getId()->toRfc4122()] = $this->topicForUser($user);
        }

        if ([] === $topics) {
            return;
        }

        $this->mercurePublisher->publish(array_values($topics), [
            'type' => $type,
            'payload' => $payload,
            'occurredAt' => (new \DateTimeImmutable())->format(DATE_ATOM),
        ], 'market.updated');
    }

    public function publishTransferOfferUpdate(TransferOffer $offer, string $type): void
    {
        $negociation = $offer->getTransferNegociation();
        $listing = $negociation?->getListing();
        $users = [];

        if ($listing?->getSellerTeam() instanceof Team) {
            $users = array_merge($users, $this->teamMembershipRepository->findUsersByTeam($listing->getSellerTeam()));
        }

        if ($negociation?->getBuyerTeam() instanceof Team) {
            $users = array_merge($users, $this->teamMembershipRepository->findUsersByTeam($negociation->getBuyerTeam()));
        }

        if ($offer->getAuthor() instanceof User) {
            $users[] = $offer->getAuthor();
        }

        $this->publishToUsers($users, $type, [
            'domain' => 'transfer',
            'offerId' => $offer->getId()?->toRfc4122(),
            'negotiationId' => $negociation?->getId()?->toRfc4122(),
            'playerId' => $listing?->getPlayer()?->getId()?->toRfc4122(),
            'targetRoute' => '/market/transfers',
        ]);
    }

    public function publishTransferNegotiationUpdate(TransferOffer $offer, string $type): void
    {
        $this->publishTransferOfferUpdate($offer, $type);
    }

    public function publishContractNegotiationUpdate(ContractNegociation $negociation, string $type): void
    {
        $users = [];

        if ($negociation->getBuyerTeam() instanceof Team) {
            $users = array_merge($users, $this->teamMembershipRepository->findUsersByTeam($negociation->getBuyerTeam()));
        }

        if ($negociation->getAgent()?->getUser() instanceof User) {
            $users[] = $negociation->getAgent()->getUser();
        }

        if ($negociation->getCreatedBy() instanceof User) {
            $users[] = $negociation->getCreatedBy();
        }

        $this->publishToUsers($users, $type, [
            'domain' => 'contract',
            'negotiationId' => $negociation->getId()?->toRfc4122(),
            'playerId' => $negociation->getPlayer()?->getId()?->toRfc4122(),
            'targetRoute' => '/negociations',
        ]);
    }
}
