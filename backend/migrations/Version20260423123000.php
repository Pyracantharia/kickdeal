<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260423123000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Renomme la colonne team_membership.primary en is_primary pour éviter le mot réservé SQL.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "team_membership" RENAME COLUMN "primary" TO is_primary');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "team_membership" RENAME COLUMN is_primary TO "primary"');
    }
}