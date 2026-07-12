<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260622125517 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE "user" ADD stripe_customer_id VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE "user" ADD stripe_subscription_id VARCHAR(255) DEFAULT NULL');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_8D93D649708DC647 ON "user" (stripe_customer_id)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_8D93D649B5DBB761 ON "user" (stripe_subscription_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('DROP INDEX UNIQ_8D93D649708DC647');
        $this->addSql('DROP INDEX UNIQ_8D93D649B5DBB761');
        $this->addSql('ALTER TABLE "user" DROP stripe_customer_id');
        $this->addSql('ALTER TABLE "user" DROP stripe_subscription_id');
    }
}
