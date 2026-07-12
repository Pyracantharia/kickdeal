<?php

namespace App\Command;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(
    name: 'app:create-admin',
    description: 'Create or update the admin user from environment variables',
)]
class CreateAdminCommand extends Command
{
    public function __construct(
        private UserRepository $userRepository,
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher
    )
    {
        parent::__construct();
    }

    protected function configure(): void
    {
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $adminEmail = trim((string) ($_ENV['ADMIN_EMAIL'] ?? ''));
        $adminPassword = (string) ($_ENV['ADMIN_PASSWORD'] ?? '');

        if ('' === $adminEmail || '' === $adminPassword) {
            $io->error('ADMIN_EMAIL and ADMIN_PASSWORD must be configured.');

            return Command::FAILURE;
        }

        $admin = $this->userRepository->findAdminUser() ?? new User();
        $isNewAdmin = null === $admin->getId();

        if ($isNewAdmin) {
            $admin->setFirstName('Admin');
            $admin->setLastName('Admin');
            $this->entityManager->persist($admin);
        }

        $admin->setEmail($adminEmail);
        $admin->setRoles(['ROLE_ADMIN']);
        $admin->setPassword($this->passwordHasher->hashPassword($admin, $adminPassword));
        $admin->markPasswordChanged();

        $this->entityManager->flush();

        $io->success($isNewAdmin ? 'Admin user created successfully.' : 'Admin user updated successfully.');

        return Command::SUCCESS;
    }
}
