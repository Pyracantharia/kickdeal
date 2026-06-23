<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260611184817 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE club ADD team_id UUID DEFAULT NULL');
        $this->addSql('COMMENT ON COLUMN club.team_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE club ADD CONSTRAINT FK_B8EE3872296CD8AE FOREIGN KEY (team_id) REFERENCES "team" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_B8EE3872296CD8AE ON club (team_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE "club" DROP CONSTRAINT FK_B8EE3872296CD8AE');
        $this->addSql('DROP INDEX UNIQ_B8EE3872296CD8AE');
        $this->addSql('ALTER TABLE "club" DROP team_id');
    }
}
