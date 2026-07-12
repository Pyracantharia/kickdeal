<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260611183948 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE club_profile ADD club_id_id UUID DEFAULT NULL');
        $this->addSql('COMMENT ON COLUMN club_profile.club_id_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE club_profile ADD CONSTRAINT FK_8C1F0F8DDF2AB4E5 FOREIGN KEY (club_id_id) REFERENCES "club" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE INDEX IDX_8C1F0F8DDF2AB4E5 ON club_profile (club_id_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE "club_profile" DROP CONSTRAINT FK_8C1F0F8DDF2AB4E5');
        $this->addSql('DROP INDEX IDX_8C1F0F8DDF2AB4E5');
        $this->addSql('ALTER TABLE "club_profile" DROP club_id_id');
    }
}
