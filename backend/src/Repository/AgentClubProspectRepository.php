<?php

namespace App\Repository;

use App\Entity\Agent;
use App\Entity\AgentClubProspect;
use App\Entity\Player;
use App\Entity\Team;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<AgentClubProspect>
 */
class AgentClubProspectRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, AgentClubProspect::class);
    }

    public function findOneForTarget(Agent $agent, Player $player, Team $team): ?AgentClubProspect
    {
        return $this->findOneBy([
            'agent' => $agent,
            'player' => $player,
            'team' => $team,
        ]);
    }

    /**
     * @return AgentClubProspect[]
     */
    public function findForPlayer(Agent $agent, Player $player): array
    {
        return $this->createQueryBuilder('prospect')
            ->addSelect('team')
            ->join('prospect.team', 'team')
            ->andWhere('prospect.agent = :agent')
            ->andWhere('prospect.player = :player')
            ->setParameter('agent', $agent)
            ->setParameter('player', $player)
            ->orderBy('prospect.updatedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
