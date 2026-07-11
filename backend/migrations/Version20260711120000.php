<?php

declare(strict_types=1);
namespace DoctrineMigrations;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260711120000 extends AbstractMigration
{
    public function getDescription(): string { return 'Create persistent admin audit history.'; }
    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE admin_audit_log (id UUID NOT NULL, admin_id UUID DEFAULT NULL, admin_email VARCHAR(320) NOT NULL, admin_name VARCHAR(255) NOT NULL, action VARCHAR(80) NOT NULL, category VARCHAR(50) NOT NULL, target_type VARCHAR(80) NOT NULL, target_id VARCHAR(120) DEFAULT NULL, target_label VARCHAR(255) NOT NULL, changes JSON NOT NULL, context JSON NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_ADMIN_AUDIT_ADMIN ON admin_audit_log (admin_id)');
        $this->addSql('CREATE INDEX idx_admin_audit_created ON admin_audit_log (created_at)');
        $this->addSql('CREATE INDEX idx_admin_audit_action ON admin_audit_log (action)');
        $this->addSql('ALTER TABLE admin_audit_log ADD CONSTRAINT FK_ADMIN_AUDIT_ADMIN FOREIGN KEY (admin_id) REFERENCES "user" (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql("COMMENT ON COLUMN admin_audit_log.id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN admin_audit_log.admin_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN admin_audit_log.created_at IS '(DC2Type:datetime_immutable)'");
    }
    public function down(Schema $schema): void { $this->addSql('DROP TABLE admin_audit_log'); }
}
