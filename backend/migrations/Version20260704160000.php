<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260704160000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add agent handover requests for represented players.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE player_agent_request ADD type VARCHAR(30) DEFAULT 'representation' NOT NULL");
        $this->addSql('ALTER TABLE player_agent_request ADD current_agent_id UUID DEFAULT NULL');
        $this->addSql('ALTER TABLE player_agent_request ADD decided_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('CREATE INDEX IDX_3C249181A96C0B21 ON player_agent_request (current_agent_id)');
        $this->addSql('ALTER TABLE player_agent_request ADD CONSTRAINT FK_PLAYER_AGENT_REQUEST_CURRENT_AGENT FOREIGN KEY (current_agent_id) REFERENCES agent (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('COMMENT ON COLUMN player_agent_request.current_agent_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN player_agent_request.decided_at IS \'(DC2Type:datetime_immutable)\'');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE player_agent_request DROP CONSTRAINT FK_PLAYER_AGENT_REQUEST_CURRENT_AGENT');
        $this->addSql('DROP INDEX IDX_3C249181A96C0B21');
        $this->addSql('ALTER TABLE player_agent_request DROP type');
        $this->addSql('ALTER TABLE player_agent_request DROP current_agent_id');
        $this->addSql('ALTER TABLE player_agent_request DROP decided_at');
    }
}
