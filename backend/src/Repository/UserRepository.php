<?php

namespace App\Repository;

use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<User>
 */
class UserRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    /**
     * @return User[]  Returns an array of User objects that are either agents ar clubs, excluding the user with the given ID and the admin users
     */
    public function findAgentsAndClubsExceptMe(Uuid $selfUserId): array
    {
        return $this->createQueryBuilder('u')
        ->andWhere('u.id != :selfUserId')
        ->setParameter('selfUserId', $selfUserId)
        ->andWhere('CONCAT(u.roles, \'\') LIKE :agentRole OR CONCAT(u.roles, \'\') LIKE :clubRole')
        ->setParameter('agentRole', '%"ROLE_AGENT"%') // Précisez le rôle complet avec les guillemets
        ->setParameter('clubRole', '%"ROLE_CLUB"%')
        ->getQuery()
        ->getResult();
    }

    //    /**
    //     * @return User[] Returns an array of User objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('u')
    //            ->andWhere('u.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('u.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?User
    //    {
    //        return $this->createQueryBuilder('u')
    //            ->andWhere('u.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
}
