<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260425110000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute les champs manquants sur player pour alimenter le frontend joueurs avec des donnees BDD.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "player" ADD nationality VARCHAR(120) DEFAULT NULL');
        $this->addSql('ALTER TABLE "player" ADD height_cm INT DEFAULT NULL');
        $this->addSql('ALTER TABLE "player" ADD weight_kg INT DEFAULT NULL');
        $this->addSql('ALTER TABLE "player" ADD preferred_foot VARCHAR(20) DEFAULT NULL');
        $this->addSql('ALTER TABLE "player" ALTER market_value TYPE BIGINT');
        $this->addSql('ALTER TABLE "player" ADD weekly_salary BIGINT DEFAULT NULL');
        $this->addSql('ALTER TABLE "player" ADD release_clause BIGINT DEFAULT NULL');
        $this->addSql('ALTER TABLE "player" ADD joined_at DATE DEFAULT NULL');
        $this->addSql('ALTER TABLE "player" ADD availability_status VARCHAR(20) NOT NULL DEFAULT \'normal\'');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "player" ALTER market_value TYPE INT');
        $this->addSql('ALTER TABLE "player" DROP nationality');
        $this->addSql('ALTER TABLE "player" DROP height_cm');
        $this->addSql('ALTER TABLE "player" DROP weight_kg');
        $this->addSql('ALTER TABLE "player" DROP preferred_foot');
        $this->addSql('ALTER TABLE "player" DROP weekly_salary');
        $this->addSql('ALTER TABLE "player" DROP release_clause');
        $this->addSql('ALTER TABLE "player" DROP joined_at');
        $this->addSql('ALTER TABLE "player" DROP availability_status');
    }
}