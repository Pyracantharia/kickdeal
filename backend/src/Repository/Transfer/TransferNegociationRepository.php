<?php

namespace App\Repository\Transfer;

use App\Entity\Team;
use App\Entity\Transfer\TransferNegociation;
use App\Enum\TransferNegociationStatusEnum;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<TransferNegociation>
 */
class TransferNegociationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TransferNegociation::class);
    }

    public function findLatestActiveForTeam(Team $team): ?TransferNegociation
    {
        $queryBuilder = $this->createQueryBuilder('negociation')
            ->innerJoin('negociation.listing', 'listing')
            ->innerJoin('listing.player', 'player')
            ->addSelect('listing', 'player');

        $queryBuilder
            ->andWhere($queryBuilder->expr()->orX(
                'negociation.buyerTeam = :team',
                'listing.sellerTeam = :team',
            ))
            ->andWhere('negociation.status IN (:statuses)')
            ->setParameter('team', $team)
            ->setParameter('statuses', [
                TransferNegociationStatusEnum::OPEN,
                TransferNegociationStatusEnum::COUNTER_OFFER,
                TransferNegociationStatusEnum::PERMISSION_TO_SPEAK,
                TransferNegociationStatusEnum::AGREED_CLUBS,
                TransferNegociationStatusEnum::PENDING_AGENT,
            ])
            ->orderBy('negociation.updatedAt', 'DESC')
            ->addOrderBy('negociation.createdAt', 'DESC')
            ->setMaxResults(1);

        return $queryBuilder->getQuery()->getOneOrNullResult();
    }

    public function countActiveForTeam(Team $team): int
    {
        $queryBuilder = $this->createQueryBuilder('negociation')
            ->select('COUNT(negociation.id)')
            ->innerJoin('negociation.listing', 'listing');

        $queryBuilder
            ->andWhere($queryBuilder->expr()->orX(
                'negociation.buyerTeam = :team',
                'listing.sellerTeam = :team',
            ))
            ->andWhere('negociation.status IN (:statuses)')
            ->setParameter('team', $team)
            ->setParameter('statuses', [
                TransferNegociationStatusEnum::OPEN,
                TransferNegociationStatusEnum::COUNTER_OFFER,
                TransferNegociationStatusEnum::PERMISSION_TO_SPEAK,
                TransferNegociationStatusEnum::AGREED_CLUBS,
                TransferNegociationStatusEnum::PENDING_AGENT,
            ]);

        return (int) $queryBuilder->getQuery()->getSingleScalarResult();
    }

    public function findOneForListingAndBuyer(mixed $listing, Team $buyerTeam): ?TransferNegociation
    {
        return $this->createQueryBuilder('negociation')
            ->andWhere('negociation.listing = :listing')
            ->andWhere('negociation.buyerTeam = :buyerTeam')
            ->setParameter('listing', $listing)
            ->setParameter('buyerTeam', $buyerTeam)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * @return TransferNegociation[]
     */
    public function findAwaitingContractNegotiation(): array
    {
        return $this->createQueryBuilder('negociation')
            ->addSelect('listing', 'player', 'agent', 'buyerTeam', 'offers')
            ->join('negociation.listing', 'listing')
            ->join('listing.player', 'player')
            ->leftJoin('player.agent', 'agent')
            ->join('negociation.buyerTeam', 'buyerTeam')
            ->leftJoin('negociation.transferOffers', 'offers')
            ->leftJoin('negociation.contractNegociations', 'contractNegociation')
            ->andWhere('negociation.status IN (:status)')
            ->andWhere('agent.id IS NOT NULL')
            ->andWhere('contractNegociation.id IS NULL')
            ->setParameter('status', [
                TransferNegociationStatusEnum::AGREED_CLUBS,
                TransferNegociationStatusEnum::PENDING_AGENT,
            ])
            ->getQuery()
            ->getResult();
    }

    /**
     * @return TransferNegociation[]
     */
    public function findPendingAgentForPlayer(mixed $player): array
    {
        return $this->createQueryBuilder('negociation')
            ->addSelect('listing', 'buyerTeam', 'offers')
            ->innerJoin('negociation.listing', 'listing')
            ->innerJoin('negociation.buyerTeam', 'buyerTeam')
            ->leftJoin('negociation.transferOffers', 'offers')
            ->leftJoin('negociation.contractNegociations', 'contractNegociation')
            ->andWhere('listing.player = :player')
            ->andWhere('negociation.status = :status')
            ->andWhere('contractNegociation.id IS NULL')
            ->setParameter('player', $player)
            ->setParameter('status', TransferNegociationStatusEnum::PENDING_AGENT)
            ->getQuery()
            ->getResult();
    }
}
