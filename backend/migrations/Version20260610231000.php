<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260610231000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Removes the temporary default used to backfill contract negotiation types';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE contract_negociation ALTER type DROP DEFAULT');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE contract_negociation ALTER type SET DEFAULT \'transfer\'');
    }
}
