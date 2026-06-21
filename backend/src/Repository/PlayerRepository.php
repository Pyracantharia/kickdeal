<?php

namespace App\Repository;

use App\Entity\Agent;
use App\Entity\Player;
use App\Entity\Team;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Player>
 */
class PlayerRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Player::class);
    }

    /**
     * @return Player[]
     */
    public function findAllWithRelations(): array
    {
        return $this->createQueryBuilder('player')
            ->leftJoin('player.team', 'team')
            ->leftJoin('player.agent', 'agent')
            ->addSelect('team', 'agent')
            ->orderBy('player.lastName', 'ASC')
            ->addOrderBy('player.firstName', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * @return Player[]
     */
    public function findRosterForTeam(Team $team): array
    {
        return $this->createQueryBuilder('player')
            ->leftJoin('player.team', 'team')
            ->leftJoin('player.agent', 'agent')
            ->addSelect('team', 'agent')
            ->andWhere('player.team = :team')
            ->setParameter('team', $team)
            ->orderBy('player.position', 'ASC')
            ->addOrderBy('player.lastName', 'ASC')
            ->addOrderBy('player.firstName', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * @return Player[]
     */
    public function findRepresentedByAgent(Agent $agent, ?int $limit = null): array
    {
        $queryBuilder = $this->createQueryBuilder('player')
            ->leftJoin('player.team', 'team')
            ->addSelect('team')
            ->andWhere('player.agent = :agent')
            ->setParameter('agent', $agent)
            ->orderBy('player.updatedAt', 'DESC')
            ->addOrderBy('player.lastName', 'ASC');

        if (null !== $limit) {
            $queryBuilder->setMaxResults($limit);
        }

        return $queryBuilder->getQuery()->getResult();
    }

    /**
     * @return Player[]
     */
    public function searchAvailableForAgent(string $query = '', int $limit = 30): array
    {
        $queryBuilder = $this->createQueryBuilder('player')
            ->leftJoin('player.team', 'team')
            ->addSelect('team')
            ->andWhere('player.agent IS NULL')
            ->orderBy('player.lastName', 'ASC')
            ->addOrderBy('player.firstName', 'ASC')
            ->setMaxResults($limit);

        if ('' !== trim($query)) {
            $normalizedQuery = '%'.mb_strtolower(trim($query)).'%';
            $queryBuilder
                ->andWhere(
                    $queryBuilder->expr()->orX(
                        'LOWER(player.firstName) LIKE :query',
                        'LOWER(player.lastName) LIKE :query',
                        'LOWER(CONCAT(player.firstName, \' \', player.lastName)) LIKE :query',
                        'LOWER(team.name) LIKE :query'
                    )
                )
                ->setParameter('query', $normalizedQuery);
        }

        return $queryBuilder->getQuery()->getResult();
    }
}
