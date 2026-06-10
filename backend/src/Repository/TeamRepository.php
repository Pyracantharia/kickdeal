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
}
