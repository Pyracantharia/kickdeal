<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260330094325 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SEQUENCE stat_id_seq INCREMENT BY 1 MINVALUE 1 START 1');
        $this->addSql('CREATE TABLE "agent" (id UUID NOT NULL, user_id UUID NOT NULL, agency_name VARCHAR(255) DEFAULT NULL, country VARCHAR(255) DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_268B9C9DA76ED395 ON "agent" (user_id)');
        $this->addSql('COMMENT ON COLUMN "agent".id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "agent".user_id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE "agent_license" (id UUID NOT NULL, agent_id UUID NOT NULL, license_number VARCHAR(255) NOT NULL, issued_by VARCHAR(255) DEFAULT NULL, valid_until TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, document_url VARCHAR(255) DEFAULT NULL, status VARCHAR(20) NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_853B96B33414710B ON "agent_license" (agent_id)');
        $this->addSql('COMMENT ON COLUMN "agent_license".id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "agent_license".agent_id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE "club" (id UUID NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('COMMENT ON COLUMN "club".id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE "club_profile" (id UUID NOT NULL, user_id UUID NOT NULL, job_title VARCHAR(255) NOT NULL, professional_contact VARCHAR(255) DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_8C1F0F8DA76ED395 ON "club_profile" (user_id)');
        $this->addSql('COMMENT ON COLUMN "club_profile".id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "club_profile".user_id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE "contract_message" (id UUID NOT NULL, contract_negociation_id UUID NOT NULL, author_id UUID NOT NULL, type VARCHAR(20) NOT NULL, content TEXT NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_BEEC4DB72A58D2B0 ON "contract_message" (contract_negociation_id)');
        $this->addSql('CREATE INDEX IDX_BEEC4DB7F675F31B ON "contract_message" (author_id)');
        $this->addSql('COMMENT ON COLUMN "contract_message".id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "contract_message".contract_negociation_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "contract_message".author_id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE "contract_negociation" (id UUID NOT NULL, player_id UUID NOT NULL, buyer_team_id UUID NOT NULL, agent_id UUID NOT NULL, transfer_negociation_id UUID NOT NULL, created_by_id UUID NOT NULL, status VARCHAR(20) NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_F74AEE1599E6F5DF ON "contract_negociation" (player_id)');
        $this->addSql('CREATE INDEX IDX_F74AEE1589C071D8 ON "contract_negociation" (buyer_team_id)');
        $this->addSql('CREATE INDEX IDX_F74AEE153414710B ON "contract_negociation" (agent_id)');
        $this->addSql('CREATE INDEX IDX_F74AEE153F018736 ON "contract_negociation" (transfer_negociation_id)');
        $this->addSql('CREATE INDEX IDX_F74AEE15B03A8386 ON "contract_negociation" (created_by_id)');
        $this->addSql('COMMENT ON COLUMN "contract_negociation".id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "contract_negociation".player_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "contract_negociation".buyer_team_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "contract_negociation".agent_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "contract_negociation".transfer_negociation_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "contract_negociation".created_by_id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE "contract_offer" (id UUID NOT NULL, contract_negociation_id UUID NOT NULL, author_id UUID NOT NULL, annual_salary INT NOT NULL, duration_months INT NOT NULL, signing_bonus INT DEFAULT NULL, valid_until DATE DEFAULT NULL, status VARCHAR(20) NOT NULL, notes TEXT DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_6AD71B1A2A58D2B0 ON "contract_offer" (contract_negociation_id)');
        $this->addSql('CREATE INDEX IDX_6AD71B1AF675F31B ON "contract_offer" (author_id)');
        $this->addSql('COMMENT ON COLUMN "contract_offer".id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "contract_offer".contract_negociation_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "contract_offer".author_id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE "contract_package" (id UUID NOT NULL, contract_negociation_id UUID NOT NULL, accepted_offer_id UUID NOT NULL, status VARCHAR(20) NOT NULL, pdf_url VARCHAR(255) DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_D6391A5D2A58D2B0 ON "contract_package" (contract_negociation_id)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_D6391A5D8920E704 ON "contract_package" (accepted_offer_id)');
        $this->addSql('COMMENT ON COLUMN "contract_package".id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "contract_package".contract_negociation_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "contract_package".accepted_offer_id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE "listing" (id UUID NOT NULL, player_id UUID DEFAULT NULL, seller_team_id UUID NOT NULL, created_by_id UUID NOT NULL, asking_price INT DEFAULT NULL, transfer_type VARCHAR(20) NOT NULL, status VARCHAR(20) NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_CB0048D499E6F5DF ON "listing" (player_id)');
        $this->addSql('CREATE INDEX IDX_CB0048D4F26261BF ON "listing" (seller_team_id)');
        $this->addSql('CREATE INDEX IDX_CB0048D4B03A8386 ON "listing" (created_by_id)');
        $this->addSql('COMMENT ON COLUMN "listing".id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "listing".player_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "listing".seller_team_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "listing".created_by_id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE "player" (id UUID NOT NULL, team_id UUID DEFAULT NULL, club_id UUID DEFAULT NULL, temporary_club_id UUID DEFAULT NULL, agent_id UUID DEFAULT NULL, first_name VARCHAR(255) NOT NULL, last_name VARCHAR(255) NOT NULL, birth_date DATE DEFAULT NULL, position VARCHAR(255) NOT NULL, market_value INT DEFAULT NULL, contract_status VARCHAR(20) NOT NULL, contract_end_date DATE DEFAULT NULL, market_status VARCHAR(20) NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_98197A65296CD8AE ON "player" (team_id)');
        $this->addSql('CREATE INDEX IDX_98197A6561190A32 ON "player" (club_id)');
        $this->addSql('CREATE INDEX IDX_98197A65677381CF ON "player" (temporary_club_id)');
        $this->addSql('CREATE INDEX IDX_98197A653414710B ON "player" (agent_id)');
        $this->addSql('COMMENT ON COLUMN "player".id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "player".team_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "player".club_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "player".temporary_club_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "player".agent_id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE stat (id INT NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE TABLE stat_player (stat_id INT NOT NULL, player_id UUID NOT NULL, PRIMARY KEY(stat_id, player_id))');
        $this->addSql('CREATE INDEX IDX_6CA1E8E99502F0B ON stat_player (stat_id)');
        $this->addSql('CREATE INDEX IDX_6CA1E8E999E6F5DF ON stat_player (player_id)');
        $this->addSql('COMMENT ON COLUMN stat_player.player_id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE "team" (id UUID NOT NULL, name VARCHAR(255) NOT NULL, country VARCHAR(100) DEFAULT NULL, league VARCHAR(100) DEFAULT NULL, logo_url VARCHAR(255) DEFAULT NULL, verification_status VARCHAR(20) NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_C4E0A61F5E237E06 ON "team" (name)');
        $this->addSql('COMMENT ON COLUMN "team".id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE "team_membership" (id UUID NOT NULL, user_id UUID NOT NULL, team_id UUID NOT NULL, role VARCHAR(20) NOT NULL, "primary" BOOLEAN DEFAULT false NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_B826A040A76ED395 ON "team_membership" (user_id)');
        $this->addSql('CREATE INDEX IDX_B826A040296CD8AE ON "team_membership" (team_id)');
        $this->addSql('COMMENT ON COLUMN "team_membership".id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "team_membership".user_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "team_membership".team_id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE "transfer_agreement" (id UUID NOT NULL, transfer_negociation_id UUID NOT NULL, accepted_offer_id UUID NOT NULL, pdf_url VARCHAR(255) DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_83E3634F3F018736 ON "transfer_agreement" (transfer_negociation_id)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_83E3634F8920E704 ON "transfer_agreement" (accepted_offer_id)');
        $this->addSql('COMMENT ON COLUMN "transfer_agreement".id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "transfer_agreement".transfer_negociation_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "transfer_agreement".accepted_offer_id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE "transfer_message" (id UUID NOT NULL, transfer_negociation_id UUID NOT NULL, author_id UUID NOT NULL, type VARCHAR(20) NOT NULL, content TEXT NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_90842343F018736 ON "transfer_message" (transfer_negociation_id)');
        $this->addSql('CREATE INDEX IDX_9084234F675F31B ON "transfer_message" (author_id)');
        $this->addSql('COMMENT ON COLUMN "transfer_message".id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "transfer_message".transfer_negociation_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "transfer_message".author_id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE "transfer_negociation" (id UUID NOT NULL, listing_id UUID NOT NULL, buyer_team_id UUID NOT NULL, created_by_id UUID NOT NULL, status VARCHAR(20) NOT NULL, permission_to_speak_at DATE DEFAULT NULL, agreed_at DATE DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_6CEDA03AD4619D1A ON "transfer_negociation" (listing_id)');
        $this->addSql('CREATE INDEX IDX_6CEDA03A89C071D8 ON "transfer_negociation" (buyer_team_id)');
        $this->addSql('CREATE INDEX IDX_6CEDA03AB03A8386 ON "transfer_negociation" (created_by_id)');
        $this->addSql('COMMENT ON COLUMN "transfer_negociation".id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "transfer_negociation".listing_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "transfer_negociation".buyer_team_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "transfer_negociation".created_by_id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE "transfer_offer" (id UUID NOT NULL, transfer_negociation_id UUID NOT NULL, author_id UUID NOT NULL, kind VARCHAR(20) NOT NULL, amount INT NOT NULL, valid_until DATE DEFAULT NULL, status VARCHAR(20) NOT NULL, message TEXT DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_8A5272663F018736 ON "transfer_offer" (transfer_negociation_id)');
        $this->addSql('CREATE INDEX IDX_8A527266F675F31B ON "transfer_offer" (author_id)');
        $this->addSql('COMMENT ON COLUMN "transfer_offer".id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "transfer_offer".transfer_negociation_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "transfer_offer".author_id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE "user" (id UUID NOT NULL, first_name VARCHAR(255) NOT NULL, last_name VARCHAR(255) NOT NULL, email VARCHAR(320) NOT NULL, password VARCHAR(255) NOT NULL, roles JSON NOT NULL, phone VARCHAR(20) DEFAULT NULL, two_fasecret VARCHAR(255) DEFAULT NULL, reset_password_token VARCHAR(255) DEFAULT NULL, reset_password_token_expiry TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, reset_token_selector VARCHAR(255) DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_8D93D649E7927C74 ON "user" (email)');
        $this->addSql('COMMENT ON COLUMN "user".id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE sessions (sess_id VARCHAR(128) NOT NULL, sess_data BYTEA NOT NULL, sess_lifetime INT NOT NULL, sess_time INT NOT NULL, PRIMARY KEY(sess_id))');
        $this->addSql('CREATE INDEX sess_lifetime_idx ON sessions (sess_lifetime)');
        $this->addSql('ALTER TABLE "agent" ADD CONSTRAINT FK_268B9C9DA76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "agent_license" ADD CONSTRAINT FK_853B96B33414710B FOREIGN KEY (agent_id) REFERENCES "agent" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "club_profile" ADD CONSTRAINT FK_8C1F0F8DA76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "contract_message" ADD CONSTRAINT FK_BEEC4DB72A58D2B0 FOREIGN KEY (contract_negociation_id) REFERENCES "contract_negociation" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "contract_message" ADD CONSTRAINT FK_BEEC4DB7F675F31B FOREIGN KEY (author_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "contract_negociation" ADD CONSTRAINT FK_F74AEE1599E6F5DF FOREIGN KEY (player_id) REFERENCES "player" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "contract_negociation" ADD CONSTRAINT FK_F74AEE1589C071D8 FOREIGN KEY (buyer_team_id) REFERENCES "team" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "contract_negociation" ADD CONSTRAINT FK_F74AEE153414710B FOREIGN KEY (agent_id) REFERENCES "agent" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "contract_negociation" ADD CONSTRAINT FK_F74AEE153F018736 FOREIGN KEY (transfer_negociation_id) REFERENCES "transfer_negociation" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "contract_negociation" ADD CONSTRAINT FK_F74AEE15B03A8386 FOREIGN KEY (created_by_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "contract_offer" ADD CONSTRAINT FK_6AD71B1A2A58D2B0 FOREIGN KEY (contract_negociation_id) REFERENCES "contract_negociation" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "contract_offer" ADD CONSTRAINT FK_6AD71B1AF675F31B FOREIGN KEY (author_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "contract_package" ADD CONSTRAINT FK_D6391A5D2A58D2B0 FOREIGN KEY (contract_negociation_id) REFERENCES "contract_negociation" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "contract_package" ADD CONSTRAINT FK_D6391A5D8920E704 FOREIGN KEY (accepted_offer_id) REFERENCES "contract_offer" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "listing" ADD CONSTRAINT FK_CB0048D499E6F5DF FOREIGN KEY (player_id) REFERENCES "player" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "listing" ADD CONSTRAINT FK_CB0048D4F26261BF FOREIGN KEY (seller_team_id) REFERENCES "team" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "listing" ADD CONSTRAINT FK_CB0048D4B03A8386 FOREIGN KEY (created_by_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "player" ADD CONSTRAINT FK_98197A65296CD8AE FOREIGN KEY (team_id) REFERENCES "team" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "player" ADD CONSTRAINT FK_98197A6561190A32 FOREIGN KEY (club_id) REFERENCES "club" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "player" ADD CONSTRAINT FK_98197A65677381CF FOREIGN KEY (temporary_club_id) REFERENCES "club" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "player" ADD CONSTRAINT FK_98197A653414710B FOREIGN KEY (agent_id) REFERENCES "agent" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE stat_player ADD CONSTRAINT FK_6CA1E8E99502F0B FOREIGN KEY (stat_id) REFERENCES stat (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE stat_player ADD CONSTRAINT FK_6CA1E8E999E6F5DF FOREIGN KEY (player_id) REFERENCES "player" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "team_membership" ADD CONSTRAINT FK_B826A040A76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "team_membership" ADD CONSTRAINT FK_B826A040296CD8AE FOREIGN KEY (team_id) REFERENCES "team" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "transfer_agreement" ADD CONSTRAINT FK_83E3634F3F018736 FOREIGN KEY (transfer_negociation_id) REFERENCES "transfer_negociation" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "transfer_agreement" ADD CONSTRAINT FK_83E3634F8920E704 FOREIGN KEY (accepted_offer_id) REFERENCES "transfer_offer" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "transfer_message" ADD CONSTRAINT FK_90842343F018736 FOREIGN KEY (transfer_negociation_id) REFERENCES "transfer_negociation" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "transfer_message" ADD CONSTRAINT FK_9084234F675F31B FOREIGN KEY (author_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "transfer_negociation" ADD CONSTRAINT FK_6CEDA03AD4619D1A FOREIGN KEY (listing_id) REFERENCES "listing" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "transfer_negociation" ADD CONSTRAINT FK_6CEDA03A89C071D8 FOREIGN KEY (buyer_team_id) REFERENCES "team" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "transfer_negociation" ADD CONSTRAINT FK_6CEDA03AB03A8386 FOREIGN KEY (created_by_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "transfer_offer" ADD CONSTRAINT FK_8A5272663F018736 FOREIGN KEY (transfer_negociation_id) REFERENCES "transfer_negociation" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "transfer_offer" ADD CONSTRAINT FK_8A527266F675F31B FOREIGN KEY (author_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('DROP SEQUENCE stat_id_seq CASCADE');
        $this->addSql('ALTER TABLE "agent" DROP CONSTRAINT FK_268B9C9DA76ED395');
        $this->addSql('ALTER TABLE "agent_license" DROP CONSTRAINT FK_853B96B33414710B');
        $this->addSql('ALTER TABLE "club_profile" DROP CONSTRAINT FK_8C1F0F8DA76ED395');
        $this->addSql('ALTER TABLE "contract_message" DROP CONSTRAINT FK_BEEC4DB72A58D2B0');
        $this->addSql('ALTER TABLE "contract_message" DROP CONSTRAINT FK_BEEC4DB7F675F31B');
        $this->addSql('ALTER TABLE "contract_negociation" DROP CONSTRAINT FK_F74AEE1599E6F5DF');
        $this->addSql('ALTER TABLE "contract_negociation" DROP CONSTRAINT FK_F74AEE1589C071D8');
        $this->addSql('ALTER TABLE "contract_negociation" DROP CONSTRAINT FK_F74AEE153414710B');
        $this->addSql('ALTER TABLE "contract_negociation" DROP CONSTRAINT FK_F74AEE153F018736');
        $this->addSql('ALTER TABLE "contract_negociation" DROP CONSTRAINT FK_F74AEE15B03A8386');
        $this->addSql('ALTER TABLE "contract_offer" DROP CONSTRAINT FK_6AD71B1A2A58D2B0');
        $this->addSql('ALTER TABLE "contract_offer" DROP CONSTRAINT FK_6AD71B1AF675F31B');
        $this->addSql('ALTER TABLE "contract_package" DROP CONSTRAINT FK_D6391A5D2A58D2B0');
        $this->addSql('ALTER TABLE "contract_package" DROP CONSTRAINT FK_D6391A5D8920E704');
        $this->addSql('ALTER TABLE "listing" DROP CONSTRAINT FK_CB0048D499E6F5DF');
        $this->addSql('ALTER TABLE "listing" DROP CONSTRAINT FK_CB0048D4F26261BF');
        $this->addSql('ALTER TABLE "listing" DROP CONSTRAINT FK_CB0048D4B03A8386');
        $this->addSql('ALTER TABLE "player" DROP CONSTRAINT FK_98197A65296CD8AE');
        $this->addSql('ALTER TABLE "player" DROP CONSTRAINT FK_98197A6561190A32');
        $this->addSql('ALTER TABLE "player" DROP CONSTRAINT FK_98197A65677381CF');
        $this->addSql('ALTER TABLE "player" DROP CONSTRAINT FK_98197A653414710B');
        $this->addSql('ALTER TABLE stat_player DROP CONSTRAINT FK_6CA1E8E99502F0B');
        $this->addSql('ALTER TABLE stat_player DROP CONSTRAINT FK_6CA1E8E999E6F5DF');
        $this->addSql('ALTER TABLE "team_membership" DROP CONSTRAINT FK_B826A040A76ED395');
        $this->addSql('ALTER TABLE "team_membership" DROP CONSTRAINT FK_B826A040296CD8AE');
        $this->addSql('ALTER TABLE "transfer_agreement" DROP CONSTRAINT FK_83E3634F3F018736');
        $this->addSql('ALTER TABLE "transfer_agreement" DROP CONSTRAINT FK_83E3634F8920E704');
        $this->addSql('ALTER TABLE "transfer_message" DROP CONSTRAINT FK_90842343F018736');
        $this->addSql('ALTER TABLE "transfer_message" DROP CONSTRAINT FK_9084234F675F31B');
        $this->addSql('ALTER TABLE "transfer_negociation" DROP CONSTRAINT FK_6CEDA03AD4619D1A');
        $this->addSql('ALTER TABLE "transfer_negociation" DROP CONSTRAINT FK_6CEDA03A89C071D8');
        $this->addSql('ALTER TABLE "transfer_negociation" DROP CONSTRAINT FK_6CEDA03AB03A8386');
        $this->addSql('ALTER TABLE "transfer_offer" DROP CONSTRAINT FK_8A5272663F018736');
        $this->addSql('ALTER TABLE "transfer_offer" DROP CONSTRAINT FK_8A527266F675F31B');
        $this->addSql('DROP TABLE "agent"');
        $this->addSql('DROP TABLE "agent_license"');
        $this->addSql('DROP TABLE "club"');
        $this->addSql('DROP TABLE "club_profile"');
        $this->addSql('DROP TABLE "contract_message"');
        $this->addSql('DROP TABLE "contract_negociation"');
        $this->addSql('DROP TABLE "contract_offer"');
        $this->addSql('DROP TABLE "contract_package"');
        $this->addSql('DROP TABLE "listing"');
        $this->addSql('DROP TABLE "player"');
        $this->addSql('DROP TABLE stat');
        $this->addSql('DROP TABLE stat_player');
        $this->addSql('DROP TABLE "team"');
        $this->addSql('DROP TABLE "team_membership"');
        $this->addSql('DROP TABLE "transfer_agreement"');
        $this->addSql('DROP TABLE "transfer_message"');
        $this->addSql('DROP TABLE "transfer_negociation"');
        $this->addSql('DROP TABLE "transfer_offer"');
        $this->addSql('DROP TABLE "user"');
        $this->addSql('DROP TABLE sessions');
    }
}
