<?php

namespace App\Repository;

use App\Entity\Player;
use App\Entity\Team;
use App\Entity\TransferTarget;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<TransferTarget>
 */
class TransferTargetRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TransferTarget::class);
    }

    /**
     * @return TransferTarget[]
     */
    public function findForTeam(Team $team): array
    {
        return $this->createQueryBuilder('target')
            ->innerJoin('target.player', 'player')
            ->leftJoin('player.team', 'playerTeam')
            ->addSelect('player', 'playerTeam')
            ->andWhere('target.team = :team')
            ->setParameter('team', $team)
            ->orderBy('target.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findOneForTeamAndPlayer(Team $team, Player $player): ?TransferTarget
    {
        return $this->findOneBy([
            'team' => $team,
            'player' => $player,
        ]);
    }

    public function removeForTeamAndPlayer(Team $team, Player $player): void
    {
        $this->createQueryBuilder('target')
            ->delete()
            ->andWhere('target.team = :team')
            ->andWhere('target.player = :player')
            ->setParameter('team', $team)
            ->setParameter('player', $player)
            ->getQuery()
            ->execute();
    }
}
