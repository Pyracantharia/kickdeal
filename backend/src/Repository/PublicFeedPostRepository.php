<?php

namespace App\Repository;

use App\Entity\PublicFeedPost;
use App\Enum\PlayerMarketStatusEnum;
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
            ->andWhere('NOT (
                post.sourceType = :listingSource
                AND post.eventType IN (:listingEventTypes)
                AND (player.id IS NULL OR player.marketStatus NOT IN (:listedMarketStatuses))
            )')
            ->setParameter('listingSource', 'listing')
            ->setParameter('listingEventTypes', ['market_listing', 'loan'])
            ->setParameter('listedMarketStatuses', [
                PlayerMarketStatusEnum::ON_MARKET,
                PlayerMarketStatusEnum::LOAN_LISTED,
            ])
            ->orderBy('post.publishedAt', 'DESC')
            ->addOrderBy('post.id', 'DESC')
            ->setMaxResults($filters['limit'] ?? 30);

        $tab = $filters['tab'] ?? 'featured';
        if ('official' === $tab) {
            $qb->andWhere('post.eventType = :officialEventType')
                ->setParameter('officialEventType', 'transfer_official');
        } elseif ('live' === $tab) {
            $qb->andWhere('post.eventType != :officialEventType')
                ->setParameter('officialEventType', 'transfer_official');
        }

        if (!empty($filters['type'])) {
            $qb->andWhere('post.eventType = :eventType')->setParameter('eventType', $filters['type']);
        }

        if (!empty($filters['league'])) {
            $qb->andWhere('(LOWER(post.league) LIKE :league OR LOWER(sellerTeam.league) LIKE :league OR LOWER(buyerTeam.league) LIKE :league)')
                ->setParameter('league', '%'.mb_strtolower($filters['league']).'%');
        }

        if (!empty($filters['country'])) {
            $qb->andWhere('(LOWER(post.country) LIKE :country OR LOWER(sellerTeam.country) LIKE :country OR LOWER(buyerTeam.country) LIKE :country)')
                ->setParameter('country', '%'.mb_strtolower($filters['country']).'%');
        }

        if (!empty($filters['club'])) {
            $qb->andWhere('(LOWER(sellerTeam.name) LIKE :club OR LOWER(buyerTeam.name) LIKE :club)')
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
