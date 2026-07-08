<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260708162000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add seller club invitations for transfer negotiations with unrepresented clubs.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE transfer_club_invitation (id UUID NOT NULL, transfer_negociation_id UUID NOT NULL, seller_team_id UUID NOT NULL, buyer_team_id UUID NOT NULL, invited_by_id UUID NOT NULL, accepted_by_id UUID DEFAULT NULL, email VARCHAR(180) NOT NULL, token VARCHAR(80) NOT NULL, accepted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_TRANSFER_CLUB_INVITATION_TOKEN ON transfer_club_invitation (token)');
        $this->addSql('CREATE INDEX IDX_4E6F9E72CC635179 ON transfer_club_invitation (transfer_negociation_id)');
        $this->addSql('CREATE INDEX IDX_4E6F9E7289920E704 ON transfer_club_invitation (seller_team_id)');
        $this->addSql('CREATE INDEX IDX_4E6F9E72C99B6F33 ON transfer_club_invitation (buyer_team_id)');
        $this->addSql('CREATE INDEX IDX_4E6F9E72D5E0F81 ON transfer_club_invitation (invited_by_id)');
        $this->addSql('CREATE INDEX IDX_4E6F9E72A7C853C6 ON transfer_club_invitation (accepted_by_id)');
        $this->addSql('COMMENT ON COLUMN transfer_club_invitation.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN transfer_club_invitation.transfer_negociation_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN transfer_club_invitation.seller_team_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN transfer_club_invitation.buyer_team_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN transfer_club_invitation.invited_by_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN transfer_club_invitation.accepted_by_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE transfer_club_invitation ADD CONSTRAINT FK_4E6F9E72CC635179 FOREIGN KEY (transfer_negociation_id) REFERENCES transfer_negociation (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE transfer_club_invitation ADD CONSTRAINT FK_4E6F9E7289920E704 FOREIGN KEY (seller_team_id) REFERENCES team (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE transfer_club_invitation ADD CONSTRAINT FK_4E6F9E72C99B6F33 FOREIGN KEY (buyer_team_id) REFERENCES team (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE transfer_club_invitation ADD CONSTRAINT FK_4E6F9E72D5E0F81 FOREIGN KEY (invited_by_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE transfer_club_invitation ADD CONSTRAINT FK_4E6F9E72A7C853C6 FOREIGN KEY (accepted_by_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE transfer_negociation ADD seller_club_external_contacted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('ALTER TABLE transfer_negociation ALTER status TYPE VARCHAR(40)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE transfer_club_invitation DROP CONSTRAINT FK_4E6F9E72CC635179');
        $this->addSql('ALTER TABLE transfer_club_invitation DROP CONSTRAINT FK_4E6F9E7289920E704');
        $this->addSql('ALTER TABLE transfer_club_invitation DROP CONSTRAINT FK_4E6F9E72C99B6F33');
        $this->addSql('ALTER TABLE transfer_club_invitation DROP CONSTRAINT FK_4E6F9E72D5E0F81');
        $this->addSql('ALTER TABLE transfer_club_invitation DROP CONSTRAINT FK_4E6F9E72A7C853C6');
        $this->addSql('DROP TABLE transfer_club_invitation');
        $this->addSql('ALTER TABLE transfer_negociation DROP seller_club_external_contacted_at');
        $this->addSql('ALTER TABLE transfer_negociation ALTER status TYPE VARCHAR(20)');
    }
}
