<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260610230000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Extends contract negotiations to renewals and mutual terminations';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE contract_negociation ADD type VARCHAR(20) NOT NULL DEFAULT \'transfer\'');
        $this->addSql('ALTER TABLE contract_negociation ALTER transfer_negociation_id DROP NOT NULL');
        $this->addSql('ALTER TABLE contract_offer ALTER annual_salary DROP NOT NULL');
        $this->addSql('ALTER TABLE contract_offer ALTER duration_months DROP NOT NULL');
        $this->addSql('ALTER TABLE contract_offer ADD release_clause BIGINT DEFAULT NULL');
        $this->addSql('ALTER TABLE contract_offer ADD termination_compensation BIGINT DEFAULT NULL');
        $this->addSql('ALTER TABLE contract_offer ADD effective_date DATE DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DELETE FROM contract_offer WHERE contract_negociation_id IN (SELECT id FROM contract_negociation WHERE type <> \'transfer\')');
        $this->addSql('DELETE FROM contract_negociation WHERE type <> \'transfer\'');
        $this->addSql('ALTER TABLE contract_offer DROP release_clause');
        $this->addSql('ALTER TABLE contract_offer DROP termination_compensation');
        $this->addSql('ALTER TABLE contract_offer DROP effective_date');
        $this->addSql('ALTER TABLE contract_offer ALTER annual_salary SET NOT NULL');
        $this->addSql('ALTER TABLE contract_offer ALTER duration_months SET NOT NULL');
        $this->addSql('ALTER TABLE contract_negociation ALTER transfer_negociation_id SET NOT NULL');
        $this->addSql('ALTER TABLE contract_negociation DROP type');
    }
}
