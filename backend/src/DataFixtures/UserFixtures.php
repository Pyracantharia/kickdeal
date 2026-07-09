<?php

namespace App\DataFixtures;

use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class UserFixtures extends Fixture
{
    public const USERS = [
        [
            'firstName' => 'John',
            'lastName' => 'Doe',
            'email' => 'john@example.com',
            'password' => 'Password123!',
            'roles' => ['ROLE_USER'],
        ],
        [
            'firstName' => 'Jane',
            'lastName' => 'Smith',
            'email' => 'jane@example.com',
            'password' => 'Password123!',
            'roles' => ['ROLE_USER'],
        ],
        [
            'firstName' => 'Admin',
            'lastName' => 'User',
            'email' => 'admin@example.com',
            'password' => 'Password123!',
            'roles' => ['ROLE_ADMIN'],
        ],
    ];

    public function __construct(
        private readonly UserPasswordHasherInterface $passwordHasher
    ) {
    }

    public function load(ObjectManager $manager): void
    {
        foreach (self::USERS as $userData) {
            $user = new User();
            $user
                ->setFirstName($userData['firstName'])
                ->setLastName($userData['lastName'])
                ->setEmail($userData['email'])
                ->setPassword($this->passwordHasher->hashPassword($user, $userData['password']))
                ->setRoles($userData['roles']);

            $manager->persist($user);
            $this->addReference('user_'.$userData['email'], $user);
        }

        $manager->flush();
    }
}
