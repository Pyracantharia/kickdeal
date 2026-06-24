<?php

namespace App\Repository;

use App\Entity\DirectConversation;
use App\Entity\DirectMessage;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<DirectMessage>
 */
class DirectMessageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, DirectMessage::class);
    }

    /**
     * @return DirectMessage[]
     */
    public function findForConversation(DirectConversation $conversation): array
    {
        return $this->createQueryBuilder('message')
            ->andWhere('message.conversation = :conversation')
            ->setParameter('conversation', $conversation)
            ->orderBy('message.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
