<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260704120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add transfer agent invitations and external contract agreement confirmations.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE transfer_negociation ADD external_contract_buyer_confirmed_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('ALTER TABLE transfer_negociation ADD external_contract_seller_confirmed_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('COMMENT ON COLUMN transfer_negociation.external_contract_buyer_confirmed_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN transfer_negociation.external_contract_seller_confirmed_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE transfer_agent_invitation (id UUID NOT NULL, transfer_negociation_id UUID NOT NULL, invited_by_id UUID NOT NULL, accepted_by_id UUID DEFAULT NULL, email VARCHAR(180) NOT NULL, token VARCHAR(80) NOT NULL, accepted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_TRANSFER_AGENT_INVITATION_TOKEN ON transfer_agent_invitation (token)');
        $this->addSql('CREATE INDEX IDX_AB387A3D3F018736 ON transfer_agent_invitation (transfer_negociation_id)');
        $this->addSql('CREATE INDEX IDX_AB387A3DA7B4A7E3 ON transfer_agent_invitation (invited_by_id)');
        $this->addSql('CREATE INDEX IDX_AB387A3D20F699D9 ON transfer_agent_invitation (accepted_by_id)');
        $this->addSql('COMMENT ON COLUMN transfer_agent_invitation.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN transfer_agent_invitation.transfer_negociation_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN transfer_agent_invitation.invited_by_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN transfer_agent_invitation.accepted_by_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN transfer_agent_invitation.accepted_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('ALTER TABLE transfer_agent_invitation ADD CONSTRAINT FK_506BB1B2B96F5643 FOREIGN KEY (transfer_negociation_id) REFERENCES transfer_negociation (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE transfer_agent_invitation ADD CONSTRAINT FK_506BB1B25C011B5 FOREIGN KEY (invited_by_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE transfer_agent_invitation ADD CONSTRAINT FK_506BB1B218980429 FOREIGN KEY (accepted_by_id) REFERENCES agent (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE transfer_agent_invitation DROP CONSTRAINT FK_506BB1B2B96F5643');
        $this->addSql('ALTER TABLE transfer_agent_invitation DROP CONSTRAINT FK_506BB1B25C011B5');
        $this->addSql('ALTER TABLE transfer_agent_invitation DROP CONSTRAINT FK_506BB1B218980429');
        $this->addSql('DROP TABLE transfer_agent_invitation');
        $this->addSql('ALTER TABLE transfer_negociation DROP external_contract_buyer_confirmed_at');
        $this->addSql('ALTER TABLE transfer_negociation DROP external_contract_seller_confirmed_at');
    }
}
