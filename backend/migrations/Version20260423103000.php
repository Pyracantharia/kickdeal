<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260423103000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute la table club_request pour connecter le flow de création de club frontend.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE "club_request" (id UUID NOT NULL, requester_id UUID NOT NULL, team_id UUID NOT NULL, status VARCHAR(20) NOT NULL, verification_email VARCHAR(320) DEFAULT NULL, verification_message TEXT DEFAULT NULL, verification_document_path VARCHAR(255) DEFAULT NULL, verification_document_original_name VARCHAR(255) DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_28211E8388E7E5B2 ON "club_request" (requester_id)');
        $this->addSql('CREATE INDEX IDX_28211E83296CD8AE ON "club_request" (team_id)');
        $this->addSql('COMMENT ON COLUMN "club_request".id IS \''.'(DC2Type:uuid)'.'\'');
        $this->addSql('COMMENT ON COLUMN "club_request".requester_id IS \''.'(DC2Type:uuid)'.'\'');
        $this->addSql('COMMENT ON COLUMN "club_request".team_id IS \''.'(DC2Type:uuid)'.'\'');
        $this->addSql('ALTER TABLE "club_request" ADD CONSTRAINT FK_28211E8388E7E5B2 FOREIGN KEY (requester_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "club_request" ADD CONSTRAINT FK_28211E83296CD8AE FOREIGN KEY (team_id) REFERENCES "team" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "club_request" DROP CONSTRAINT FK_28211E8388E7E5B2');
        $this->addSql('ALTER TABLE "club_request" DROP CONSTRAINT FK_28211E83296CD8AE');
        $this->addSql('DROP TABLE "club_request"');
    }
}
