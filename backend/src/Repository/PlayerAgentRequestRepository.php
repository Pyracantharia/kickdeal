<?php

namespace App\Repository;

use App\Entity\Agent;
use App\Entity\Player;
use App\Entity\PlayerAgentRequest;
use App\Enum\PlayerAgentRequestStatusEnum;
use App\Enum\PlayerAgentRequestTypeEnum;
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

    public function hasPendingHandoverForPlayer(Player $player): bool
    {
        return null !== $this->createQueryBuilder('request')
            ->andWhere('request.player = :player')
            ->andWhere('request.type = :type')
            ->andWhere('request.status IN (:statuses)')
            ->setParameter('player', $player)
            ->setParameter('type', PlayerAgentRequestTypeEnum::AGENT_HANDOVER)
            ->setParameter('statuses', [
                PlayerAgentRequestStatusEnum::PENDING->value,
                PlayerAgentRequestStatusEnum::ADMIN_APPROVED->value,
            ])
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
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

    /**
     * @return PlayerAgentRequest[]
     */
    public function findHandoverRequestsForCurrentAgent(Agent $agent): array
    {
        return $this->createQueryBuilder('request')
            ->addSelect('player', 'team', 'newAgent', 'newAgentUser')
            ->join('request.player', 'player')
            ->leftJoin('player.team', 'team')
            ->join('request.agent', 'newAgent')
            ->leftJoin('newAgent.user', 'newAgentUser')
            ->andWhere('request.currentAgent = :agent')
            ->andWhere('request.type = :type')
            ->andWhere('request.status = :status')
            ->setParameter('agent', $agent)
            ->setParameter('type', PlayerAgentRequestTypeEnum::AGENT_HANDOVER)
            ->setParameter('status', PlayerAgentRequestStatusEnum::ADMIN_APPROVED)
            ->orderBy('request.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * @return PlayerAgentRequest[]
     */
    public function findPendingAdminRequests(?int $limit = null): array
    {
        $queryBuilder = $this->createQueryBuilder('request')
            ->addSelect('player', 'newAgent', 'newAgentUser', 'currentAgent', 'currentAgentUser')
            ->join('request.player', 'player')
            ->join('request.agent', 'newAgent')
            ->leftJoin('newAgent.user', 'newAgentUser')
            ->leftJoin('request.currentAgent', 'currentAgent')
            ->leftJoin('currentAgent.user', 'currentAgentUser')
            ->andWhere('request.status = :status')
            ->setParameter('status', PlayerAgentRequestStatusEnum::PENDING)
            ->orderBy('request.createdAt', 'DESC');

        if (null !== $limit) {
            $queryBuilder->setMaxResults($limit);
        }

        return $queryBuilder->getQuery()->getResult();
    }
}
