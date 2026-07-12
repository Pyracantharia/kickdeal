<?php

namespace App\Repository;

use App\Entity\AppNotification;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<AppNotification>
 */
class AppNotificationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, AppNotification::class);
    }

    /**
     * @return AppNotification[]
     */
    public function findForUser(User $user, string $filter = 'all', int $limit = 50, int $offset = 0): array
    {
        $queryBuilder = $this->createFilteredQueryBuilder($user, $filter)
            ->leftJoin('notification.actor', 'actor')
            ->addSelect('actor')
            ->orderBy('notification.createdAt', 'DESC')
            ->setFirstResult($offset)
            ->setMaxResults($limit);

        return $queryBuilder->getQuery()->getResult();
    }

    public function countForUser(User $user, string $filter = 'all'): int
    {
        return (int) $this->createFilteredQueryBuilder($user, $filter)
            ->select('COUNT(notification.id)')
            ->getQuery()
            ->getSingleScalarResult();
    }

    private function createFilteredQueryBuilder(User $user, string $filter = 'all'): \Doctrine\ORM\QueryBuilder
    {
        $queryBuilder = $this->createQueryBuilder('notification')
            ->andWhere('notification.recipient = :user')
            ->setParameter('user', $user);

        match ($filter) {
            'unread' => $queryBuilder->andWhere('notification.readAt IS NULL'),
            'actions' => $queryBuilder
                ->andWhere('notification.requiresAction = true')
                ->andWhere('notification.resolvedAt IS NULL')
                ->andWhere('notification.category != :messageCategory')
                ->setParameter('messageCategory', 'messages'),
            'messages', 'market', 'negotiations', 'players', 'admin', 'account', 'system' => $queryBuilder
                ->andWhere('notification.category = :category')
                ->setParameter('category', $filter),
            default => null,
        };

        return $queryBuilder;
    }

    public function countUnreadForUser(User $user): int
    {
        return (int) $this->createQueryBuilder('notification')
            ->select('COUNT(notification.id)')
            ->andWhere('notification.recipient = :user')
            ->andWhere('notification.readAt IS NULL')
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function countUnreadForUserByCategory(User $user, string $category): int
    {
        return (int) $this->createQueryBuilder('notification')
            ->select('COUNT(notification.id)')
            ->andWhere('notification.recipient = :user')
            ->andWhere('notification.category = :category')
            ->andWhere('notification.readAt IS NULL')
            ->setParameter('user', $user)
            ->setParameter('category', $category)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * @return array<string, int>
     */
    public function countOpenActionsByTargetRoute(User $user): array
    {
        $rows = $this->createQueryBuilder('notification')
            ->select('notification.targetRoute AS targetRoute, COUNT(notification.id) AS count')
            ->andWhere('notification.recipient = :user')
            ->andWhere('notification.requiresAction = true')
            ->andWhere('notification.resolvedAt IS NULL')
            ->andWhere('notification.category != :messageCategory')
            ->andWhere('notification.targetRoute IS NOT NULL')
            ->setParameter('user', $user)
            ->setParameter('messageCategory', 'messages')
            ->groupBy('notification.targetRoute')
            ->getQuery()
            ->getArrayResult();

        $counts = [];
        foreach ($rows as $row) {
            $counts[(string) $row['targetRoute']] = (int) $row['count'];
        }

        return $counts;
    }

    /**
     * @return array<string, int>
     */
    public function countUnreadByTargetRoute(User $user): array
    {
        $rows = $this->createQueryBuilder('notification')
            ->select('notification.targetRoute AS targetRoute, COUNT(notification.id) AS count')
            ->andWhere('notification.recipient = :user')
            ->andWhere('notification.readAt IS NULL')
            ->andWhere('notification.targetRoute IS NOT NULL')
            ->setParameter('user', $user)
            ->groupBy('notification.targetRoute')
            ->getQuery()
            ->getArrayResult();

        $counts = [];
        foreach ($rows as $row) {
            $counts[(string) $row['targetRoute']] = (int) $row['count'];
        }

        return $counts;
    }

    /**
     * @return AppNotification[]
     */
    public function findOpenActionsForSource(string $sourceType, string $sourceId): array
    {
        return $this->createQueryBuilder('notification')
            ->andWhere('notification.sourceType = :sourceType')
            ->andWhere('notification.sourceId = :sourceId')
            ->andWhere('notification.requiresAction = true')
            ->andWhere('notification.resolvedAt IS NULL')
            ->setParameter('sourceType', $sourceType)
            ->setParameter('sourceId', $sourceId)
            ->getQuery()
            ->getResult();
    }

    /**
     * @return AppNotification[]
     */
    public function findUnreadForUserAndSource(User $user, string $sourceType, string $sourceId): array
    {
        return $this->createQueryBuilder('notification')
            ->andWhere('notification.recipient = :user')
            ->andWhere('notification.sourceType = :sourceType')
            ->andWhere('notification.sourceId = :sourceId')
            ->andWhere('notification.readAt IS NULL')
            ->setParameter('user', $user)
            ->setParameter('sourceType', $sourceType)
            ->setParameter('sourceId', $sourceId)
            ->getQuery()
            ->getResult();
    }
}
