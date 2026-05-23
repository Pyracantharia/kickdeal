<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260508120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add MVP subscription plan fields to users';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "user" ADD subscription_plan VARCHAR(30) DEFAULT NULL');
        $this->addSql('ALTER TABLE "user" ADD subscription_limits_overrides JSON DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "user" DROP subscription_plan');
        $this->addSql('ALTER TABLE "user" DROP subscription_limits_overrides');
    }
}