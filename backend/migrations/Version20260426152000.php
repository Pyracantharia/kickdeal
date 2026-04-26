<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260426152000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add transfer target shortlist per team';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE "transfer_target" (id UUID NOT NULL, team_id UUID NOT NULL, player_id UUID NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_4263D2C8296CD8AE ON "transfer_target" (team_id)');
        $this->addSql('CREATE INDEX IDX_4263D2C899E6F5DF ON "transfer_target" (player_id)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_4263D2C8296CD8AE99E6F5DF ON "transfer_target" (team_id, player_id)');
        $this->addSql('COMMENT ON COLUMN "transfer_target".id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "transfer_target".team_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "transfer_target".player_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE "transfer_target" ADD CONSTRAINT FK_4263D2C8296CD8AE FOREIGN KEY (team_id) REFERENCES "team" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "transfer_target" ADD CONSTRAINT FK_4263D2C899E6F5DF FOREIGN KEY (player_id) REFERENCES "player" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "transfer_target" DROP CONSTRAINT FK_4263D2C8296CD8AE');
        $this->addSql('ALTER TABLE "transfer_target" DROP CONSTRAINT FK_4263D2C899E6F5DF');
        $this->addSql('DROP TABLE "transfer_target"');
    }
}