<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260610170000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Adds player representation requests for agents';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE player_agent_request (id UUID NOT NULL, agent_id UUID NOT NULL, player_id UUID NOT NULL, status VARCHAR(255) NOT NULL, verification_document_path VARCHAR(255) NOT NULL, verification_document_original_name VARCHAR(255) NOT NULL, message TEXT DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_3C2491813414710B ON player_agent_request (agent_id)');
        $this->addSql('CREATE INDEX IDX_3C24918199E6F5DF ON player_agent_request (player_id)');
        $this->addSql('COMMENT ON COLUMN player_agent_request.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN player_agent_request.agent_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN player_agent_request.player_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN player_agent_request.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN player_agent_request.updated_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('ALTER TABLE player_agent_request ADD CONSTRAINT FK_3C2491813414710B FOREIGN KEY (agent_id) REFERENCES agent (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE player_agent_request ADD CONSTRAINT FK_3C24918199E6F5DF FOREIGN KEY (player_id) REFERENCES player (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE player_agent_request');
    }
}
