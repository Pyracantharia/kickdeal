<?php

namespace App\Repository;

use App\Entity\Team;
use App\Entity\TeamMembership;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<TeamMembership>
 */
class TeamMembershipRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TeamMembership::class);
    }

    public function findPrimaryForUser(User $user): ?TeamMembership
    {
        return $this->createQueryBuilder('membership')
            ->andWhere('membership.user = :user')
            ->setParameter('user', $user)
            ->orderBy('membership.primary', 'DESC')
            ->addOrderBy('membership.createdAt', 'ASC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function countByTeam(Team $team): int
    {
        return (int) $this->createQueryBuilder('membership')
            ->select('COUNT(membership.id)')
            ->andWhere('membership.team = :team')
            ->setParameter('team', $team)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * @return TeamMembership[]
     */
    public function findByTeamOrdered(Team $team): array
    {
        return $this->createQueryBuilder('membership')
            ->andWhere('membership.team = :team')
            ->setParameter('team', $team)
            ->orderBy('membership.primary', 'DESC')
            ->addOrderBy('membership.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * @return string[]
     */
    public function findUserIdsByTeam(Team $team): array
    {
        $rows = $this->createQueryBuilder('membership')
            ->select('IDENTITY(membership.user) AS userId')
            ->andWhere('membership.team = :team')
            ->setParameter('team', $team)
            ->getQuery()
            ->getArrayResult();

        return array_values(array_filter(array_map(
            static fn (array $row): ?string => isset($row['userId']) ? (string) $row['userId'] : null,
            $rows,
        )));
    }
}
