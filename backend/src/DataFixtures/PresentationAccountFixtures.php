<?php

namespace App\DataFixtures;

use App\Entity\Agent;
use App\Entity\Club;
use App\Entity\Team;
use App\Entity\TeamMembership;
use App\Entity\User;
use App\Enum\MembershipRoleEnum;
use App\Enum\SubscriptionPlanEnum;
use App\Enum\TeamVerificationStatusEnum;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Bundle\FixturesBundle\FixtureGroupInterface;
use Doctrine\Common\DataFixtures\OrderedFixtureInterface;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class PresentationAccountFixtures extends Fixture implements FixtureGroupInterface, OrderedFixtureInterface
{
    private const int PRESENTATION_BUDGET = 75_000_000_000;

    public function __construct(private readonly UserPasswordHasherInterface $passwordHasher)
    {
    }

    public static function getGroups(): array
    {
        return ['presentation'];
    }

    public function getOrder(): int
    {
        return 30;
    }

    public function load(ObjectManager $manager): void
    {
        $teams = $this->ensureTeams($manager);

        foreach (PresentationFixtureData::representedTeamKeys() as $teamKey) {
            $team = $teams[$teamKey];
            $email = PresentationFixtureData::clubEmail($teamKey);
            $user = $manager->getRepository(User::class)->findOneBy(['email' => $email]);

            if (!$user instanceof User) {
                $user = $this->createUser(
                    firstName: 'Direction',
                    lastName: (string) $team->getName(),
                    email: $email,
                    role: User::ROLE_CLUB,
                    plan: SubscriptionPlanEnum::CLUB_PRO,
                );
                $manager->persist($user);
            }

            $membership = $manager->getRepository(TeamMembership::class)->findOneBy([
                'user' => $user,
                'team' => $team,
            ]);
            if ($membership instanceof TeamMembership) {
                continue;
            }

            $membership = (new TeamMembership())
                ->setUser($user)
                ->setTeam($team)
                ->setRole(MembershipRoleEnum::CLUB_MANAGER)
                ->setPrimary(true)
                ->setCreatedAt(new \DateTimeImmutable('2026-06-01 09:00:00'))
                ->setUpdatedAt(new \DateTimeImmutable('2026-06-01 09:00:00'));
            $user->addTeamMembership($membership);
            $team->addTeamMembership($membership);
            $team->setTransferBudget(max($team->getTransferBudget() ?? 0, self::PRESENTATION_BUDGET));
            $manager->persist($membership);
        }

        foreach (PresentationFixtureData::agents() as $agentData) {
            $user = $manager->getRepository(User::class)->findOneBy(['email' => $agentData['email']]);
            if (!$user instanceof User) {
                $user = $this->createUser(
                    firstName: $agentData['firstName'],
                    lastName: $agentData['lastName'],
                    email: $agentData['email'],
                    role: User::ROLE_AGENT,
                    plan: SubscriptionPlanEnum::AGENT_PRO,
                );
                $manager->persist($user);
            }

            if ($user->getAgentProfile() instanceof Agent) {
                continue;
            }

            $agent = (new Agent())
                ->setUser($user)
                ->setAgencyName($agentData['agency'])
                ->setCountry($agentData['country'])
                ->setCreatedAt(new \DateTimeImmutable('2026-06-01 09:00:00'))
                ->setUpdatedAt(new \DateTimeImmutable('2026-06-01 09:00:00'));
            $user->setAgentProfile($agent);
            $manager->persist($agent);
        }

        $manager->flush();
    }

    /**
     * @return array<string, Team>
     */
    private function ensureTeams(ObjectManager $manager): array
    {
        $teams = [];
        foreach (PresentationFixtureData::teams() as $key => $data) {
            $team = $manager->getRepository(Team::class)->findOneBy(['name' => $data['name']]);
            if (!$team instanceof Team) {
                $club = (new Club())
                    ->setCreatedAt(new \DateTimeImmutable('2026-06-01 09:00:00'))
                    ->setUpdatedAt(new \DateTimeImmutable('2026-06-01 09:00:00'));
                $team = (new Team())
                    ->setName($data['name'])
                    ->setCountry($data['country'])
                    ->setLeague($data['league'])
                    ->setTransferBudget(self::PRESENTATION_BUDGET)
                    ->setVerificationStatus(TeamVerificationStatusEnum::VERIFIED)
                    ->setClub($club)
                    ->setCreatedAt(new \DateTimeImmutable('2026-06-01 09:00:00'))
                    ->setUpdatedAt(new \DateTimeImmutable('2026-06-01 09:00:00'));
                $club->setTeam($team);
                $manager->persist($club);
                $manager->persist($team);
            }

            $teams[$key] = $team;
        }

        $manager->flush();

        return $teams;
    }

    private function createUser(
        string $firstName,
        string $lastName,
        string $email,
        string $role,
        SubscriptionPlanEnum $plan,
    ): User {
        $user = (new User())
            ->setFirstName($firstName)
            ->setLastName($lastName)
            ->setEmail($email)
            ->setRoles([$role])
            ->setSubscriptionPlan($plan)
            ->setPasswordChangedAt(new \DateTimeImmutable())
            ->setCreatedAt(new \DateTimeImmutable('2026-06-01 09:00:00'))
            ->setUpdatedAt(new \DateTimeImmutable('2026-06-01 09:00:00'));
        $user->setPassword($this->passwordHasher->hashPassword($user, PresentationFixtureData::PASSWORD));

        return $user;
    }
}
