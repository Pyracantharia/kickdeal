<?php

namespace App\Repository;

use App\Entity\PublicFeedPost;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<PublicFeedPost>
 */
class PublicFeedPostRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PublicFeedPost::class);
    }

    /**
     * @param array{
     *   tab?: string,
     *   type?: string,
     *   league?: string,
     *   country?: string,
     *   club?: string,
     *   player?: string,
     *   cursor?: string|null,
     *   limit?: int
     * } $filters
     *
     * @return PublicFeedPost[]
     */
    public function findForPublicFeed(array $filters): array
    {
        $qb = $this->createQueryBuilder('post')
            ->leftJoin('post.player', 'player')
            ->leftJoin('post.sellerTeam', 'sellerTeam')
            ->leftJoin('post.buyerTeam', 'buyerTeam')
            ->addSelect('player', 'sellerTeam', 'buyerTeam')
            ->orderBy('post.publishedAt', 'DESC')
            ->addOrderBy('post.id', 'DESC')
            ->setMaxResults($filters['limit'] ?? 30);

        $tab = $filters['tab'] ?? 'featured';
        if ('featured' === $tab) {
            $qb->andWhere('post.isFeatured = true');
        } elseif (in_array($tab, ['official', 'live'], true)) {
            $qb->andWhere('post.bucket = :bucket')->setParameter('bucket', $tab);
        }

        if (!empty($filters['type'])) {
            $qb->andWhere('post.eventType = :eventType')->setParameter('eventType', $filters['type']);
        }

        if (!empty($filters['league'])) {
            $qb->andWhere('LOWER(post.league) LIKE :league')
                ->setParameter('league', '%'.mb_strtolower($filters['league']).'%');
        }

        if (!empty($filters['country'])) {
            $qb->andWhere('LOWER(post.country) LIKE :country')
                ->setParameter('country', '%'.mb_strtolower($filters['country']).'%');
        }

        if (!empty($filters['club'])) {
            $qb->andWhere('LOWER(sellerTeam.name) LIKE :club OR LOWER(buyerTeam.name) LIKE :club')
                ->setParameter('club', '%'.mb_strtolower($filters['club']).'%');
        }

        if (!empty($filters['player'])) {
            $qb->andWhere('LOWER(post.playerName) LIKE :player')
                ->setParameter('player', '%'.mb_strtolower($filters['player']).'%');
        }

        if (!empty($filters['cursor'])) {
            try {
                $cursorDate = new \DateTimeImmutable($filters['cursor']);
                $qb->andWhere('post.publishedAt < :cursor')->setParameter('cursor', $cursorDate);
            } catch (\Throwable) {
            }
        }

        return $qb->getQuery()->getResult();
    }

    public function findOneBySource(string $sourceType, string $sourceId, string $eventType): ?PublicFeedPost
    {
        return $this->findOneBy([
            'sourceType' => $sourceType,
            'sourceId' => $sourceId,
            'eventType' => $eventType,
        ]);
    }
}
