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
            ])
            ->orderBy('negociation.updatedAt', 'DESC')
            ->addOrderBy('negociation.createdAt', 'DESC')
            ->setMaxResults(1);

        return $queryBuilder->getQuery()->getOneOrNullResult();
    }
}
