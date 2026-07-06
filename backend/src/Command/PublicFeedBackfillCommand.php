<?php

namespace App\Command;

use App\Entity\Contract\ContractNegociation;
use App\Entity\Listing;
use App\Entity\Transfer\TransferNegociation;
use App\Entity\Transfer\TransferOffer;
use App\Enum\ListingStatusEnum;
use App\Enum\OfferStatusEnum;
use App\Enum\PlayerContractNegociationStatusEnum;
use App\Enum\TransferNegociationStatusEnum;
use App\Repository\Contract\ContractNegociationRepository;
use App\Repository\ListingRepository;
use App\Repository\Transfer\TransferNegociationRepository;
use App\Repository\Transfer\TransferOfferRepository;
use App\Service\PublicFeed\PublicFeedPublisher;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:public-feed:backfill',
    description: 'Generate public feed posts from existing KickDeal events.',
)]
final class PublicFeedBackfillCommand extends Command
{
    public function __construct(
        private readonly ListingRepository $listingRepository,
        private readonly TransferOfferRepository $transferOfferRepository,
        private readonly TransferNegociationRepository $transferNegociationRepository,
        private readonly ContractNegociationRepository $contractNegociationRepository,
        private readonly PublicFeedPublisher $publicFeedPublisher,
        private readonly EntityManagerInterface $entityManager,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $count = 0;

        foreach ($this->listingRepository->findBy(['status' => ListingStatusEnum::ACTIVE]) as $listing) {
            if ($listing instanceof Listing && null !== $this->publicFeedPublisher->publishListing($listing)) {
                ++$count;
            }
        }

        foreach ($this->transferOfferRepository->findBy(['status' => OfferStatusEnum::ACCEPTED]) as $offer) {
            if ($offer instanceof TransferOffer && null !== $this->publicFeedPublisher->publishTransferAgreement($offer)) {
                ++$count;
            }
        }

        foreach ($this->contractNegociationRepository->findBy(['status' => PlayerContractNegociationStatusEnum::COMPLETED]) as $negociation) {
            if ($negociation instanceof ContractNegociation && null !== $this->publicFeedPublisher->publishContractFinalized($negociation)) {
                ++$count;
            }
        }

        foreach ($this->transferNegociationRepository->findBy(['status' => TransferNegociationStatusEnum::COMPLETED]) as $negociation) {
            if (
                $negociation instanceof TransferNegociation
                && null !== $negociation->getExternalContractWeeklySalary()
                && null !== $this->publicFeedPublisher->publishExternalTransferFinalized($negociation)
            ) {
                ++$count;
            }
        }

        $this->entityManager->flush();

        $io->success(sprintf('%d public feed posts generated or refreshed.', $count));

        return Command::SUCCESS;
    }
}
