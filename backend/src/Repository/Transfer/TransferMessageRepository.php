<?php

namespace App\Repository\Transfer;

use App\Entity\Team;
use App\Entity\Transfer\TransferMessage;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<TransferMessage>
 */
class TransferMessageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TransferMessage::class);
    }

    /**
     * @param string[] $excludedAuthorIds
     */
    public function countIncomingForTeam(Team $team, array $excludedAuthorIds): int
    {
        $queryBuilder = $this->createQueryBuilder('transferMessage')
            ->select('COUNT(transferMessage.id)')
            ->innerJoin('transferMessage.transferNegociation', 'negociation')
            ->innerJoin('negociation.listing', 'listing')
            ->setParameter('team', $team);

        $queryBuilder->andWhere($queryBuilder->expr()->orX(
            'negociation.buyerTeam = :team',
            'listing.sellerTeam = :team',
        ));

        if ([] !== $excludedAuthorIds) {
            $queryBuilder
                ->andWhere('IDENTITY(transferMessage.author) NOT IN (:excludedAuthorIds)')
                ->setParameter('excludedAuthorIds', $excludedAuthorIds);
        }

        return (int) $queryBuilder
            ->getQuery()
            ->getSingleScalarResult();
    }
}
