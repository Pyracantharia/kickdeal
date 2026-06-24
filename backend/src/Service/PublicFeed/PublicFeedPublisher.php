<?php

namespace App\Service\PublicFeed;

use App\Entity\Contract\ContractNegociation;
use App\Entity\Contract\ContractOffer;
use App\Entity\Listing;
use App\Entity\Player;
use App\Entity\PublicFeedPost;
use App\Entity\Team;
use App\Entity\Transfer\TransferNegociation;
use App\Entity\Transfer\TransferOffer;
use App\Enum\ContractNegotiationTypeEnum;
use App\Enum\OfferStatusEnum;
use App\Enum\PlayerContractNegociationStatusEnum;
use App\Enum\PlayerMarketStatusEnum;
use App\Enum\PublicFeedEventTypeEnum;
use App\Enum\TransferNegociationStatusEnum;
use App\Enum\TransferTypeEnum;
use App\Repository\PublicFeedPostRepository;
use Doctrine\ORM\EntityManagerInterface;

final class PublicFeedPublisher
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly PublicFeedPostRepository $publicFeedPostRepository,
    ) {
    }

    public function publishListing(Listing $listing): ?PublicFeedPost
    {
        $player = $listing->getPlayer();
        $sellerTeam = $listing->getSellerTeam();
        if (!$player instanceof Player) {
            return null;
        }

        $eventType = TransferTypeEnum::LOAN === $listing->getTransferType()
            ? PublicFeedEventTypeEnum::LOAN
            : PublicFeedEventTypeEnum::MARKET_LISTING;

        $playerName = $this->playerName($player);
        $clubName = $sellerTeam?->getName() ?? 'son club';
        $headline = TransferTypeEnum::LOAN === $listing->getTransferType()
            ? 'PRET DISPONIBLE'
            : 'SUR LE MARCHE';
        $body = TransferTypeEnum::LOAN === $listing->getTransferType()
            ? sprintf('%s est disponible pour un prêt. %s ouvre la discussion.', $playerName, $clubName)
            : sprintf('%s est placé sur le marché par %s.', $playerName, $clubName);

        return $this->upsertPost(
            sourceType: 'listing',
            sourceId: (string) $listing->getId(),
            eventType: $eventType->value,
            bucket: 'live',
            isFeatured: false,
            publishedAt: $this->immutableDate($listing->getCreatedAt()),
            headline: $headline,
            body: $body,
            player: $player,
            sellerTeam: $sellerTeam,
            buyerTeam: null,
            amount: $listing->getAskingPrice(),
            details: [
                'transferType' => $listing->getTransferType()?->value,
                'askingPriceLabel' => $this->formatMoney($listing->getAskingPrice()),
                'status' => $listing->getStatus()?->value,
            ],
        );
    }

    public function publishPlayerMarketStatus(Player $player, ?PlayerMarketStatusEnum $previousStatus = null): ?PublicFeedPost
    {
        $status = $player->getMarketStatus();
        $now = new \DateTimeImmutable();
        $playerName = $this->playerName($player);
        $team = $player->getTeam();
        $sourceId = sprintf('%s-%s-%s', (string) $player->getId(), $status?->value ?? 'unknown', $now->format('YmdHis'));

        if (PlayerMarketStatusEnum::ON_MARKET === $status) {
            return $this->upsertPost(
                sourceType: 'player_market_status',
                sourceId: $sourceId,
                eventType: PublicFeedEventTypeEnum::MARKET_LISTING->value,
                bucket: 'live',
                isFeatured: false,
                publishedAt: $now,
                headline: 'SUR LE MARCHE',
                body: sprintf('%s est désormais ouvert à une opération de transfert.', $playerName),
                player: $player,
                sellerTeam: $team,
                buyerTeam: null,
                amount: $player->getMarketValue(),
                details: [
                    'previousStatus' => $previousStatus?->value,
                    'marketStatus' => $status->value,
                    'marketValueLabel' => $this->formatMoney($player->getMarketValue()),
                ],
            );
        }

        if (PlayerMarketStatusEnum::LOAN_LISTED === $status) {
            return $this->upsertPost(
                sourceType: 'player_market_status',
                sourceId: $sourceId,
                eventType: PublicFeedEventTypeEnum::LOAN->value,
                bucket: 'live',
                isFeatured: false,
                publishedAt: $now,
                headline: 'PRET POSSIBLE',
                body: sprintf('%s est disponible pour un prêt.', $playerName),
                player: $player,
                sellerTeam: $team,
                buyerTeam: null,
                amount: null,
                details: [
                    'previousStatus' => $previousStatus?->value,
                    'marketStatus' => $status->value,
                ],
            );
        }

        if (null !== $previousStatus && PlayerMarketStatusEnum::NOT_LISTED === $status) {
            return $this->upsertPost(
                sourceType: 'player_market_status',
                sourceId: $sourceId,
                eventType: PublicFeedEventTypeEnum::MARKET_REMOVAL->value,
                bucket: 'live',
                isFeatured: false,
                publishedAt: $now,
                headline: 'RETIRE DU MARCHE',
                body: sprintf('%s n’est plus listé sur le marché KickDeal.', $playerName),
                player: $player,
                sellerTeam: $team,
                buyerTeam: null,
                amount: null,
                details: [
                    'previousStatus' => $previousStatus->value,
                    'marketStatus' => $status->value,
                ],
            );
        }

        return null;
    }

    public function publishTransferAgreement(TransferOffer $offer): ?PublicFeedPost
    {
        $negociation = $offer->getTransferNegociation();
        if (
            !$negociation instanceof TransferNegociation
            || !$negociation->isPublicFeedEnabled()
            || OfferStatusEnum::ACCEPTED !== $offer->getStatus()
        ) {
            return null;
        }

        $listing = $negociation->getListing();
        $player = $listing?->getPlayer();
        $buyerTeam = $negociation->getBuyerTeam();
        if (!$player instanceof Player || !$buyerTeam instanceof Team) {
            return null;
        }

        return $this->upsertPost(
            sourceType: 'transfer_offer',
            sourceId: (string) $offer->getId(),
            eventType: PublicFeedEventTypeEnum::AGREEMENT->value,
            bucket: 'live',
            isFeatured: true,
            publishedAt: $this->immutableDate($offer->getUpdatedAt() ?? $offer->getCreatedAt()),
            headline: 'ACCORD VERBAL',
            body: sprintf(
                '%s et %s ont trouvé un accord club pour %s. La phase contractuelle doit encore valider le deal.',
                $listing->getSellerTeam()?->getName() ?? 'Le club vendeur',
                $buyerTeam->getName() ?? 'le club acheteur',
                $this->playerName($player),
            ),
            player: $player,
            sellerTeam: $listing->getSellerTeam(),
            buyerTeam: $buyerTeam,
            amount: $offer->getAmount(),
            details: [
                'amountLabel' => $this->formatMoney($offer->getAmount()),
                'status' => $negociation->getStatus()?->value,
                'durationMonths' => $offer->getDurationMonths(),
                'performanceBonusLabel' => $this->formatMoney($offer->getPerformanceBonus()),
            ],
        );
    }

    public function publishTransferOffer(TransferOffer $offer): ?PublicFeedPost
    {
        $negociation = $offer->getTransferNegociation();
        if (!$negociation instanceof TransferNegociation || !$negociation->isPublicFeedEnabled()) {
            return null;
        }

        $listing = $negociation->getListing();
        $player = $listing?->getPlayer();
        $buyerTeam = $negociation->getBuyerTeam();
        if (!$player instanceof Player || !$buyerTeam instanceof Team) {
            return null;
        }

        $eventType = match ($offer->getStatus()) {
            OfferStatusEnum::ACCEPTED => PublicFeedEventTypeEnum::OFFER_ACCEPTED,
            OfferStatusEnum::REJECTED => PublicFeedEventTypeEnum::OFFER_REFUSED,
            default => PublicFeedEventTypeEnum::OFFER_SENT,
        };

        return $this->upsertPost(
            sourceType: 'transfer_offer',
            sourceId: (string) $offer->getId(),
            eventType: $eventType->value,
            bucket: 'live',
            isFeatured: false,
            publishedAt: $this->immutableDate($offer->getCreatedAt()),
            headline: 'NEGOCIATION',
            body: sprintf(
                '%s a transmis une offre pour %s.',
                $buyerTeam->getName() ?? 'Un club',
                $this->playerName($player),
            ),
            player: $player,
            sellerTeam: $listing->getSellerTeam(),
            buyerTeam: $buyerTeam,
            amount: $offer->getAmount(),
            details: [
                'amountLabel' => $this->formatMoney($offer->getAmount()),
                'status' => $offer->getStatus()?->value,
                'kind' => $offer->getKind()?->value,
                'durationMonths' => $offer->getDurationMonths(),
            ],
        );
    }

    public function publishContractFinalized(ContractNegociation $negociation): ?PublicFeedPost
    {
        if (PlayerContractNegociationStatusEnum::COMPLETED !== $negociation->getStatus()) {
            return null;
        }

        $player = $negociation->getPlayer();
        $buyerTeam = $negociation->getBuyerTeam();
        if (!$player instanceof Player || !$buyerTeam instanceof Team) {
            return null;
        }

        $acceptedOffer = $this->findAcceptedContractOffer($negociation);
        $sellerTeam = $negociation->getTransferNegociation()?->getListing()?->getSellerTeam() ?? $player->getTeam();
        $acceptedTransferOffer = $this->findAcceptedTransferOffer($negociation->getTransferNegociation());
        $playerName = $this->playerName($player);

        [$eventType, $headline, $body, $amount] = match ($negociation->getType()) {
            ContractNegotiationTypeEnum::TRANSFER => [
                PublicFeedEventTypeEnum::TRANSFER_OFFICIAL,
                'OFFICIEL ! HERE WE GO',
                sprintf('%s rejoint %s. Le transfert est finalisé sur KickDeal.', $playerName, $buyerTeam->getName() ?? 'son nouveau club'),
                $acceptedTransferOffer?->getAmount(),
            ],
            ContractNegotiationTypeEnum::RENEWAL => [
                PublicFeedEventTypeEnum::CONTRACT_RENEWAL,
                'RENOUVELLEMENT',
                sprintf('%s prolonge avec %s.', $playerName, $buyerTeam->getName() ?? 'son club'),
                $acceptedOffer?->getAnnualSalary(),
            ],
            ContractNegotiationTypeEnum::TERMINATION => [
                PublicFeedEventTypeEnum::CONTRACT_SIGNED,
                'JOUEUR LIBRE',
                sprintf('%s a trouvé un accord de résiliation et devient libre.', $playerName),
                $acceptedOffer?->getTerminationCompensation(),
            ],
        };

        return $this->upsertPost(
            sourceType: 'contract_negociation',
            sourceId: (string) $negociation->getId(),
            eventType: $eventType->value,
            bucket: 'official',
            isFeatured: true,
            publishedAt: $this->immutableDate($negociation->getUpdatedAt() ?? $negociation->getCreatedAt()),
            headline: $headline,
            body: $body,
            player: $player,
            sellerTeam: $sellerTeam,
            buyerTeam: $buyerTeam,
            amount: $amount,
            details: [
                'contractType' => $negociation->getType()->value,
                'durationMonths' => $acceptedOffer?->getDurationMonths(),
                'contractUntil' => $player->getContractEndDate()?->format('Y-m-d'),
                'amountLabel' => $this->formatMoney($amount),
                'annualSalaryLabel' => $this->formatMoney($acceptedOffer?->getAnnualSalary()),
                'signingBonusLabel' => $this->formatMoney($acceptedOffer?->getSigningBonus()),
                'releaseClauseLabel' => $this->formatMoney($acceptedOffer?->getReleaseClause()),
                'transferAmountLabel' => $this->formatMoney($acceptedTransferOffer?->getAmount()),
            ],
        );
    }

    public function publishContractNegotiation(ContractNegociation $negociation): ?PublicFeedPost
    {
        if (!$negociation->isPublicFeedEnabled()) {
            return null;
        }

        $player = $negociation->getPlayer();
        $buyerTeam = $negociation->getBuyerTeam();
        if (!$player instanceof Player || !$buyerTeam instanceof Team) {
            return null;
        }

        return $this->upsertPost(
            sourceType: 'contract_negociation',
            sourceId: (string) $negociation->getId(),
            eventType: PublicFeedEventTypeEnum::NEGOTIATION->value,
            bucket: 'live',
            isFeatured: false,
            publishedAt: $this->immutableDate($negociation->getUpdatedAt() ?? $negociation->getCreatedAt()),
            headline: 'NEGOCIATION CONTRACTUELLE',
            body: sprintf('%s discute les conditions contractuelles avec %s.', $this->playerName($player), $buyerTeam->getName() ?? 'un club'),
            player: $player,
            sellerTeam: $player->getTeam(),
            buyerTeam: $buyerTeam,
            amount: null,
            details: [
                'contractType' => $negociation->getType()->value,
                'status' => $negociation->getStatus()?->value,
            ],
        );
    }

    /**
     * @param array<string, mixed> $details
     */
    private function upsertPost(
        string $sourceType,
        string $sourceId,
        string $eventType,
        string $bucket,
        bool $isFeatured,
        \DateTimeImmutable $publishedAt,
        string $headline,
        string $body,
        ?Player $player,
        ?Team $sellerTeam,
        ?Team $buyerTeam,
        ?int $amount,
        array $details,
    ): PublicFeedPost {
        $post = $this->publicFeedPostRepository->findOneBySource($sourceType, $sourceId, $eventType) ?? new PublicFeedPost();

        $teamForContext = $buyerTeam ?? $sellerTeam ?? $player?->getTeam();
        $post
            ->setSourceType($sourceType)
            ->setSourceId($sourceId)
            ->setEventType($eventType)
            ->setBucket($bucket)
            ->setIsFeatured($isFeatured)
            ->setPublishedAt($publishedAt)
            ->setHeadline($headline)
            ->setBody($body)
            ->setPlayer($player)
            ->setPlayerName($player ? $this->playerName($player) : null)
            ->setSellerTeam($sellerTeam)
            ->setBuyerTeam($buyerTeam)
            ->setAmount($amount)
            ->setCurrency('EUR')
            ->setDetailsJson($details)
            ->setLeague($teamForContext?->getLeague())
            ->setCountry($teamForContext?->getCountry())
            ->setUpdatedAt(new \DateTimeImmutable());

        if (null === $post->getCreatedAt()) {
            $post->setCreatedAt(new \DateTimeImmutable());
            $this->entityManager->persist($post);
        }

        return $post;
    }

    private function playerName(Player $player): string
    {
        return trim(($player->getFirstName() ?? '').' '.($player->getLastName() ?? '')) ?: 'Un joueur';
    }

    private function immutableDate(?\DateTimeInterface $date): \DateTimeImmutable
    {
        if ($date instanceof \DateTimeImmutable) {
            return $date;
        }

        if ($date instanceof \DateTimeInterface) {
            return \DateTimeImmutable::createFromInterface($date);
        }

        return new \DateTimeImmutable();
    }

    private function formatMoney(int|string|null $amount): ?string
    {
        if (null === $amount) {
            return null;
        }

        $value = ((int) $amount) / 100;
        if ($value >= 1_000_000) {
            return number_format($value / 1_000_000, 1, ',', ' ').' M EUR';
        }
        if ($value >= 1_000) {
            return number_format($value / 1_000, 0, ',', ' ').' K EUR';
        }

        return number_format($value, 0, ',', ' ').' EUR';
    }

    private function findAcceptedContractOffer(ContractNegociation $negociation): ?ContractOffer
    {
        foreach ($negociation->getContractOffers() as $offer) {
            if (OfferStatusEnum::ACCEPTED === $offer->getStatus()) {
                return $offer;
            }
        }

        return null;
    }

    private function findAcceptedTransferOffer(?TransferNegociation $negociation): ?TransferOffer
    {
        foreach ($negociation?->getTransferOffers() ?? [] as $offer) {
            if (OfferStatusEnum::ACCEPTED === $offer->getStatus()) {
                return $offer;
            }
        }

        return null;
    }
}
