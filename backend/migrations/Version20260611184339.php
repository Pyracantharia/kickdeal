<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260611184339 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE club_profile DROP CONSTRAINT fk_8c1f0f8ddf2ab4e5');
        $this->addSql('DROP INDEX idx_8c1f0f8ddf2ab4e5');
        $this->addSql('ALTER TABLE club_profile RENAME COLUMN club_id_id TO club_id');
        $this->addSql('ALTER TABLE club_profile ADD CONSTRAINT FK_8C1F0F8D61190A32 FOREIGN KEY (club_id) REFERENCES "club" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE INDEX IDX_8C1F0F8D61190A32 ON club_profile (club_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE "club_profile" DROP CONSTRAINT FK_8C1F0F8D61190A32');
        $this->addSql('DROP INDEX IDX_8C1F0F8D61190A32');
        $this->addSql('ALTER TABLE "club_profile" RENAME COLUMN club_id TO club_id_id');
        $this->addSql('ALTER TABLE "club_profile" ADD CONSTRAINT fk_8c1f0f8ddf2ab4e5 FOREIGN KEY (club_id_id) REFERENCES club (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE INDEX idx_8c1f0f8ddf2ab4e5 ON "club_profile" (club_id_id)');
    }
}
