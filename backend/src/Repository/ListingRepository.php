<?php

namespace App\Repository;

use App\Entity\Listing;
use App\Entity\Player;
use App\Entity\Team;
use App\Enum\ListingStatusEnum;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Listing>
 */
class ListingRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Listing::class);
    }

    /**
     * @return Listing[]
     */
    public function findActiveForSellerTeam(Team $team): array
    {
        return $this->createQueryBuilder('listing')
            ->innerJoin('listing.player', 'player')
            ->leftJoin('player.team', 'team')
            ->leftJoin('player.agent', 'agent')
            ->addSelect('player', 'team', 'agent')
            ->andWhere('listing.sellerTeam = :team')
            ->andWhere('listing.status = :status')
            ->setParameter('team', $team)
            ->setParameter('status', ListingStatusEnum::ACTIVE)
            ->orderBy('listing.createdAt', 'DESC')
            ->addOrderBy('player.lastName', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findOneForPlayer(Player $player): ?Listing
    {
        return $this->createQueryBuilder('listing')
            ->innerJoin('listing.player', 'player')
            ->leftJoin('player.team', 'team')
            ->leftJoin('player.agent', 'agent')
            ->addSelect('player', 'team', 'agent')
            ->andWhere('listing.player = :player')
            ->setParameter('player', $player)
            ->getQuery()
            ->getOneOrNullResult();
    }
}