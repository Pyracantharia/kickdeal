<?php

namespace App\Repository\Contract;

use App\Entity\Agent;
use App\Entity\Contract\ContractOffer;
use App\Enum\OfferStatusEnum;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ContractOffer>
 */
class ContractOfferRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ContractOffer::class);
    }

    public function countPendingForAgent(Agent $agent): int
    {
        return (int) $this->createQueryBuilder('contractOffer')
            ->select('COUNT(contractOffer.id)')
            ->innerJoin('contractOffer.contractNegociation', 'contractNegociation')
            ->andWhere('contractNegociation.agent = :agent')
            ->andWhere('contractOffer.status = :status')
            ->setParameter('agent', $agent)
            ->setParameter('status', OfferStatusEnum::PENDING)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
