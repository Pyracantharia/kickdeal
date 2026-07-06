<?php

namespace App\Repository;

use App\Entity\MessageReport;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<MessageReport>
 */
class MessageReportRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MessageReport::class);
    }

    /**
     * @return MessageReport[]
     */
    public function findForAdmin(?string $status = MessageReport::STATUS_PENDING): array
    {
        $queryBuilder = $this->createQueryBuilder('report')
            ->leftJoin('report.message', 'message')->addSelect('message')
            ->leftJoin('report.conversation', 'conversation')->addSelect('conversation')
            ->leftJoin('report.reporter', 'reporter')->addSelect('reporter')
            ->leftJoin('report.reportedUser', 'reportedUser')->addSelect('reportedUser')
            ->leftJoin('report.decidedBy', 'decidedBy')->addSelect('decidedBy')
            ->orderBy('report.createdAt', 'DESC');

        if (null !== $status && 'all' !== $status) {
            $queryBuilder
                ->andWhere('report.status = :status')
                ->setParameter('status', $status);
        }

        return $queryBuilder
            ->setMaxResults(150)
            ->getQuery()
            ->getResult();
    }
}
