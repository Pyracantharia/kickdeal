<?php

namespace App\DataFixtures;

use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\OrderedFixtureInterface;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class UserFixtures extends Fixture implements OrderedFixtureInterface
{
    public function __construct(
        private readonly UserPasswordHasherInterface $passwordHasher
    ) {
    }

    public function getOrder(): int
    {
        return 20;
    }

    public function load(ObjectManager $manager): void
    {
        $users = [
            [
                'firstName' => 'John',
                'lastName' => 'Doe',
                'email' => 'john@example.com',
                'password' => 'Password123!',
                'roles' => ['ROLE_USER'],
                'passwordChangedAt' => (new \DateTimeImmutable())->modify('-30 days'),
            ],
            [
                'firstName' => 'Jane',
                'lastName' => 'Smith',
                'email' => 'jane@example.com',
                'password' => 'Password123!',
                'roles' => ['ROLE_USER'],
                'passwordChangedAt' => (new \DateTimeImmutable())->modify('-1 year'),
            ],
            [
                'firstName' => 'Admin',
                'lastName' => 'User',
                'email' => 'admin@example.com',
                'password' => 'Password123!',
                'roles' => ['ROLE_ADMIN'],
                'passwordChangedAt' => (new \DateTimeImmutable())->modify('-1 day'),
            ],
        ];

        foreach ($users as $userData) {
            $user = new User();
            $user
                ->setFirstName($userData['firstName'])
                ->setLastName($userData['lastName'])
                ->setEmail($userData['email'])
                ->setPassword($this->passwordHasher->hashPassword($user, $userData['password']))
                ->setRoles($userData['roles'])
                ->setPasswordChangedAt($userData['passwordChangedAt']);

            $manager->persist($user);
            $this->addReference('user_'.$userData['email'], $user);
        }

        $manager->flush();
    }
}
