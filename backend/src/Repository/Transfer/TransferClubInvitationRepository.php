<?php

namespace App\Repository\Transfer;

use App\Entity\Transfer\TransferClubInvitation;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<TransferClubInvitation>
 */
class TransferClubInvitationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TransferClubInvitation::class);
    }

    public function findActiveByToken(string $token): ?TransferClubInvitation
    {
        return $this->createQueryBuilder('invitation')
            ->addSelect('negociation', 'listing', 'player', 'sellerTeam', 'buyerTeam')
            ->innerJoin('invitation.transferNegociation', 'negociation')
            ->innerJoin('negociation.listing', 'listing')
            ->innerJoin('listing.player', 'player')
            ->innerJoin('invitation.sellerTeam', 'sellerTeam')
            ->innerJoin('invitation.buyerTeam', 'buyerTeam')
            ->andWhere('invitation.token = :token')
            ->andWhere('invitation.acceptedAt IS NULL')
            ->setParameter('token', $token)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
