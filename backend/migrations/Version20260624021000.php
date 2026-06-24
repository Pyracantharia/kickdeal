<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260624021000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Adds direct messaging conversations and messages.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE "direct_conversation" (id UUID NOT NULL, participant_one_id UUID NOT NULL, participant_two_id UUID NOT NULL, participant_low_id UUID NOT NULL, participant_high_id UUID NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_DIRECT_CONVERSATION_PARTICIPANTS ON "direct_conversation" (participant_low_id, participant_high_id)');
        $this->addSql('CREATE INDEX IDX_1C0607FB9D1C3019 ON "direct_conversation" (participant_one_id)');
        $this->addSql('CREATE INDEX IDX_1C0607FB332C4C83 ON "direct_conversation" (participant_two_id)');
        $this->addSql('COMMENT ON COLUMN "direct_conversation".id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "direct_conversation".participant_one_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "direct_conversation".participant_two_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "direct_conversation".participant_low_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "direct_conversation".participant_high_id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE "direct_message" (id UUID NOT NULL, conversation_id UUID NOT NULL, sender_id UUID NOT NULL, content TEXT NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_EB3B99BE9AC0396 ON "direct_message" (conversation_id)');
        $this->addSql('CREATE INDEX IDX_EB3B99BF624B39D ON "direct_message" (sender_id)');
        $this->addSql('COMMENT ON COLUMN "direct_message".id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "direct_message".conversation_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "direct_message".sender_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE "direct_conversation" ADD CONSTRAINT FK_1C0607FB9D1C3019 FOREIGN KEY (participant_one_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "direct_conversation" ADD CONSTRAINT FK_1C0607FB332C4C83 FOREIGN KEY (participant_two_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "direct_message" ADD CONSTRAINT FK_EB3B99BE9AC0396 FOREIGN KEY (conversation_id) REFERENCES "direct_conversation" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "direct_message" ADD CONSTRAINT FK_EB3B99BF624B39D FOREIGN KEY (sender_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "direct_message" DROP CONSTRAINT FK_EB3B99BE9AC0396');
        $this->addSql('ALTER TABLE "direct_message" DROP CONSTRAINT FK_EB3B99BF624B39D');
        $this->addSql('ALTER TABLE "direct_conversation" DROP CONSTRAINT FK_1C0607FB9D1C3019');
        $this->addSql('ALTER TABLE "direct_conversation" DROP CONSTRAINT FK_1C0607FB332C4C83');
        $this->addSql('DROP TABLE "direct_message"');
        $this->addSql('DROP TABLE "direct_conversation"');
    }
}
