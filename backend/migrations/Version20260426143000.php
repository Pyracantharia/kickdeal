<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260426143000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add football transfer offer terms';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "transfer_offer" ALTER amount TYPE BIGINT');
        $this->addSql('ALTER TABLE "transfer_offer" ADD exchange_player_id UUID DEFAULT NULL');
        $this->addSql('ALTER TABLE "transfer_offer" ADD duration_months INT DEFAULT NULL');
        $this->addSql('ALTER TABLE "transfer_offer" ADD payment_installments INT DEFAULT NULL');
        $this->addSql('ALTER TABLE "transfer_offer" ADD performance_bonus INT DEFAULT NULL');
        $this->addSql('ALTER TABLE "transfer_offer" ADD resale_percentage INT DEFAULT NULL');
        $this->addSql('CREATE INDEX IDX_8A52726648A60D73 ON "transfer_offer" (exchange_player_id)');
        $this->addSql('COMMENT ON COLUMN "transfer_offer".exchange_player_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE "transfer_offer" ADD CONSTRAINT FK_8A52726648A60D73 FOREIGN KEY (exchange_player_id) REFERENCES "player" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "transfer_offer" DROP CONSTRAINT FK_8A52726648A60D73');
        $this->addSql('DROP INDEX IDX_8A52726648A60D73');
        $this->addSql('ALTER TABLE "transfer_offer" DROP exchange_player_id');
        $this->addSql('ALTER TABLE "transfer_offer" DROP duration_months');
        $this->addSql('ALTER TABLE "transfer_offer" DROP payment_installments');
        $this->addSql('ALTER TABLE "transfer_offer" DROP performance_bonus');
        $this->addSql('ALTER TABLE "transfer_offer" DROP resale_percentage');
        $this->addSql('ALTER TABLE "transfer_offer" ALTER amount TYPE INT');
    }
}