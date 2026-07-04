<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260704143000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Store the weekly salary agreed outside KickDeal before finalizing an external transfer.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE transfer_negociation ADD external_contract_weekly_salary BIGINT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE transfer_negociation DROP external_contract_weekly_salary');
    }
}
