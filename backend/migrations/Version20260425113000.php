<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260425113000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Passe les montants du joueur en BIGINT pour supporter les valeurs en centimes.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "player" ALTER market_value TYPE BIGINT');
        $this->addSql('ALTER TABLE "player" ALTER weekly_salary TYPE BIGINT');
        $this->addSql('ALTER TABLE "player" ALTER release_clause TYPE BIGINT');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "player" ALTER market_value TYPE INT');
        $this->addSql('ALTER TABLE "player" ALTER weekly_salary TYPE INT');
        $this->addSql('ALTER TABLE "player" ALTER release_clause TYPE INT');
    }
}