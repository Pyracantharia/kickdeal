<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260610210000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Allows high-value annual salaries and signing bonuses in contract offers';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE contract_offer ALTER annual_salary TYPE BIGINT');
        $this->addSql('ALTER TABLE contract_offer ALTER signing_bonus TYPE BIGINT');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE contract_offer ALTER annual_salary TYPE INT');
        $this->addSql('ALTER TABLE contract_offer ALTER signing_bonus TYPE INT');
    }
}
