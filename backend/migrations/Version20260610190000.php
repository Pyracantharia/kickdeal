<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260610190000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Adds agent club prospecting and contact tracking';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE agent_club_prospect (id UUID NOT NULL, agent_id UUID NOT NULL, player_id UUID NOT NULL, team_id UUID NOT NULL, status VARCHAR(30) NOT NULL, message TEXT NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_C6B571633414710B ON agent_club_prospect (agent_id)');
        $this->addSql('CREATE INDEX IDX_C6B5716399E6F5DF ON agent_club_prospect (player_id)');
        $this->addSql('CREATE INDEX IDX_C6B57163296CD8AE ON agent_club_prospect (team_id)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_AGENT_PLAYER_TEAM_PROSPECT ON agent_club_prospect (agent_id, player_id, team_id)');
        $this->addSql('COMMENT ON COLUMN agent_club_prospect.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN agent_club_prospect.agent_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN agent_club_prospect.player_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN agent_club_prospect.team_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE agent_club_prospect ADD CONSTRAINT FK_C6B571633414710B FOREIGN KEY (agent_id) REFERENCES agent (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE agent_club_prospect ADD CONSTRAINT FK_C6B5716399E6F5DF FOREIGN KEY (player_id) REFERENCES player (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE agent_club_prospect ADD CONSTRAINT FK_C6B57163296CD8AE FOREIGN KEY (team_id) REFERENCES team (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE agent_club_prospect');
    }
}
