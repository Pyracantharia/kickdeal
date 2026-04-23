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
}
