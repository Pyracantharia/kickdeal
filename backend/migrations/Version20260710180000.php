<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260710180000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add explicit visibility moderation to public feed posts.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE public_feed_post ADD is_visible BOOLEAN DEFAULT true NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE public_feed_post DROP is_visible');
    }
}
