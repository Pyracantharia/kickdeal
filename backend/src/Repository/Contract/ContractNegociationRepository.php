<?php

namespace App\Repository\Contract;

use App\Entity\Team;
use App\Entity\Contract\ContractNegociation;
use App\Enum\PlayerContractNegociationStatusEnum;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ContractNegociation>
 */
class ContractNegociationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ContractNegociation::class);
    }

    public function countPendingForTeam(Team $team): int
    {
        return (int) $this->createQueryBuilder('contractNegociation')
            ->select('COUNT(contractNegociation.id)')
            ->andWhere('contractNegociation.buyerTeam = :team')
            ->andWhere('contractNegociation.status IN (:statuses)')
            ->setParameter('team', $team)
            ->setParameter('statuses', [
                PlayerContractNegociationStatusEnum::OPEN,
                PlayerContractNegociationStatusEnum::COUNTER_OFFER,
                PlayerContractNegociationStatusEnum::SENT_TO_PLAYER,
                PlayerContractNegociationStatusEnum::PLAYER_ACCEPTED,
                PlayerContractNegociationStatusEnum::AGENT_ACCEPTED,
            ])
            ->getQuery()
            ->getSingleScalarResult();
    }
}
