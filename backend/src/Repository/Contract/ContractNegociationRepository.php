<?php

namespace App\Repository\Contract;

use App\Entity\Agent;
use App\Entity\Team;
use App\Entity\Contract\ContractNegociation;
use App\Entity\Player;
use App\Enum\ContractNegotiationTypeEnum;
use App\Enum\PlayerContractNegociationStatusEnum;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ContractNegociation>
 */
class ContractNegociationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ContractNegociation::class);
    }

    public function countPendingForTeam(Team $team): int
    {
        return (int) $this->createQueryBuilder('contractNegociation')
            ->select('COUNT(contractNegociation.id)')
            ->andWhere('contractNegociation.buyerTeam = :team')
            ->andWhere('contractNegociation.status IN (:statuses)')
            ->setParameter('team', $team)
            ->setParameter('statuses', $this->activeStatuses())
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function countActiveForAgent(Agent $agent): int
    {
        return (int) $this->createQueryBuilder('contractNegociation')
            ->select('COUNT(contractNegociation.id)')
            ->andWhere('contractNegociation.agent = :agent')
            ->andWhere('contractNegociation.status IN (:statuses)')
            ->setParameter('agent', $agent)
            ->setParameter('statuses', $this->activeStatuses())
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * @return ContractNegociation[]
     */
    public function findRecentForAgent(Agent $agent, int $limit = 5): array
    {
        return $this->createQueryBuilder('contractNegociation')
            ->leftJoin('contractNegociation.player', 'player')
            ->leftJoin('player.team', 'playerTeam')
            ->leftJoin('contractNegociation.buyerTeam', 'buyerTeam')
            ->addSelect('player', 'playerTeam', 'buyerTeam')
            ->andWhere('contractNegociation.agent = :agent')
            ->setParameter('agent', $agent)
            ->orderBy('contractNegociation.updatedAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * @return ContractNegociation[]
     */
    public function findForAgent(Agent $agent): array
    {
        return $this->createQueryBuilder('contractNegociation')
            ->addSelect('player', 'playerTeam', 'buyerTeam', 'offers', 'offerAuthor', 'transferNegociation', 'listing', 'sellerTeam')
            ->join('contractNegociation.player', 'player')
            ->leftJoin('player.team', 'playerTeam')
            ->join('contractNegociation.buyerTeam', 'buyerTeam')
            ->leftJoin('contractNegociation.contractOffers', 'offers')
            ->leftJoin('offers.author', 'offerAuthor')
            ->leftJoin('contractNegociation.transferNegociation', 'transferNegociation')
            ->leftJoin('transferNegociation.listing', 'listing')
            ->leftJoin('listing.sellerTeam', 'sellerTeam')
            ->andWhere('contractNegociation.agent = :agent')
            ->setParameter('agent', $agent)
            ->orderBy('contractNegociation.updatedAt', 'DESC')
            ->addOrderBy('contractNegociation.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * @return ContractNegociation[]
     */
    public function findForBuyerTeam(Team $team): array
    {
        return $this->createQueryBuilder('contractNegociation')
            ->addSelect('player', 'playerTeam', 'buyerTeam', 'agent', 'agentUser', 'offers', 'offerAuthor', 'transferNegociation', 'listing', 'sellerTeam')
            ->join('contractNegociation.player', 'player')
            ->leftJoin('player.team', 'playerTeam')
            ->join('contractNegociation.buyerTeam', 'buyerTeam')
            ->join('contractNegociation.agent', 'agent')
            ->join('agent.user', 'agentUser')
            ->leftJoin('contractNegociation.contractOffers', 'offers')
            ->leftJoin('offers.author', 'offerAuthor')
            ->leftJoin('contractNegociation.transferNegociation', 'transferNegociation')
            ->leftJoin('transferNegociation.listing', 'listing')
            ->leftJoin('listing.sellerTeam', 'sellerTeam')
            ->andWhere('contractNegociation.buyerTeam = :team')
            ->setParameter('team', $team)
            ->orderBy('contractNegociation.updatedAt', 'DESC')
            ->addOrderBy('contractNegociation.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findActiveForPlayerTeamAndType(
        Player $player,
        Team $team,
        ContractNegotiationTypeEnum $type,
    ): ?ContractNegociation {
        return $this->createQueryBuilder('contractNegociation')
            ->andWhere('contractNegociation.player = :player')
            ->andWhere('contractNegociation.buyerTeam = :team')
            ->andWhere('contractNegociation.type = :type')
            ->andWhere('contractNegociation.status IN (:statuses)')
            ->setParameter('player', $player)
            ->setParameter('team', $team)
            ->setParameter('type', $type)
            ->setParameter('statuses', $this->activeStatuses())
            ->orderBy('contractNegociation.createdAt', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * @return ContractNegociation[]
     */
    public function findConcurrentActiveForPlayer(
        Player $player,
        ContractNegociation $currentNegotiation,
    ): array {
        return $this->createQueryBuilder('contractNegociation')
            ->leftJoin('contractNegociation.contractOffers', 'offers')
            ->addSelect('offers')
            ->andWhere('contractNegociation.player = :player')
            ->andWhere('contractNegociation.id != :currentNegotiationId')
            ->andWhere('contractNegociation.status IN (:statuses)')
            ->setParameter('player', $player)
            ->setParameter('currentNegotiationId', $currentNegotiation->getId())
            ->setParameter('statuses', $this->activeStatuses())
            ->orderBy('contractNegociation.updatedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * @return PlayerContractNegociationStatusEnum[]
     */
    private function activeStatuses(): array
    {
        return [
            PlayerContractNegociationStatusEnum::OPEN,
            PlayerContractNegociationStatusEnum::COUNTER_OFFER,
            PlayerContractNegociationStatusEnum::SENT_TO_PLAYER,
            PlayerContractNegociationStatusEnum::PLAYER_ACCEPTED,
            PlayerContractNegociationStatusEnum::AGENT_ACCEPTED,
        ];
    }
}
