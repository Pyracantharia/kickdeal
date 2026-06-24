<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260623183000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add public feed posts and publication flags for negotiation entities.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE public_feed_post (id UUID NOT NULL, player_id UUID DEFAULT NULL, seller_team_id UUID DEFAULT NULL, buyer_team_id UUID DEFAULT NULL, event_type VARCHAR(40) NOT NULL, bucket VARCHAR(20) NOT NULL, source_type VARCHAR(60) NOT NULL, source_id VARCHAR(120) NOT NULL, is_featured BOOLEAN DEFAULT false NOT NULL, published_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, headline VARCHAR(180) NOT NULL, body TEXT NOT NULL, player_name VARCHAR(120) DEFAULT NULL, amount BIGINT DEFAULT NULL, currency VARCHAR(3) NOT NULL, details_json JSON NOT NULL, league VARCHAR(120) DEFAULT NULL, country VARCHAR(120) DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX uniq_public_feed_source_event ON public_feed_post (source_type, source_id, event_type)');
        $this->addSql('CREATE INDEX IDX_B28C1F4899E6F5DF ON public_feed_post (player_id)');
        $this->addSql('CREATE INDEX IDX_B28C1F4A331256E ON public_feed_post (seller_team_id)');
        $this->addSql('CREATE INDEX IDX_B28C1F4B96F5643 ON public_feed_post (buyer_team_id)');
        $this->addSql('CREATE INDEX idx_public_feed_bucket_published ON public_feed_post (bucket, published_at)');
        $this->addSql('CREATE INDEX idx_public_feed_type_published ON public_feed_post (event_type, published_at)');
        $this->addSql('COMMENT ON COLUMN public_feed_post.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN public_feed_post.player_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN public_feed_post.seller_team_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN public_feed_post.buyer_team_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE public_feed_post ADD CONSTRAINT FK_B28C1F4899E6F5DF FOREIGN KEY (player_id) REFERENCES player (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE public_feed_post ADD CONSTRAINT FK_B28C1F4A331256E FOREIGN KEY (seller_team_id) REFERENCES team (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE public_feed_post ADD CONSTRAINT FK_B28C1F4B96F5643 FOREIGN KEY (buyer_team_id) REFERENCES team (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE transfer_negociation ADD public_feed_enabled BOOLEAN DEFAULT false NOT NULL');
        $this->addSql('ALTER TABLE contract_negociation ADD public_feed_enabled BOOLEAN DEFAULT false NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE transfer_negociation DROP public_feed_enabled');
        $this->addSql('ALTER TABLE contract_negociation DROP public_feed_enabled');
        $this->addSql('ALTER TABLE public_feed_post DROP CONSTRAINT FK_B28C1F4899E6F5DF');
        $this->addSql('ALTER TABLE public_feed_post DROP CONSTRAINT FK_B28C1F4A331256E');
        $this->addSql('ALTER TABLE public_feed_post DROP CONSTRAINT FK_B28C1F4B96F5643');
        $this->addSql('DROP TABLE public_feed_post');
    }
}
