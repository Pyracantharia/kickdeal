<?php

namespace App\Controller;

use App\Entity\Listing;
use App\Entity\Player;
use App\Entity\Team;
use App\Entity\TeamMembership;
use App\Entity\Transfer\TransferNegociation;
use App\Entity\Transfer\TransferOffer;
use App\Entity\User;
use App\Enum\ListingStatusEnum;
use App\Enum\OfferStatusEnum;
use App\Enum\TransferNegociationStatusEnum;
use App\Enum\TransferOfferKindEnum;
use App\Repository\ListingRepository;
use App\Repository\PlayerRepository;
use App\Repository\TeamMembershipRepository;
use App\Repository\Transfer\TransferNegociationRepository;
use App\Repository\Transfer\TransferOfferRepository;
use App\Service\Subscription\SubscriptionLimits;
use App\Service\Contract\ContractNegotiationWorkflow;
use App\Service\PublicFeed\PublicFeedPublisher;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/transfers')]
final class TransferController extends AbstractController
{
    #[Route('/offers/mine', name: 'app_transfer_offers_mine', methods: ['GET'])]
    public function mine(
        #[CurrentUser] ?User $user,
        TeamMembershipRepository $teamMembershipRepository,
        TransferOfferRepository $transferOfferRepository,
    ): JsonResponse {
        $membership = $this->getCurrentMembership($user, $teamMembershipRepository);

        if ($membership instanceof JsonResponse) {
            return $membership;
        }

        $team = $membership->getTeam();

        return $this->json([
            'sentOffers' => array_map(
                fn (TransferOffer $offer): array => $this->serializeOffer($offer, $team),
                $transferOfferRepository->findSentByTeam($team),
            ),
            'receivedOffers' => array_map(
                fn (TransferOffer $offer): array => $this->serializeOffer($offer, $team),
                $transferOfferRepository->findReceivedByTeam($team),
            ),
        ]);
    }

    #[Route('/history', name: 'app_transfer_history', methods: ['GET'])]
    public function history(
        #[CurrentUser] ?User $user,
        TeamMembershipRepository $teamMembershipRepository,
        TransferOfferRepository $transferOfferRepository,
    ): JsonResponse {
        $membership = $this->getCurrentMembership($user, $teamMembershipRepository);

        if ($membership instanceof JsonResponse) {
            return $membership;
        }

        $team = $membership->getTeam();
        $offers = $transferOfferRepository->findAcceptedForTeam($team);
        $items = array_map(
            fn (TransferOffer $offer): array => $this->serializeHistoryItem($offer, $team),
            $offers,
        );
        $totalAmount = array_sum(array_map(
            static fn (TransferOffer $offer): int => $offer->getAmount() ?? 0,
            $offers,
        ));
        $freeCount = count(array_filter(
            $offers,
            static fn (TransferOffer $offer): bool => 0 === ($offer->getAmount() ?? 0),
        ));

        return $this->json([
            'transfers' => $items,
            'stats' => [
                'totalTransfers' => count($offers),
                'totalAmount' => $this->formatMoney($totalAmount),
                'totalAmountValue' => $totalAmount / 100,
                'freeTransfers' => $freeCount,
                'paidTransfers' => count($offers) - $freeCount,
            ],
        ]);
    }

    #[Route('/negotiate-context', name: 'app_transfer_negotiate_context', methods: ['GET'])]
    public function negotiateContext(
        Request $request,
        #[CurrentUser] ?User $user,
        TeamMembershipRepository $teamMembershipRepository,
        ListingRepository $listingRepository,
        TransferOfferRepository $transferOfferRepository,
        TransferNegociationRepository $transferNegociationRepository,
    ): JsonResponse {
        $membership = $this->getCurrentMembership($user, $teamMembershipRepository);

        if ($membership instanceof JsonResponse) {
            return $membership;
        }

        $team = $membership->getTeam();
        $offerId = trim($request->query->getString('offerId', ''));
        $listingId = trim($request->query->getString('listingId', ''));
        $sourceOffer = null;
        $negociation = null;

        if ('' !== $offerId) {
            $sourceOffer = $transferOfferRepository->find($offerId);

            if (!$sourceOffer instanceof TransferOffer) {
                return $this->json(['errorMessage' => 'Offre introuvable.'], 404);
            }

            $negociation = $sourceOffer->getTransferNegociation();
            $listing = $negociation?->getListing();
        } else {
            $listing = $listingRepository->find($listingId);

            if (!$listing instanceof Listing || ListingStatusEnum::ACTIVE !== $listing->getStatus()) {
                return $this->json(['errorMessage' => 'Annonce introuvable ou inactive.'], 404);
            }

            if ($listing->getSellerTeam()?->getId()?->toRfc4122() === $team->getId()?->toRfc4122()) {
                return $this->json(['errorMessage' => 'Vous ne pouvez pas négocier votre propre joueur comme acheteur.'], 422);
            }

            $negociation = $transferNegociationRepository->findOneForListingAndBuyer($listing, $team);
        }

        if (!$listing instanceof Listing) {
            return $this->json(['errorMessage' => 'Annonce introuvable.'], 404);
        }

        $sellerTeam = $listing->getSellerTeam();
        $buyerTeam = $negociation?->getBuyerTeam() ?? $team;
        $isSeller = $sellerTeam?->getId()?->toRfc4122() === $team->getId()?->toRfc4122();
        $isBuyer = $buyerTeam?->getId()?->toRfc4122() === $team->getId()?->toRfc4122();

        if (!$isSeller && !$isBuyer) {
            return $this->json(['errorMessage' => 'Vous ne pouvez pas accéder à cette négociation.'], 403);
        }

        return $this->json([
            'context' => $this->serializeNegotiationContext(
                $listing,
                $buyerTeam,
                $team,
                $teamMembershipRepository,
                $negociation,
                $sourceOffer,
            ),
        ]);
    }

    #[Route('/negotiations/{id}/public-feed', name: 'app_transfer_negotiation_public_feed', methods: ['PUT', 'PATCH'])]
    public function updateNegotiationPublicFeed(
        TransferNegociation $negociation,
        Request $request,
        #[CurrentUser] ?User $user,
        TeamMembershipRepository $teamMembershipRepository,
        EntityManagerInterface $entityManager,
        PublicFeedPublisher $publicFeedPublisher,
    ): JsonResponse {
        $membership = $this->getCurrentMembership($user, $teamMembershipRepository);

        if ($membership instanceof JsonResponse) {
            return $membership;
        }

        $team = $membership->getTeam();
        $listing = $negociation->getListing();
        $isSeller = $listing?->getSellerTeam()?->getId()?->toRfc4122() === $team->getId()?->toRfc4122();
        $isBuyer = $negociation->getBuyerTeam()?->getId()?->toRfc4122() === $team->getId()?->toRfc4122();

        if (!$isSeller && !$isBuyer) {
            return $this->json(['errorMessage' => 'Vous ne pouvez pas modifier cette négociation.'], 403);
        }

        $payload = json_decode($request->getContent(), true);
        $enabled = true === (is_array($payload) ? ($payload['enabled'] ?? false) : false);

        $negociation->setPublicFeedEnabled($enabled);
        if ($enabled) {
            foreach ($negociation->getTransferOffers() as $offer) {
                $publicFeedPublisher->publishTransferOffer($offer);
                if (OfferStatusEnum::ACCEPTED === $offer->getStatus()) {
                    $publicFeedPublisher->publishTransferAgreement($offer);
                }
            }
        }
        $entityManager->flush();

        return $this->json([
            'publicFeedEnabled' => $negociation->isPublicFeedEnabled(),
        ]);
    }

    #[Route('/offers', name: 'app_transfer_offer_create', methods: ['POST'])]
    public function createOffer(
        Request $request,
        #[CurrentUser] ?User $user,
        TeamMembershipRepository $teamMembershipRepository,
        ListingRepository $listingRepository,
        PlayerRepository $playerRepository,
        TransferNegociationRepository $transferNegociationRepository,
        SubscriptionLimits $subscriptionLimits,
        EntityManagerInterface $entityManager,
        PublicFeedPublisher $publicFeedPublisher,
    ): JsonResponse {
        $membership = $this->getCurrentMembership($user, $teamMembershipRepository);

        if ($membership instanceof JsonResponse) {
            return $membership;
        }

        $payload = json_decode($request->getContent(), true);

        if (!is_array($payload)) {
            return $this->json(['errorMessage' => 'Payload invalide.'], 400);
        }

        $listing = $this->getListing($payload['listingId'] ?? null, $listingRepository);

        if ($listing instanceof JsonResponse) {
            return $listing;
        }

        $buyerTeam = $membership->getTeam();

        if (!$subscriptionLimits->canCreateClubOffer($user)) {
            return $this->json([
                'errorMessage' => 'Vous avez atteint la limite du plan gratuit.',
                'upgradePath' => '/subscription',
            ], 402);
        }

        if ($listing->getSellerTeam()?->getId()?->toRfc4122() === $buyerTeam->getId()?->toRfc4122()) {
            return $this->json([
                'errorMessage' => 'Vous ne pouvez pas émettre une offre pour votre propre joueur.',
            ], 422);
        }

        $negociation = $transferNegociationRepository->findOneForListingAndBuyer($listing, $buyerTeam);

        if (!$negociation instanceof TransferNegociation) {
            $negociation = (new TransferNegociation())
                ->setListing($listing)
                ->setBuyerTeam($buyerTeam)
                ->setStatus(TransferNegociationStatusEnum::OPEN)
                ->setCreatedBy($user)
                ->setCreatedAt(new \DateTimeImmutable());

            $entityManager->persist($negociation);
        }

        $offer = $this->buildOfferFromPayload($payload, $negociation, $user, $buyerTeam, $playerRepository);

        if ($offer instanceof JsonResponse) {
            return $offer;
        }

        $entityManager->persist($offer);
        $publicFeedPublisher->publishTransferOffer($offer);
        $entityManager->flush();

        return $this->json([
            'offer' => $this->serializeOffer($offer, $buyerTeam),
        ], 201);
    }

    #[Route('/offers/{id}/accept', name: 'app_transfer_offer_accept', methods: ['PUT', 'PATCH'])]
    public function accept(
        TransferOffer $offer,
        #[CurrentUser] ?User $user,
        TeamMembershipRepository $teamMembershipRepository,
        ContractNegotiationWorkflow $contractNegotiationWorkflow,
        EntityManagerInterface $entityManager,
        PublicFeedPublisher $publicFeedPublisher,
    ): JsonResponse {
        $membership = $this->getCurrentMembership($user, $teamMembershipRepository);

        if ($membership instanceof JsonResponse) {
            return $membership;
        }

        $team = $membership->getTeam();
        $listing = $offer->getTransferNegociation()?->getListing();
        $buyerTeam = $offer->getTransferNegociation()?->getBuyerTeam();
        $sellerTeam = $listing?->getSellerTeam();
        $isSeller = $sellerTeam?->getId()?->toRfc4122() === $team->getId()?->toRfc4122();
        $isBuyer = $buyerTeam?->getId()?->toRfc4122() === $team->getId()?->toRfc4122();
        $authorMembership = $offer->getAuthor() ? $teamMembershipRepository->findPrimaryForUser($offer->getAuthor()) : null;
        $authorTeamId = $authorMembership?->getTeam()?->getId()?->toRfc4122();

        if (!$isSeller && !$isBuyer) {
            return $this->json(['errorMessage' => 'Vous ne pouvez pas accepter cette offre.'], 403);
        }

        if (null !== $authorTeamId && $authorTeamId === $team->getId()?->toRfc4122()) {
            return $this->json(['errorMessage' => 'Le club qui a emis une offre ne peut pas accepter sa propre proposition.'], 403);
        }

        $player = $listing?->getPlayer();
        if (null === $player?->getAgent()) {
            return $this->json([
                'errorMessage' => 'Ce joueur doit être rattaché à un agent avant de poursuivre la négociation contractuelle.',
            ], 422);
        }

        $contractNegociation = $entityManager->wrapInTransaction(function () use (
            $offer,
            $user,
            $contractNegotiationWorkflow,
            $entityManager,
            $publicFeedPublisher,
        ) {
            $offer->setStatus(OfferStatusEnum::ACCEPTED);
            $transferNegociation = $offer->getTransferNegociation();
            $transferNegociation
                ?->setStatus(TransferNegociationStatusEnum::AGREED_CLUBS)
                ->setAgreedAt(new \DateTimeImmutable('today'));

            $contractNegociation = $transferNegociation && $user
                ? $contractNegotiationWorkflow->ensureForTransfer($transferNegociation, $user)
                : null;
            $publicFeedPublisher->publishTransferAgreement($offer);
            $entityManager->flush();

            return $contractNegociation;
        });

        return $this->json([
            'offer' => $this->serializeOffer($offer, $team),
            'contractNegociationId' => $contractNegociation?->getId()?->toRfc4122(),
        ]);
    }

    #[Route('/offers/{id}/reject', name: 'app_transfer_offer_reject', methods: ['PUT', 'PATCH'])]
    public function reject(
        TransferOffer $offer,
        #[CurrentUser] ?User $user,
        TeamMembershipRepository $teamMembershipRepository,
        EntityManagerInterface $entityManager,
        PublicFeedPublisher $publicFeedPublisher,
    ): JsonResponse {
        $membership = $this->getCurrentMembership($user, $teamMembershipRepository);

        if ($membership instanceof JsonResponse) {
            return $membership;
        }

        $team = $membership->getTeam();
        $listing = $offer->getTransferNegociation()?->getListing();
        $isSeller = $listing?->getSellerTeam()?->getId()?->toRfc4122() === $team->getId()?->toRfc4122();
        $isBuyer = $offer->getTransferNegociation()?->getBuyerTeam()?->getId()?->toRfc4122() === $team->getId()?->toRfc4122();

        if (!$isSeller && !$isBuyer) {
            return $this->json(['errorMessage' => 'Vous ne pouvez pas rejeter cette offre.'], 403);
        }

        $offer->setStatus(OfferStatusEnum::REJECTED);
        $offer->getTransferNegociation()?->setStatus(TransferNegociationStatusEnum::REJECTED);
        $publicFeedPublisher->publishTransferOffer($offer);

        $entityManager->flush();

        return $this->json(['offer' => $this->serializeOffer($offer, $team)]);
    }

    #[Route('/offers/{id}/counter', name: 'app_transfer_offer_counter', methods: ['POST'])]
    public function counter(
        Request $request,
        TransferOffer $sourceOffer,
        #[CurrentUser] ?User $user,
        TeamMembershipRepository $teamMembershipRepository,
        PlayerRepository $playerRepository,
        SubscriptionLimits $subscriptionLimits,
        EntityManagerInterface $entityManager,
        PublicFeedPublisher $publicFeedPublisher,
    ): JsonResponse {
        $membership = $this->getCurrentMembership($user, $teamMembershipRepository);

        if ($membership instanceof JsonResponse) {
            return $membership;
        }

        $team = $membership->getTeam();
        $negociation = $sourceOffer->getTransferNegociation();
        $listing = $negociation?->getListing();
        $isSeller = $listing?->getSellerTeam()?->getId()?->toRfc4122() === $team->getId()?->toRfc4122();
        $isBuyer = $negociation?->getBuyerTeam()?->getId()?->toRfc4122() === $team->getId()?->toRfc4122();

        if (!$isSeller && !$isBuyer) {
            return $this->json(['errorMessage' => 'Vous ne pouvez pas contre-proposer sur cette offre.'], 403);
        }

        if (!$subscriptionLimits->canCreateClubOffer($user)) {
            return $this->json([
                'errorMessage' => 'Vous avez atteint la limite du plan gratuit.',
                'upgradePath' => '/subscription',
            ], 402);
        }

        $payload = json_decode($request->getContent(), true);

        if (!is_array($payload)) {
            return $this->json(['errorMessage' => 'Payload invalide.'], 400);
        }

        $sourceOffer->setStatus(OfferStatusEnum::REJECTED);
        $negociation?->setStatus(TransferNegociationStatusEnum::COUNTER_OFFER);

        $counterOffer = $this->buildOfferFromPayload(
            $payload,
            $negociation,
            $user,
            $team,
            $playerRepository,
        );

        if ($counterOffer instanceof JsonResponse) {
            return $counterOffer;
        }

        $entityManager->persist($counterOffer);
        $publicFeedPublisher->publishTransferOffer($counterOffer);
        $entityManager->flush();

        return $this->json(['offer' => $this->serializeOffer($counterOffer, $team)], 201);
    }

    private function getCurrentMembership(?User $user, TeamMembershipRepository $teamMembershipRepository): TeamMembership|JsonResponse
    {
        if (!$user) {
            return $this->json(['errorMessage' => 'Utilisateur non authentifié.'], 401);
        }

        $membership = $teamMembershipRepository->findPrimaryForUser($user);

        if (!$membership instanceof TeamMembership || null === $membership->getTeam()) {
            return $this->json(['errorMessage' => 'Aucun club associé à votre compte.'], 403);
        }

        return $membership;
    }

    private function getListing(mixed $listingId, ListingRepository $listingRepository): Listing|JsonResponse
    {
        if (!is_string($listingId) || '' === trim($listingId)) {
            return $this->json(['errorMessage' => 'Annonce requise.'], 422);
        }

        $listing = $listingRepository->find($listingId);

        if (!$listing instanceof Listing || ListingStatusEnum::ACTIVE !== $listing->getStatus()) {
            return $this->json(['errorMessage' => 'Annonce introuvable ou inactive.'], 404);
        }

        return $listing;
    }

    private function buildOfferFromPayload(
        array $payload,
        TransferNegociation $negociation,
        User $author,
        Team $currentTeam,
        PlayerRepository $playerRepository,
    ): TransferOffer|JsonResponse {
        $amount = $this->moneyToCents($payload['amount'] ?? null);

        if (null === $amount || $amount < 0) {
            return $this->json(['errorMessage' => 'Montant requis.'], 422);
        }

        $buyerTeam = $negociation->getBuyerTeam();
        $performanceBonus = $this->moneyToCents($payload['performanceBonus'] ?? null);
        $maxFinancialCommitment = $amount + ($performanceBonus ?? 0);

        if (null !== $buyerTeam && $maxFinancialCommitment > ($buyerTeam->getTransferBudget() ?? 0)) {
            return $this->json([
                'errorMessage' => sprintf(
                    'Cette offre dépasse le budget de %s.',
                    $buyerTeam->getName() ?? 'ce club',
                ),
            ], 422);
        }

        $kind = $this->getOfferKind($payload['kind'] ?? null, $payload['type'] ?? null);
        $exchangePlayer = null;
        $exchangePlayerId = $payload['exchangePlayerId'] ?? null;
        $sellerTeam = $negociation->getListing()?->getSellerTeam();
        $exchangeTeam = $sellerTeam?->getId()?->toRfc4122() === $currentTeam->getId()?->toRfc4122()
            ? $buyerTeam
            : $currentTeam;

        if (is_string($exchangePlayerId) && '' !== trim($exchangePlayerId)) {
            $exchangePlayer = $playerRepository->find($exchangePlayerId);

            if (!$exchangePlayer instanceof Player || null === $exchangeTeam || $exchangePlayer->getTeam()?->getId()?->toRfc4122() !== $exchangeTeam->getId()?->toRfc4122()) {
                return $this->json(['errorMessage' => 'Le joueur échangé doit appartenir au club acheteur.'], 422);
            }
        }

        return (new TransferOffer())
            ->setTransferNegociation($negociation)
            ->setAuthor($author)
            ->setKind($kind)
            ->setAmount($amount)
            ->setDurationMonths($this->optionalInt($payload['durationMonths'] ?? null))
            ->setPaymentInstallments($this->optionalInt($payload['paymentInstallments'] ?? null))
            ->setPerformanceBonus($performanceBonus)
            ->setPerformanceBonusCondition($this->optionalString($payload['performanceBonusCondition'] ?? null))
            ->setResalePercentage($this->optionalInt($payload['resalePercentage'] ?? null))
            ->setBuyBackPriority(true === ($payload['buyBackPriority'] ?? false))
            ->setFutureTransferPriority(true === ($payload['futureTransferPriority'] ?? false))
            ->setExchangePlayer($exchangePlayer)
            ->setMessage($this->optionalString($payload['message'] ?? null))
            ->setValidUntil($this->parseDate($payload['validUntil'] ?? null))
            ->setStatus(OfferStatusEnum::PENDING)
            ->setCreatedAt(new \DateTimeImmutable());
    }

    private function getOfferKind(mixed $kind, mixed $type): TransferOfferKindEnum
    {
        if (is_string($kind) && null !== TransferOfferKindEnum::tryFrom($kind)) {
            return TransferOfferKindEnum::from($kind);
        }

        return match ($type) {
            'loan' => TransferOfferKindEnum::LOAN,
            'exchange' => TransferOfferKindEnum::EXCHANGE,
            default => TransferOfferKindEnum::INITIAL,
        };
    }

    private function serializeOffer(TransferOffer $offer, Team $viewerTeam): array
    {
        $negociation = $offer->getTransferNegociation();
        $listing = $negociation?->getListing();
        $player = $listing?->getPlayer();
        $sellerTeam = $listing?->getSellerTeam();
        $buyerTeam = $negociation?->getBuyerTeam();
        $isSent = $buyerTeam?->getId()?->toRfc4122() === $viewerTeam->getId()?->toRfc4122();
        $viewerRole = $sellerTeam?->getId()?->toRfc4122() === $viewerTeam->getId()?->toRfc4122() ? 'seller' : 'buyer';

        return [
            'id' => $offer->getId()?->toRfc4122(),
            'negociationId' => $negociation?->getId()?->toRfc4122(),
            'listingId' => $listing?->getId()?->toRfc4122(),
            'playerId' => $player?->getId()?->toRfc4122(),
            'buyerTeamId' => $buyerTeam?->getId()?->toRfc4122(),
            'sellerTeamId' => $sellerTeam?->getId()?->toRfc4122(),
            'viewerRole' => $viewerRole,
            'player' => $player ? $this->serializePlayer($player) : null,
            'type' => $this->serializeOfferType($offer->getKind()),
            'kind' => $offer->getKind()?->value,
            'status' => $offer->getStatus()?->value,
            'amount' => $this->formatMoney($offer->getAmount()),
            'amountValue' => null !== $offer->getAmount() ? $offer->getAmount() / 100 : null,
            'duration' => $offer->getDurationMonths(),
            'paymentStructure' => $offer->getPaymentInstallments()
                ? sprintf('Paiement en %d fois', $offer->getPaymentInstallments())
                : 'Paiement comptant',
            'paymentPerInstallment' => $offer->getPaymentInstallments() && $offer->getAmount()
                ? $this->formatMoney((int) round($offer->getAmount() / $offer->getPaymentInstallments()))
                : null,
            'performanceBonus' => null !== $offer->getPerformanceBonus() ? $this->formatMoney($offer->getPerformanceBonus()) : null,
            'performanceBonusValue' => null !== $offer->getPerformanceBonus() ? $offer->getPerformanceBonus() / 100 : null,
            'performanceBonusCondition' => $offer->getPerformanceBonusCondition(),
            'resalePercentage' => null !== $offer->getResalePercentage() ? $offer->getResalePercentage().'%' : null,
            'resalePercentageValue' => $offer->getResalePercentage(),
            'buyBackPriority' => $offer->hasBuyBackPriority(),
            'futureTransferPriority' => $offer->hasFutureTransferPriority(),
            'exchangePlayerName' => $offer->getExchangePlayer()
                ? $offer->getExchangePlayer()->getFirstName().' '.$offer->getExchangePlayer()->getLastName()
                : null,
            'advancedOptions' => array_values(array_filter([
                $offer->getExchangePlayer() ? 'Échange joueur inclus' : null,
                null !== $offer->getResalePercentage() ? 'Clause de revente' : null,
                null !== $offer->getPerformanceBonus() ? 'Bonus de performance' : null,
                $offer->hasBuyBackPriority() ? 'Priorité de rachat' : null,
                $offer->hasFutureTransferPriority() ? 'Priorité future' : null,
            ])),
            'customMessage' => $offer->getMessage(),
            'date' => $offer->getCreatedAt()?->format('Y-m-d') ?? '',
            'fromClub' => $isSent ? ($buyerTeam?->getName() ?? '') : ($buyerTeam?->getName() ?? ''),
            'toClub' => $isSent ? ($sellerTeam?->getName() ?? '') : ($sellerTeam?->getName() ?? ''),
        ];
    }

    private function serializeNegotiationContext(
        Listing $listing,
        Team $buyerTeam,
        Team $viewerTeam,
        TeamMembershipRepository $teamMembershipRepository,
        ?TransferNegociation $negociation = null,
        ?TransferOffer $sourceOffer = null,
    ): array {
        $sellerTeam = $listing->getSellerTeam();
        $player = $listing->getPlayer();
        $viewerRole = $sellerTeam?->getId()?->toRfc4122() === $viewerTeam->getId()?->toRfc4122() ? 'seller' : 'buyer';
        $offers = $negociation?->getTransferOffers()->toArray() ?? [];

        usort(
            $offers,
            static fn (TransferOffer $a, TransferOffer $b): int => ($b->getCreatedAt()?->getTimestamp() ?? 0) <=> ($a->getCreatedAt()?->getTimestamp() ?? 0),
        );

        return [
            'listingId' => $listing->getId()?->toRfc4122(),
            'sourceOfferId' => $sourceOffer?->getId()?->toRfc4122(),
            'negociationId' => $negociation?->getId()?->toRfc4122(),
            'viewerRole' => $viewerRole,
            'exchangeTeamId' => 'seller' === $viewerRole ? $buyerTeam->getId()?->toRfc4122() : $viewerTeam->getId()?->toRfc4122(),
            'player' => $player ? $this->serializePlayer($player) : null,
            'sellerTeam' => $sellerTeam ? $this->serializeTeam($sellerTeam) : null,
            'buyerTeam' => $this->serializeTeam($buyerTeam),
            'viewerTeam' => $this->serializeTeam($viewerTeam),
            'latestOffer' => $offers[0] ?? null ? $this->serializeOffer($offers[0], $viewerTeam) : null,
            'history' => array_map(
                fn (TransferOffer $offer): array => $this->serializeOfferHistoryItem($offer, $teamMembershipRepository),
                $offers,
            ),
        ];
    }

    private function serializeHistoryItem(TransferOffer $offer, Team $viewerTeam): array
    {
        $negociation = $offer->getTransferNegociation();
        $listing = $negociation?->getListing();
        $player = $listing?->getPlayer();
        $sellerTeam = $listing?->getSellerTeam();
        $buyerTeam = $negociation?->getBuyerTeam();
        $isSale = $sellerTeam?->getId()?->toRfc4122() === $viewerTeam->getId()?->toRfc4122();

        return [
            'id' => $offer->getId()?->toRfc4122(),
            'date' => $offer->getCreatedAt()?->format('Y-m-d') ?? '',
            'player' => $player ? $this->serializePlayer($player) : null,
            'sellerTeam' => $sellerTeam ? $this->serializeTeam($sellerTeam) : null,
            'buyerTeam' => $buyerTeam ? $this->serializeTeam($buyerTeam) : null,
            'amount' => $this->formatMoney($offer->getAmount()),
            'amountValue' => null !== $offer->getAmount() ? $offer->getAmount() / 100 : null,
            'type' => $this->serializeOfferType($offer->getKind()),
            'status' => $negociation?->getStatus()?->value,
            'direction' => $isSale ? 'sale' : 'purchase',
            'exchangePlayerName' => $offer->getExchangePlayer()
                ? $offer->getExchangePlayer()->getFirstName().' '.$offer->getExchangePlayer()->getLastName()
                : null,
        ];
    }

    private function serializeOfferHistoryItem(TransferOffer $offer, TeamMembershipRepository $teamMembershipRepository): array
    {
        $authorTeam = $offer->getAuthor() ? $teamMembershipRepository->findPrimaryForUser($offer->getAuthor())?->getTeam() : null;
        $summary = sprintf('Offre de %s', $this->formatMoney($offer->getAmount()));
        $details = array_values(array_filter([
            null !== $offer->getPerformanceBonus() ? '+ '.$this->formatMoney($offer->getPerformanceBonus()).' de bonus' : null,
            null !== $offer->getResalePercentage() ? $offer->getResalePercentage().'% à la revente' : null,
            $offer->getExchangePlayer() ? 'échange avec '.$offer->getExchangePlayer()->getFirstName().' '.$offer->getExchangePlayer()->getLastName() : null,
        ]));

        if ([] !== $details) {
            $summary .= ' + '.implode(' + ', $details);
        }

        return [
            'id' => $offer->getId()?->toRfc4122(),
            'clubName' => $authorTeam?->getName() ?? 'Club inconnu',
            'clubLogoUrl' => $authorTeam?->getLogoUrl(),
            'summary' => $summary,
            'createdAt' => $offer->getCreatedAt()?->format(\DateTimeInterface::ATOM),
        ];
    }

    private function serializeTeam(Team $team): array
    {
        return [
            'id' => $team->getId()?->toRfc4122(),
            'name' => $team->getName(),
            'logoUrl' => $team->getLogoUrl(),
            'league' => $team->getLeague(),
            'country' => $team->getCountry(),
            'transferBudgetValue' => null !== $team->getTransferBudget() ? $team->getTransferBudget() / 100 : null,
            'transferBudget' => null !== $team->getTransferBudget() ? $this->formatMoney($team->getTransferBudget()) : null,
        ];
    }

    private function serializeOfferType(?TransferOfferKindEnum $kind): string
    {
        return match ($kind) {
            TransferOfferKindEnum::LOAN => 'loan',
            TransferOfferKindEnum::EXCHANGE => 'exchange',
            default => 'purchase',
        };
    }

    private function serializePlayer(Player $player): array
    {
        $team = $player->getTeam();

        return [
            'id' => $player->getId()?->toRfc4122(),
            'firstName' => $player->getFirstName(),
            'lastName' => $player->getLastName(),
            'photoUrl' => $player->getPhotoUrl(),
            'age' => $player->getBirthDate() ? (int) $player->getBirthDate()->diff(new \DateTimeImmutable())->y : 0,
            'position' => $player->getPosition(),
            'nationality' => $player->getNationality() ?? 'Inconnue',
            'country' => $team?->getCountry() ?? '',
            'league' => $team?->getLeague() ?? '',
            'club' => $team?->getName() ?? 'Sans club',
            'clubLogoUrl' => $team?->getLogoUrl(),
            'transferStatus' => 'Sur le marche',
            'height' => $player->getHeightCm(),
            'weight' => $player->getWeightKg(),
            'foot' => $player->getPreferredFoot(),
            'marketValue' => $this->formatMoney($player->getMarketValue()),
            'weeklySalary' => $this->formatMoney($player->getWeeklySalary()),
            'releaseClause' => $this->formatMoney($player->getReleaseClause(), true),
        ];
    }

    private function moneyToCents(mixed $value): ?int
    {
        if (null === $value || '' === $value || !is_numeric($value)) {
            return null;
        }

        return (int) round(((float) $value) * 100);
    }

    private function optionalInt(mixed $value): ?int
    {
        if (null === $value || '' === $value || !is_numeric($value)) {
            return null;
        }

        return (int) $value;
    }

    private function optionalString(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $value = trim($value);

        return '' === $value ? null : $value;
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

    private function formatMoney(int|string|null $amountInCents, bool $allowNone = false): string
    {
        if (null === $amountInCents) {
            return $allowNone ? 'Aucun(e)' : '-';
        }

        $amount = ((int) $amountInCents) / 100;

        if ($amount >= 1_000_000) {
            return number_format($amount / 1_000_000, 1, ',', ' ').' M EUR';
        }

        if ($amount >= 1_000) {
            return number_format($amount / 1_000, 0, ',', ' ').' K EUR';
        }

        return number_format($amount, 0, ',', ' ').' EUR';
    }
}
