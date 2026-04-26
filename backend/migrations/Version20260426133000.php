<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260426133000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add transfer budget to teams';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "team" ADD transfer_budget BIGINT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "team" DROP transfer_budget');
    }
}
