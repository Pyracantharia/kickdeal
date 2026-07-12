<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260425114000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute photo_url sur player pour afficher les photos reelles dans le frontend.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "player" ADD photo_url VARCHAR(255) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "player" DROP photo_url');
    }
}