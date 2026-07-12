<?php

namespace App\Repository;

use App\Entity\Team;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Team>
 */
class TeamRepository extends ServiceEntityRepository
{
    private const AGENT_PROSPECT_LEAGUES = [
        'Ligue 1',
        'Premier League',
        'Bundesliga',
        'Primera Division',
        'Serie A',
        'Eredivisie',
        'Primeira Liga',
    ];

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Team::class);
    }

    /**
     * @return Team[]
     */
    public function searchByQuery(?string $query, int $limit = 20): array
    {
        $qb = $this->createQueryBuilder('team')
            ->orderBy('team.name', 'ASC')
            ->setMaxResults($limit);

        $trimmedQuery = null !== $query ? trim($query) : null;

        if (null !== $trimmedQuery && '' !== $trimmedQuery) {
            $qb
                ->andWhere('LOWER(team.name) LIKE :query OR LOWER(team.country) LIKE :query OR LOWER(team.league) LIKE :query')
                ->setParameter('query', '%'.mb_strtolower($trimmedQuery).'%');
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * @return array<int, array{name: string, clubCount: int}>
     */
    public function findAvailableLeagues(): array
    {
        /** @var array<int, array{league: string, clubCount: string|int}> $rows */
        $rows = $this->createQueryBuilder('team')
            ->select('team.league AS league')
            ->addSelect('COUNT(team.id) AS clubCount')
            ->andWhere('team.league IS NOT NULL')
            ->andWhere("TRIM(team.league) <> ''")
            ->groupBy('team.league')
            ->orderBy('team.league', 'ASC')
            ->getQuery()
            ->getArrayResult();

        return array_map(static fn (array $row): array => [
            'name' => $row['league'],
            'clubCount' => (int) $row['clubCount'],
        ], $rows);
    }

    /**
     * @return Team[]
     */
    public function findByLeague(string $league): array
    {
        return $this->createQueryBuilder('team')
            ->andWhere('LOWER(team.league) = :league')
            ->setParameter('league', mb_strtolower(trim($league)))
            ->orderBy('team.name', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * @return array<int, array{0: Team, squadSize: string|int, positionCount: string|int, squadValue: string|int|null}>
     */
    public function findAgentProspectRows(
        string $position,
        ?string $query = null,
        ?string $country = null,
        ?string $league = null,
    ): array {
        $queryBuilder = $this->createQueryBuilder('team')
            ->select('team')
            ->addSelect('COUNT(player.id) AS squadSize')
            ->addSelect('SUM(CASE WHEN player.position = :position THEN 1 ELSE 0 END) AS positionCount')
            ->addSelect('COALESCE(SUM(player.marketValue), 0) AS squadValue')
            ->leftJoin('team.players', 'player')
            ->andWhere('team.league IN (:leagues)')
            ->setParameter('position', $position)
            ->setParameter('leagues', self::AGENT_PROSPECT_LEAGUES)
            ->groupBy('team.id')
            ->orderBy('team.name', 'ASC');

        if (null !== $query && '' !== trim($query)) {
            $queryBuilder
                ->andWhere('LOWER(team.name) LIKE :query')
                ->setParameter('query', '%'.mb_strtolower(trim($query)).'%');
        }

        if (null !== $country && '' !== trim($country)) {
            $queryBuilder
                ->andWhere('LOWER(team.country) = :country')
                ->setParameter('country', mb_strtolower(trim($country)));
        }

        if (null !== $league && '' !== trim($league)) {
            $queryBuilder
                ->andWhere('LOWER(team.league) = :league')
                ->setParameter('league', mb_strtolower(trim($league)));
        }

        return $queryBuilder->getQuery()->getResult();
    }
}
