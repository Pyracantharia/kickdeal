<?php

namespace App\Repository\Transfer;

use App\Entity\Team;
use App\Entity\Transfer\TransferOffer;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<TransferOffer>
 */
class TransferOfferRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TransferOffer::class);
    }

    public function countForTeam(Team $team): int
    {
        $queryBuilder = $this->createQueryBuilder('transferOffer')
            ->select('COUNT(transferOffer.id)')
            ->innerJoin('transferOffer.transferNegociation', 'negociation')
            ->innerJoin('negociation.listing', 'listing');

        $queryBuilder
            ->andWhere($queryBuilder->expr()->orX(
                'negociation.buyerTeam = :team',
                'listing.sellerTeam = :team',
            ))
            ->setParameter('team', $team);

        return (int) $queryBuilder->getQuery()->getSingleScalarResult();
    }
}
