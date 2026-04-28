<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260426170000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add advanced transfer negotiation offer terms';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "transfer_offer" ALTER performance_bonus TYPE BIGINT');
        $this->addSql('ALTER TABLE "transfer_offer" ADD performance_bonus_condition TEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE "transfer_offer" ADD buy_back_priority BOOLEAN DEFAULT false NOT NULL');
        $this->addSql('ALTER TABLE "transfer_offer" ADD future_transfer_priority BOOLEAN DEFAULT false NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "transfer_offer" DROP performance_bonus_condition');
        $this->addSql('ALTER TABLE "transfer_offer" DROP buy_back_priority');
        $this->addSql('ALTER TABLE "transfer_offer" DROP future_transfer_priority');
        $this->addSql('ALTER TABLE "transfer_offer" ALTER performance_bonus TYPE INT');
    }
}