<?php

namespace App\Repository;

use App\Entity\AdminAuditLog;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

final class AdminAuditLogRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry) { parent::__construct($registry, AdminAuditLog::class); }

    public function findRecent(?string $category = null, ?string $search = null): array
    {
        $qb=$this->createQueryBuilder('log')->orderBy('log.createdAt','DESC')->setMaxResults(500);
        if ($category) $qb->andWhere('log.category = :category')->setParameter('category',$category);
        if ($search) $qb->andWhere('LOWER(log.adminEmail) LIKE :search OR LOWER(log.adminName) LIKE :search OR LOWER(log.targetLabel) LIKE :search OR LOWER(log.action) LIKE :search')->setParameter('search','%'.mb_strtolower(trim($search)).'%');
        return $qb->getQuery()->getResult();
    }
}
