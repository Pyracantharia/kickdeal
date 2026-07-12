<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260621113000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Adds agent market authorization and listing source fields on players';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE player ADD market_authorization_status VARCHAR(20) DEFAULT NULL');
        $this->addSql('ALTER TABLE player ADD market_authorization_requested_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('ALTER TABLE player ADD market_authorization_decided_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('ALTER TABLE player ADD market_listing_source VARCHAR(20) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE player DROP market_authorization_status');
        $this->addSql('ALTER TABLE player DROP market_authorization_requested_at');
        $this->addSql('ALTER TABLE player DROP market_authorization_decided_at');
        $this->addSql('ALTER TABLE player DROP market_listing_source');
    }
}
