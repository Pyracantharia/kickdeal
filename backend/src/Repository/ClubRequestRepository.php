<?php

namespace App\Repository;

use App\Entity\ClubRequest;
use App\Entity\Team;
use App\Entity\User;
use App\Enum\ClubRequestStatusEnum;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ClubRequest>
 */
class ClubRequestRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ClubRequest::class);
    }

    public function hasPendingRequest(User $requester, Team $team): bool
    {
        $result = $this->createQueryBuilder('clubRequest')
            ->select('COUNT(clubRequest.id)')
            ->andWhere('clubRequest.requester = :requester')
            ->andWhere('clubRequest.team = :team')
            ->andWhere('clubRequest.status = :status')
            ->setParameter('requester', $requester)
            ->setParameter('team', $team)
            ->setParameter('status', ClubRequestStatusEnum::PENDING)
            ->getQuery()
            ->getSingleScalarResult();

        return (int) $result > 0;
    }
}
