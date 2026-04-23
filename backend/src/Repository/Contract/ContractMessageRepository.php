<?php

namespace App\Repository\Contract;

use App\Entity\Team;
use App\Entity\Contract\ContractMessage;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ContractMessage>
 */
class ContractMessageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ContractMessage::class);
    }

    /**
     * @param string[] $excludedAuthorIds
     */
    public function countIncomingForTeam(Team $team, array $excludedAuthorIds): int
    {
        $queryBuilder = $this->createQueryBuilder('contractMessage')
            ->select('COUNT(contractMessage.id)')
            ->innerJoin('contractMessage.contractNegociation', 'contractNegociation')
            ->andWhere('contractNegociation.buyerTeam = :team')
            ->setParameter('team', $team);

        if ([] !== $excludedAuthorIds) {
            $queryBuilder
                ->andWhere('IDENTITY(contractMessage.author) NOT IN (:excludedAuthorIds)')
                ->setParameter('excludedAuthorIds', $excludedAuthorIds);
        }

        return (int) $queryBuilder
            ->getQuery()
            ->getSingleScalarResult();
    }
}
