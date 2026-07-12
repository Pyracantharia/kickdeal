<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260701204656 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql($this->renameIndexIfNeeded('idx_1c0607fb9d1c3019', 'IDX_CB95912F49E67092'));
        $this->addSql($this->renameIndexIfNeeded('idx_1c0607fb332c4c83', 'IDX_CB95912F22BA975D'));
        $this->addSql($this->renameIndexIfNeeded('idx_eb3b99be9ac0396', 'IDX_1416AF939AC0396'));
        $this->addSql($this->renameIndexIfNeeded('idx_eb3b99bf624b39d', 'IDX_1416AF93F624B39D'));
        $this->addSql('ALTER TABLE public_feed_post ALTER published_at TYPE TIMESTAMP(0) WITHOUT TIME ZONE');
        $this->addSql('COMMENT ON COLUMN public_feed_post.published_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql($this->renameIndexIfNeeded('idx_b28c1f4899e6f5df', 'IDX_F73A5C5B99E6F5DF'));
        $this->addSql($this->renameIndexIfNeeded('idx_b28c1f4a331256e', 'IDX_F73A5C5BF26261BF'));
        $this->addSql($this->renameIndexIfNeeded('idx_b28c1f4b96f5643', 'IDX_F73A5C5B89C071D8'));
        $this->addSql('ALTER TABLE "user" ADD IF NOT EXISTS password_changed_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('ALTER TABLE "user" ALTER two_faenabled_at TYPE TIMESTAMP(0) WITHOUT TIME ZONE');
        $this->addSql('COMMENT ON COLUMN "user".password_changed_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN "user".two_faenabled_at IS \'(DC2Type:datetime_immutable)\'');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE "public_feed_post" ALTER published_at TYPE TIMESTAMP(0) WITHOUT TIME ZONE');
        $this->addSql('COMMENT ON COLUMN "public_feed_post".published_at IS NULL');
        $this->addSql('ALTER INDEX idx_f73a5c5b99e6f5df RENAME TO idx_b28c1f4899e6f5df');
        $this->addSql('ALTER INDEX idx_f73a5c5bf26261bf RENAME TO idx_b28c1f4a331256e');
        $this->addSql('ALTER INDEX idx_f73a5c5b89c071d8 RENAME TO idx_b28c1f4b96f5643');
        $this->addSql('ALTER TABLE "user" DROP password_changed_at');
        $this->addSql('ALTER TABLE "user" ALTER two_faenabled_at TYPE TIMESTAMP(0) WITHOUT TIME ZONE');
        $this->addSql('COMMENT ON COLUMN "user".two_faenabled_at IS NULL');
        $this->addSql('ALTER INDEX idx_1416af939ac0396 RENAME TO idx_eb3b99be9ac0396');
        $this->addSql('ALTER INDEX idx_1416af93f624b39d RENAME TO idx_eb3b99bf624b39d');
        $this->addSql('ALTER INDEX idx_cb95912f22ba975d RENAME TO idx_1c0607fb332c4c83');
        $this->addSql('ALTER INDEX idx_cb95912f49e67092 RENAME TO idx_1c0607fb9d1c3019');
    }

    private function renameIndexIfNeeded(string $oldName, string $newName): string
    {
        return sprintf(
            'DO $$ BEGIN IF to_regclass(%s) IS NOT NULL AND to_regclass(%s) IS NULL THEN ALTER INDEX %s RENAME TO %s; END IF; END $$;',
            $this->connection->quote($oldName),
            $this->connection->quote($newName),
            $oldName,
            $newName,
        );
    }
}
