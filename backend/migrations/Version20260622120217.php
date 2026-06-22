<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260622120217 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER INDEX idx_28211e8388e7e5b2 RENAME TO IDX_36DF2A1DED442CF4');
        $this->addSql('ALTER INDEX idx_28211e83296cd8ae RENAME TO IDX_36DF2A1D296CD8AE');
        $this->addSql('ALTER TABLE payment ALTER confirmed_at TYPE TIMESTAMP(0) WITHOUT TIME ZONE');
        $this->addSql('COMMENT ON COLUMN payment.confirmed_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('ALTER TABLE player ALTER availability_status DROP DEFAULT');
        $this->addSql('ALTER TABLE player ALTER market_authorization_requested_at TYPE TIMESTAMP(0) WITHOUT TIME ZONE');
        $this->addSql('ALTER TABLE player ALTER market_authorization_decided_at TYPE TIMESTAMP(0) WITHOUT TIME ZONE');
        $this->addSql('COMMENT ON COLUMN player.market_authorization_requested_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN player.market_authorization_decided_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('ALTER INDEX idx_8a52726648a60d73 RENAME TO IDX_8A527266D4CE6CFE');
        $this->addSql('DROP INDEX uniq_4263d2c8296cd8ae99e6f5df');
        $this->addSql('ALTER INDEX idx_4263d2c8296cd8ae RENAME TO IDX_237C72CF296CD8AE');
        $this->addSql('ALTER INDEX idx_4263d2c899e6f5df RENAME TO IDX_237C72CF99E6F5DF');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER INDEX idx_36df2a1d296cd8ae RENAME TO idx_28211e83296cd8ae');
        $this->addSql('ALTER INDEX idx_36df2a1ded442cf4 RENAME TO idx_28211e8388e7e5b2');
        $this->addSql('ALTER TABLE "player" ALTER market_authorization_requested_at TYPE TIMESTAMP(0) WITHOUT TIME ZONE');
        $this->addSql('ALTER TABLE "player" ALTER market_authorization_decided_at TYPE TIMESTAMP(0) WITHOUT TIME ZONE');
        $this->addSql('ALTER TABLE "player" ALTER availability_status SET DEFAULT \'normal\'');
        $this->addSql('COMMENT ON COLUMN "player".market_authorization_requested_at IS NULL');
        $this->addSql('COMMENT ON COLUMN "player".market_authorization_decided_at IS NULL');
        $this->addSql('ALTER TABLE "payment" ALTER confirmed_at TYPE TIMESTAMP(0) WITHOUT TIME ZONE');
        $this->addSql('COMMENT ON COLUMN "payment".confirmed_at IS NULL');
        $this->addSql('CREATE UNIQUE INDEX uniq_4263d2c8296cd8ae99e6f5df ON "transfer_target" (team_id, player_id)');
        $this->addSql('ALTER INDEX idx_237c72cf296cd8ae RENAME TO idx_4263d2c8296cd8ae');
        $this->addSql('ALTER INDEX idx_237c72cf99e6f5df RENAME TO idx_4263d2c899e6f5df');
        $this->addSql('ALTER INDEX idx_8a527266d4ce6cfe RENAME TO idx_8a52726648a60d73');
    }
}
