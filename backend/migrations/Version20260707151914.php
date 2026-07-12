<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260707151914 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add external contract duration on transfer negotiations.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE transfer_negociation ADD external_contract_duration_months INT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE transfer_negociation DROP external_contract_duration_months');
    }
}
