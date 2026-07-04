<?php

namespace App\Repository\Transfer;

use App\Entity\Transfer\TransferAgentInvitation;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<TransferAgentInvitation>
 */
class TransferAgentInvitationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TransferAgentInvitation::class);
    }

    public function findActiveByToken(string $token): ?TransferAgentInvitation
    {
        return $this->createQueryBuilder('invitation')
            ->addSelect('negociation', 'listing', 'player', 'buyerTeam', 'sellerTeam')
            ->innerJoin('invitation.transferNegociation', 'negociation')
            ->innerJoin('negociation.listing', 'listing')
            ->innerJoin('listing.player', 'player')
            ->innerJoin('negociation.buyerTeam', 'buyerTeam')
            ->leftJoin('listing.sellerTeam', 'sellerTeam')
            ->andWhere('invitation.token = :token')
            ->setParameter('token', $token)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
