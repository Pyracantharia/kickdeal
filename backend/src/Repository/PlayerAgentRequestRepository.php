<?php

namespace App\Repository;

use App\Entity\Agent;
use App\Entity\Player;
use App\Entity\PlayerAgentRequest;
use App\Enum\PlayerAgentRequestStatusEnum;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<PlayerAgentRequest>
 */
class PlayerAgentRequestRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PlayerAgentRequest::class);
    }

    public function hasPendingRequest(Agent $agent, Player $player): bool
    {
        return null !== $this->findOneBy([
            'agent' => $agent,
            'player' => $player,
            'status' => PlayerAgentRequestStatusEnum::PENDING,
        ]);
    }

    /**
     * @return PlayerAgentRequest[]
     */
    public function findRecentForAgent(Agent $agent): array
    {
        return $this->createQueryBuilder('request')
            ->addSelect('player', 'team')
            ->join('request.player', 'player')
            ->leftJoin('player.team', 'team')
            ->andWhere('request.agent = :agent')
            ->setParameter('agent', $agent)
            ->orderBy('request.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
