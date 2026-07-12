<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260706120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add message reports and temporary user bans.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "user" ADD banned_until TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('ALTER TABLE "user" ADD ban_reason TEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE "user" ADD banned_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('COMMENT ON COLUMN "user".banned_until IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN "user".banned_at IS \'(DC2Type:datetime_immutable)\'');

        $this->addSql('CREATE TABLE message_report (id UUID NOT NULL, message_id UUID DEFAULT NULL, conversation_id UUID NOT NULL, reporter_id UUID NOT NULL, reported_user_id UUID NOT NULL, decided_by_id UUID DEFAULT NULL, message_content TEXT NOT NULL, reason TEXT DEFAULT NULL, status VARCHAR(30) NOT NULL, admin_comment TEXT DEFAULT NULL, decided_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, ban_until TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_MESSAGE_REPORT_REPORTER_MESSAGE ON message_report (reporter_id, message_id)');
        $this->addSql('CREATE INDEX IDX_1FC2B639537A1329 ON message_report (message_id)');
        $this->addSql('CREATE INDEX IDX_1FC2B6399AC0396 ON message_report (conversation_id)');
        $this->addSql('CREATE INDEX IDX_1FC2B639E1CFE6F5 ON message_report (reporter_id)');
        $this->addSql('CREATE INDEX IDX_1FC2B639D01FB7FF ON message_report (reported_user_id)');
        $this->addSql('CREATE INDEX IDX_1FC2B639DE621468 ON message_report (decided_by_id)');
        $this->addSql('CREATE INDEX IDX_MESSAGE_REPORT_STATUS_CREATED ON message_report (status, created_at)');
        $this->addSql('ALTER TABLE message_report ADD CONSTRAINT FK_1FC2B639537A1329 FOREIGN KEY (message_id) REFERENCES direct_message (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE message_report ADD CONSTRAINT FK_1FC2B6399AC0396 FOREIGN KEY (conversation_id) REFERENCES direct_conversation (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE message_report ADD CONSTRAINT FK_1FC2B639E1CFE6F5 FOREIGN KEY (reporter_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE message_report ADD CONSTRAINT FK_1FC2B639D01FB7FF FOREIGN KEY (reported_user_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE message_report ADD CONSTRAINT FK_1FC2B639DE621468 FOREIGN KEY (decided_by_id) REFERENCES "user" (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('COMMENT ON COLUMN message_report.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN message_report.message_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN message_report.conversation_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN message_report.reporter_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN message_report.reported_user_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN message_report.decided_by_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN message_report.decided_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN message_report.ban_until IS \'(DC2Type:datetime_immutable)\'');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE message_report DROP CONSTRAINT FK_1FC2B639537A1329');
        $this->addSql('ALTER TABLE message_report DROP CONSTRAINT FK_1FC2B6399AC0396');
        $this->addSql('ALTER TABLE message_report DROP CONSTRAINT FK_1FC2B639E1CFE6F5');
        $this->addSql('ALTER TABLE message_report DROP CONSTRAINT FK_1FC2B639D01FB7FF');
        $this->addSql('ALTER TABLE message_report DROP CONSTRAINT FK_1FC2B639DE621468');
        $this->addSql('DROP TABLE message_report');
        $this->addSql('ALTER TABLE "user" DROP banned_until');
        $this->addSql('ALTER TABLE "user" DROP ban_reason');
        $this->addSql('ALTER TABLE "user" DROP banned_at');
    }
}
