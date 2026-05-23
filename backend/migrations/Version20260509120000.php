<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260509120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add payment records for subscription providers';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE "payment" (id UUID NOT NULL, user_id UUID NOT NULL, provider VARCHAR(20) NOT NULL, tx_hash VARCHAR(100) NOT NULL, plan_type VARCHAR(30) NOT NULL, amount_wei VARCHAR(80) NOT NULL, amount_chz NUMERIC(18, 8) NOT NULL, receiver_address VARCHAR(100) NOT NULL, chain_id INT NOT NULL, status VARCHAR(20) NOT NULL, confirmed_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_6D28840DA76ED395 ON "payment" (user_id)');
        $this->addSql('CREATE UNIQUE INDEX uniq_payment_tx_hash ON "payment" (tx_hash)');
        $this->addSql('COMMENT ON COLUMN "payment".id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "payment".user_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE "payment" ADD CONSTRAINT FK_6D28840DA76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "payment" DROP CONSTRAINT FK_6D28840DA76ED395');
        $this->addSql('DROP TABLE "payment"');
    }
}