<?php
declare(strict_types=1);namespace DoctrineMigrations;
use Doctrine\DBAL\Schema\Schema;use Doctrine\Migrations\AbstractMigration;
final class Version20260711190000 extends AbstractMigration
{
 public function getDescription():string{return 'Add support conversation type to direct conversations.';}
 public function up(Schema $schema):void{$this->addSql("ALTER TABLE direct_conversation ADD type VARCHAR(30) DEFAULT 'direct' NOT NULL");}
 public function down(Schema $schema):void{$this->addSql('ALTER TABLE direct_conversation DROP type');}
}
