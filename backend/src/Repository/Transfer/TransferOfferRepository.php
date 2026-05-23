<?php

namespace App\Repository\Transfer;

use App\Entity\Team;
use App\Entity\Transfer\TransferOffer;
use App\Enum\OfferStatusEnum;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<TransferOffer>
 */
class TransferOfferRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TransferOffer::class);
    }

    public function countForTeam(Team $team): int
    {
        $queryBuilder = $this->createQueryBuilder('transferOffer')
            ->select('COUNT(transferOffer.id)')
            ->innerJoin('transferOffer.transferNegociation', 'negociation')
            ->innerJoin('negociation.listing', 'listing');

        $queryBuilder
            ->andWhere($queryBuilder->expr()->orX(
                'negociation.buyerTeam = :team',
                'listing.sellerTeam = :team',
            ))
            ->setParameter('team', $team);

        return (int) $queryBuilder->getQuery()->getSingleScalarResult();
    }

    public function countSentByTeam(Team $team): int
    {
        return (int) $this->createQueryBuilder('transferOffer')
            ->select('COUNT(transferOffer.id)')
            ->innerJoin('transferOffer.author', 'author')
            ->innerJoin('author.teamMemberships', 'authorMembership')
            ->andWhere('authorMembership.team = :team')
            ->setParameter('team', $team)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * @return TransferOffer[]
     */
    public function findSentByTeam(Team $team): array
    {
        return $this->createQueryBuilder('transferOffer')
            ->innerJoin('transferOffer.author', 'author')
            ->innerJoin('author.teamMemberships', 'authorMembership')
            ->innerJoin('transferOffer.transferNegociation', 'negociation')
            ->innerJoin('negociation.listing', 'listing')
            ->innerJoin('listing.player', 'player')
            ->leftJoin('player.team', 'playerTeam')
            ->leftJoin('transferOffer.exchangePlayer', 'exchangePlayer')
            ->addSelect('negociation', 'listing', 'player', 'playerTeam', 'exchangePlayer')
            ->andWhere('authorMembership.team = :team')
            ->setParameter('team', $team)
            ->orderBy('transferOffer.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * @return TransferOffer[]
     */
    public function findReceivedByTeam(Team $team): array
    {
        return $this->createQueryBuilder('transferOffer')
            ->innerJoin('transferOffer.author', 'author')
            ->leftJoin('author.teamMemberships', 'authorMembership', 'WITH', 'authorMembership.team = :team')
            ->innerJoin('transferOffer.transferNegociation', 'negociation')
            ->innerJoin('negociation.listing', 'listing')
            ->innerJoin('listing.player', 'player')
            ->leftJoin('player.team', 'playerTeam')
            ->leftJoin('transferOffer.exchangePlayer', 'exchangePlayer')
            ->addSelect('negociation', 'listing', 'player', 'playerTeam', 'exchangePlayer')
            ->andWhere('(listing.sellerTeam = :team OR negociation.buyerTeam = :team)')
            ->andWhere('authorMembership.id IS NULL')
            ->setParameter('team', $team)
            ->orderBy('transferOffer.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * @return TransferOffer[]
     */
    public function findAcceptedForTeam(Team $team): array
    {
        $queryBuilder = $this->createQueryBuilder('transferOffer')
            ->innerJoin('transferOffer.transferNegociation', 'negociation')
            ->innerJoin('negociation.listing', 'listing')
            ->innerJoin('listing.player', 'player')
            ->leftJoin('listing.sellerTeam', 'sellerTeam')
            ->leftJoin('negociation.buyerTeam', 'buyerTeam')
            ->leftJoin('player.team', 'playerTeam')
            ->leftJoin('transferOffer.exchangePlayer', 'exchangePlayer')
            ->addSelect('negociation', 'listing', 'player', 'sellerTeam', 'buyerTeam', 'playerTeam', 'exchangePlayer')
            ->andWhere('transferOffer.status = :acceptedStatus')
            ->andWhere('(listing.sellerTeam = :team OR negociation.buyerTeam = :team)')
            ->setParameter('acceptedStatus', OfferStatusEnum::ACCEPTED)
            ->setParameter('team', $team)
            ->orderBy('transferOffer.createdAt', 'DESC');

        return $queryBuilder->getQuery()->getResult();
    }
}
