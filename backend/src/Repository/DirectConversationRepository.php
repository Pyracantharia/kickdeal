<?php

namespace App\Repository;

use App\Entity\DirectConversation;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<DirectConversation>
 */
class DirectConversationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, DirectConversation::class);
    }

    /**
     * @return DirectConversation[]
     */
    public function findForUser(User $user): array
    {
        return $this->createQueryBuilder('conversation')
            ->leftJoin('conversation.messages', 'message')
            ->addSelect('message')
            ->andWhere('conversation.participantOne = :user OR conversation.participantTwo = :user')
            ->setParameter('user', $user)
            ->orderBy('conversation.updatedAt', 'DESC')
            ->addOrderBy('message.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findBetweenUsers(User $firstUser, User $secondUser): ?DirectConversation
    {
        [$lowId, $highId] = self::orderedParticipantIds($firstUser, $secondUser);

        return $this->findOneBy([
            'participantLowId' => $lowId,
            'participantHighId' => $highId,
        ]);
    }

    /**
     * @return array{0: string, 1: string}
     */
    public static function orderedParticipantIds(User $firstUser, User $secondUser): array
    {
        $ids = [(string) $firstUser->getId(), (string) $secondUser->getId()];
        sort($ids, SORT_STRING);

        return $ids;
    }
}
