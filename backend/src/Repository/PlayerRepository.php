<?php

namespace App\Repository;

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
}