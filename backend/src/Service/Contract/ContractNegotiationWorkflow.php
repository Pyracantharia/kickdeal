<?php

namespace App\Service\Contract;

use App\Entity\Contract\ContractNegociation;
use App\Entity\Contract\ContractOffer;
use App\Entity\Contract\ContractPackage;
use App\Entity\Transfer\TransferAgreement;
use App\Entity\Transfer\TransferNegociation;
use App\Entity\Transfer\TransferOffer;
use App\Entity\User;
use App\Enum\ListingStatusEnum;
use App\Enum\ContractNegotiationTypeEnum;
use App\Enum\OfferStatusEnum;
use App\Enum\PlayerContractNegociationStatusEnum;
use App\Enum\PlayerContractStatusEnum;
use App\Enum\PlayerDecisionStatusEnum;
use App\Enum\PlayerMarketStatusEnum;
use App\Enum\TransferNegociationStatusEnum;
use App\Enum\TransferTypeEnum;
use App\Repository\Contract\ContractNegociationRepository;
use App\Repository\Contract\ContractPackageRepository;
use App\Repository\Transfer\TransferAgreementRepository;
use App\Repository\Transfer\TransferNegociationRepository;
use App\Repository\TransferTargetRepository;
use App\Service\Notification\NotificationService;
use App\Service\PublicFeed\PublicFeedPublisher;
use Doctrine\ORM\EntityManagerInterface;

final class ContractNegotiationWorkflow
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly ContractNegociationRepository $contractNegociationRepository,
        private readonly ContractPackageRepository $contractPackageRepository,
        private readonly TransferAgreementRepository $transferAgreementRepository,
        private readonly TransferNegociationRepository $transferNegociationRepository,
        private readonly TransferTargetRepository $transferTargetRepository,
        private readonly PublicFeedPublisher $publicFeedPublisher,
        private readonly NotificationService $notificationService,
    ) {
    }

    public function ensureForTransfer(TransferNegociation $transferNegociation, User $createdBy): ?ContractNegociation
    {
        $existing = $this->contractNegociationRepository->findOneBy([
            'transferNegociation' => $transferNegociation,
        ]);
        if ($existing instanceof ContractNegociation) {
            return $existing;
        }

        $listing = $transferNegociation->getListing();
        $player = $listing?->getPlayer();
        $agent = $player?->getAgent();
        $buyerTeam = $transferNegociation->getBuyerTeam();

        if (null === $listing || null === $player || null === $agent || null === $buyerTeam) {
            return null;
        }

        $acceptedOffer = $this->findAcceptedTransferOffer($transferNegociation);
        if ($acceptedOffer instanceof TransferOffer && null === $this->transferAgreementRepository->findOneBy([
            'transferNegociation' => $transferNegociation,
        ])) {
            $agreement = (new TransferAgreement())
                ->setTransferNegociation($transferNegociation)
                ->setAcceptedOffer($acceptedOffer)
                ->setCreatedAt(new \DateTimeImmutable())
                ->setUpdatedAt(new \DateTimeImmutable());
            $this->entityManager->persist($agreement);
        }

        $contractNegociation = (new ContractNegociation())
            ->setPlayer($player)
            ->setBuyerTeam($buyerTeam)
            ->setAgent($agent)
            ->setTransferNegociation($transferNegociation)
            ->setType(ContractNegotiationTypeEnum::TRANSFER)
            ->setStatus(PlayerContractNegociationStatusEnum::OPEN)
            ->setPublicFeedEnabled($transferNegociation->isPublicFeedEnabled())
            ->setCreatedBy($createdBy)
            ->setCreatedAt(new \DateTimeImmutable())
            ->setUpdatedAt(new \DateTimeImmutable());

        $this->entityManager->persist($contractNegociation);
        $this->entityManager->flush();
        $this->notifyAgentNegotiationOpened($contractNegociation, $createdBy);

        return $contractNegociation;
    }

    private function notifyAgentNegotiationOpened(ContractNegociation $contractNegociation, User $createdBy): void
    {
        $agentUser = $contractNegociation->getAgent()?->getUser();
        if (!$agentUser instanceof User) {
            return;
        }

        $player = $contractNegociation->getPlayer();
        $playerName = trim(sprintf('%s %s', $player?->getFirstName() ?? '', $player?->getLastName() ?? '')) ?: 'un joueur';
        $clubName = $contractNegociation->getBuyerTeam()?->getName() ?? 'un club';

        $this->notificationService->notify(
            recipient: $agentUser,
            type: 'contract_negociation.opened',
            category: 'negotiations',
            title: 'Discussion contractuelle ouverte',
            body: sprintf('%s attend une première proposition pour %s.', $clubName, $playerName),
            actionUrl: '/negociations/'.$contractNegociation->getId()?->toRfc4122(),
            targetRoute: '/negociations',
            requiresAction: true,
            severity: 'warning',
            actor: $createdBy,
            sourceType: 'contract_negociation',
            sourceId: $contractNegociation->getId()?->toRfc4122(),
        );
    }

    /**
     * @return ContractNegociation[]
     */
    public function ensurePendingAgentNegotiationsForPlayer(\App\Entity\Player $player, User $createdBy): array
    {
        $created = [];
        foreach ($this->transferNegociationRepository->findPendingAgentForPlayer($player) as $transferNegociation) {
            $transferNegociation->setStatus(TransferNegociationStatusEnum::AGREED_CLUBS);
            $contractNegociation = $this->ensureForTransfer($transferNegociation, $createdBy);
            if ($contractNegociation instanceof ContractNegociation) {
                $created[] = $contractNegociation;
            }
        }

        return $created;
    }

    public function finalizeExternalTransfer(TransferNegociation $transferNegociation): void
    {
        if (TransferNegociationStatusEnum::COMPLETED === $transferNegociation->getStatus()) {
            return;
        }

        $listing = $transferNegociation->getListing();
        $player = $listing?->getPlayer();
        $buyerTeam = $transferNegociation->getBuyerTeam();
        $sellerTeam = $listing?->getSellerTeam();

        if (null === $listing || null === $player || null === $buyerTeam) {
            throw new \LogicException('La négociation de transfert est incomplète.');
        }

        if (TransferTypeEnum::LOAN === $listing->getTransferType()) {
            throw new \LogicException('La finalisation automatique des prêts n’est pas encore disponible.');
        }

        $weeklySalary = $transferNegociation->getExternalContractWeeklySalary();
        if (null === $weeklySalary || $weeklySalary <= 0) {
            throw new \LogicException('Le salaire hebdomadaire convenu est requis pour finaliser ce transfert.');
        }

        $durationMonths = $transferNegociation->getExternalContractDurationMonths();
        if (null === $durationMonths || $durationMonths <= 0) {
            throw new \LogicException('La durée du contrat convenue est requise pour finaliser ce transfert.');
        }

        $transferNegociation
            ->setStatus(TransferNegociationStatusEnum::COMPLETED)
            ->setAgreedAt(new \DateTimeImmutable());
        $listing->setStatus(ListingStatusEnum::CLOSED);
        $player
            ->setTeam($buyerTeam)
            ->setWeeklySalary($weeklySalary)
            ->setJoinedAt(new \DateTimeImmutable('today'))
            ->setContractEndDate((new \DateTimeImmutable('today'))->modify(sprintf('+%d months', $durationMonths)))
            ->setContractStatus(PlayerContractStatusEnum::UNDER_CONTRACT)
            ->setMarketStatus(PlayerMarketStatusEnum::NOT_LISTED)
            ->setUpdatedAt(new \DateTimeImmutable());
        $this->transferTargetRepository->removeForTeamAndPlayer($buyerTeam, $player);

        $transferOffer = $this->findAcceptedTransferOffer($transferNegociation);
        $transferAmount = $transferOffer?->getAmount() ?? 0;
        if ($transferAmount > 0) {
            $buyerTeam->setTransferBudget(max(0, ($buyerTeam->getTransferBudget() ?? 0) - $transferAmount));
            if (null !== $sellerTeam) {
                $sellerTeam->setTransferBudget(($sellerTeam->getTransferBudget() ?? 0) + $transferAmount);
            }
        }

        $this->publicFeedPublisher->publishExternalTransferFinalized($transferNegociation);
    }

    public function finalize(ContractNegociation $contractNegociation, ContractOffer $acceptedOffer): void
    {
        if (PlayerContractNegociationStatusEnum::COMPLETED === $contractNegociation->getStatus()) {
            return;
        }

        $player = $contractNegociation->getPlayer();
        if (null === $player) {
            throw new \LogicException('La négociation ne contient pas toutes les données nécessaires.');
        }

        $acceptedOffer->setStatus(OfferStatusEnum::ACCEPTED);
        foreach ($contractNegociation->getContractOffers() as $offer) {
            $offer->setStatus($offer === $acceptedOffer ? OfferStatusEnum::ACCEPTED : OfferStatusEnum::REJECTED);
        }

        $this->ensureContractPackage($contractNegociation, $acceptedOffer);

        $contractNegociation
            ->setStatus(PlayerContractNegociationStatusEnum::COMPLETED)
            ->setUpdatedAt(new \DateTimeImmutable());

        match ($contractNegociation->getType()) {
            ContractNegotiationTypeEnum::TRANSFER => $this->finalizeTransfer($contractNegociation, $acceptedOffer),
            ContractNegotiationTypeEnum::RENEWAL => $this->finalizeRenewal($contractNegociation, $acceptedOffer),
            ContractNegotiationTypeEnum::TERMINATION => $this->finalizeTermination($contractNegociation, $acceptedOffer),
        };

        $this->expireConcurrentNegotiations($contractNegociation);
        $this->publicFeedPublisher->publishContractFinalized($contractNegociation);
    }

    private function finalizeTransfer(ContractNegociation $contractNegociation, ContractOffer $acceptedOffer): void
    {
        $transferNegociation = $contractNegociation->getTransferNegociation();
        $listing = $transferNegociation?->getListing();
        $player = $contractNegociation->getPlayer();
        $buyerTeam = $contractNegociation->getBuyerTeam();
        $sellerTeam = $listing?->getSellerTeam();

        if (null === $transferNegociation || null === $listing || null === $player || null === $buyerTeam) {
            throw new \LogicException('La négociation de transfert est incomplète.');
        }

        if (TransferTypeEnum::LOAN === $listing->getTransferType()) {
            throw new \LogicException('La finalisation automatique des prêts n’est pas encore disponible.');
        }

        $transferNegociation
            ->setStatus(TransferNegociationStatusEnum::COMPLETED)
            ->setAgreedAt(new \DateTimeImmutable());
        $listing->setStatus(ListingStatusEnum::CLOSED);

        $durationMonths = max(1, $acceptedOffer->getDurationMonths() ?? 1);
        $annualSalary = max(0, $acceptedOffer->getAnnualSalary() ?? 0);
        $player
            ->setTeam($buyerTeam)
            ->setWeeklySalary((int) round($annualSalary / 52))
            ->setJoinedAt(new \DateTimeImmutable('today'))
            ->setContractEndDate((new \DateTimeImmutable('today'))->modify(sprintf('+%d months', $durationMonths)))
            ->setReleaseClause($acceptedOffer->getReleaseClause())
            ->setContractStatus(PlayerContractStatusEnum::UNDER_CONTRACT)
            ->setMarketStatus(PlayerMarketStatusEnum::NOT_LISTED);
        $this->transferTargetRepository->removeForTeamAndPlayer($buyerTeam, $player);

        $transferOffer = $this->findAcceptedTransferOffer($transferNegociation);
        $transferAmount = $transferOffer?->getAmount() ?? 0;
        if ($transferAmount > 0) {
            $buyerTeam->setTransferBudget(max(0, ($buyerTeam->getTransferBudget() ?? 0) - $transferAmount));
            if (null !== $sellerTeam) {
                $sellerTeam->setTransferBudget(($sellerTeam->getTransferBudget() ?? 0) + $transferAmount);
            }
        }
    }

    private function finalizeRenewal(ContractNegociation $contractNegociation, ContractOffer $acceptedOffer): void
    {
        $player = $contractNegociation->getPlayer();
        $team = $contractNegociation->getBuyerTeam();
        if (null === $player || null === $team || $player->getTeam()?->getId()?->toRfc4122() !== $team->getId()?->toRfc4122()) {
            throw new \LogicException('Le joueur ne fait plus partie du club concerné.');
        }

        $annualSalary = $acceptedOffer->getAnnualSalary();
        $durationMonths = $acceptedOffer->getDurationMonths();
        if (null === $annualSalary || $annualSalary <= 0 || null === $durationMonths || $durationMonths <= 0) {
            throw new \LogicException('Les conditions du nouveau contrat sont incomplètes.');
        }

        $player
            ->setWeeklySalary((int) round($annualSalary / 52))
            ->setContractEndDate((new \DateTimeImmutable('today'))->modify(sprintf('+%d months', $durationMonths)))
            ->setReleaseClause($acceptedOffer->getReleaseClause())
            ->setContractStatus(PlayerContractStatusEnum::UNDER_CONTRACT)
            ->setUpdatedAt(new \DateTimeImmutable());
    }

    private function finalizeTermination(ContractNegociation $contractNegociation, ContractOffer $acceptedOffer): void
    {
        $player = $contractNegociation->getPlayer();
        $team = $contractNegociation->getBuyerTeam();
        if (null === $player || null === $team || $player->getTeam()?->getId()?->toRfc4122() !== $team->getId()?->toRfc4122()) {
            throw new \LogicException('Le joueur ne fait plus partie du club concerné.');
        }

        $effectiveDate = $acceptedOffer->getEffectiveDate() ?? new \DateTimeImmutable('today');
        $player
            ->setTeam(null)
            ->setWeeklySalary(null)
            ->setJoinedAt(null)
            ->setReleaseClause(null)
            ->setContractEndDate($effectiveDate)
            ->setContractStatus(PlayerContractStatusEnum::FREE_AGENT)
            ->setMarketStatus(PlayerMarketStatusEnum::NOT_LISTED)
            ->setUpdatedAt(new \DateTimeImmutable());
    }

    private function ensureContractPackage(
        ContractNegociation $contractNegociation,
        ContractOffer $acceptedOffer,
    ): void {
        $package = $this->contractPackageRepository->findOneBy([
            'contractNegociation' => $contractNegociation,
        ]);
        if ($package instanceof ContractPackage) {
            return;
        }

        $package = (new ContractPackage())
            ->setContractNegociation($contractNegociation)
            ->setAcceptedOffer($acceptedOffer)
            ->setStatus(PlayerDecisionStatusEnum::APPROVED)
            ->setCreatedAt(new \DateTimeImmutable());
        $this->entityManager->persist($package);
    }

    private function expireConcurrentNegotiations(ContractNegociation $contractNegociation): void
    {
        $player = $contractNegociation->getPlayer();
        if (null === $player) {
            return;
        }

        $now = new \DateTimeImmutable();
        foreach ($this->contractNegociationRepository->findConcurrentActiveForPlayer($player, $contractNegociation) as $concurrentNegotiation) {
            $concurrentNegotiation
                ->setStatus(PlayerContractNegociationStatusEnum::EXPIRED)
                ->setUpdatedAt($now);

            foreach ($concurrentNegotiation->getContractOffers() as $offer) {
                if (OfferStatusEnum::PENDING === $offer->getStatus()) {
                    $offer->setStatus(OfferStatusEnum::EXPIRED);
                }
            }
        }
    }

    private function findAcceptedTransferOffer(TransferNegociation $transferNegociation): ?TransferOffer
    {
        foreach ($transferNegociation->getTransferOffers() as $offer) {
            if (OfferStatusEnum::ACCEPTED === $offer->getStatus()) {
                return $offer;
            }
        }

        return null;
    }
}
