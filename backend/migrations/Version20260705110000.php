<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260705110000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add persistent realtime notifications.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE app_notification (id UUID NOT NULL, recipient_id UUID NOT NULL, actor_id UUID DEFAULT NULL, type VARCHAR(80) NOT NULL, category VARCHAR(40) NOT NULL, severity VARCHAR(20) NOT NULL, title VARCHAR(180) NOT NULL, body TEXT DEFAULT NULL, action_url VARCHAR(255) DEFAULT NULL, target_route VARCHAR(80) DEFAULT NULL, requires_action BOOLEAN NOT NULL, read_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, resolved_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, source_type VARCHAR(80) DEFAULT NULL, source_id VARCHAR(80) DEFAULT NULL, metadata JSON DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_7DDA6C4BE92F8F78 ON app_notification (recipient_id)');
        $this->addSql('CREATE INDEX IDX_7DDA6C4B10DAF24A ON app_notification (actor_id)');
        $this->addSql('CREATE INDEX IDX_APP_NOTIFICATION_RECIPIENT_READ ON app_notification (recipient_id, read_at)');
        $this->addSql('CREATE INDEX IDX_APP_NOTIFICATION_RECIPIENT_TARGET ON app_notification (recipient_id, target_route, resolved_at)');
        $this->addSql('CREATE INDEX IDX_APP_NOTIFICATION_SOURCE ON app_notification (source_type, source_id)');
        $this->addSql('ALTER TABLE app_notification ADD CONSTRAINT FK_7DDA6C4BE92F8F78 FOREIGN KEY (recipient_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE app_notification ADD CONSTRAINT FK_7DDA6C4B10DAF24A FOREIGN KEY (actor_id) REFERENCES "user" (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('COMMENT ON COLUMN app_notification.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN app_notification.recipient_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN app_notification.actor_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN app_notification.read_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN app_notification.resolved_at IS \'(DC2Type:datetime_immutable)\'');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE app_notification DROP CONSTRAINT FK_7DDA6C4BE92F8F78');
        $this->addSql('ALTER TABLE app_notification DROP CONSTRAINT FK_7DDA6C4B10DAF24A');
        $this->addSql('DROP TABLE app_notification');
    }
}
