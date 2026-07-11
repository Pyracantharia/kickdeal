<?php
declare(strict_types=1);namespace DoctrineMigrations;
use Doctrine\DBAL\Schema\Schema;use Doctrine\Migrations\AbstractMigration;
final class Version20260711160000 extends AbstractMigration
{
 public function getDescription():string{return 'Create manageable reference data and business settings.';}
 public function up(Schema $schema):void
 {
  $this->addSql('CREATE TABLE reference_data_item (id UUID NOT NULL, type VARCHAR(40) NOT NULL, code VARCHAR(120) NOT NULL, label VARCHAR(180) NOT NULL, value JSON NOT NULL, active BOOLEAN DEFAULT true NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
  $this->addSql('CREATE UNIQUE INDEX uniq_reference_type_code ON reference_data_item (type, code)');
  $this->addSql("COMMENT ON COLUMN reference_data_item.id IS '(DC2Type:uuid)'");
  $this->addSql("COMMENT ON COLUMN reference_data_item.created_at IS '(DC2Type:datetime_immutable)'");$this->addSql("COMMENT ON COLUMN reference_data_item.updated_at IS '(DC2Type:datetime_immutable)'");
  foreach([['business_parameter','club_free_offer_limit','Offres gratuites club','{"value":1,"unit":"offres"}'],['business_parameter','club_free_active_negotiation_limit','Négociations actives gratuites','{"value":2,"unit":"négociations"}'],['business_parameter','agent_free_player_limit','Joueurs représentés gratuitement','{"value":3,"unit":"joueurs"}'],['business_parameter','stale_negotiation_days','Délai avant alerte négociation','{"value":7,"unit":"jours"}'],['plan','agent_free','Agent Free','{"audience":"agent","tier":"free"}'],['plan','agent_pro','Agent Pro','{"audience":"agent","tier":"pro"}'],['plan','club_free','Club Free','{"audience":"club","tier":"free","seats":1}'],['plan','club_pro','Club Pro','{"audience":"club","tier":"pro","seats":3}'],['plan','club_enterprise','Club Enterprise','{"audience":"club","tier":"enterprise","seats":null}']] as [$type,$code,$label,$value]){$this->addSql('INSERT INTO reference_data_item (id,type,code,label,value,active,created_at,updated_at) VALUES (gen_random_uuid(),:type,:code,:label,:value,true,NOW(),NOW())',['type'=>$type,'code'=>$code,'label'=>$label,'value'=>$value]);}
  $this->addSql("INSERT INTO reference_data_item (id,type,code,label,value,active,created_at,updated_at) SELECT gen_random_uuid(),'league',league,league,'{}',true,NOW(),NOW() FROM team WHERE league IS NOT NULL AND TRIM(league) <> '' GROUP BY league");
  $this->addSql("INSERT INTO reference_data_item (id,type,code,label,value,active,created_at,updated_at) SELECT gen_random_uuid(),'country',country,country,'{}',true,NOW(),NOW() FROM team WHERE country IS NOT NULL AND TRIM(country) <> '' GROUP BY country");
  $this->addSql("INSERT INTO reference_data_item (id,type,code,label,value,active,created_at,updated_at) SELECT gen_random_uuid(),'position',position,position,'{}',true,NOW(),NOW() FROM player WHERE position IS NOT NULL AND TRIM(position) <> '' GROUP BY position");
 }
 public function down(Schema $schema):void{$this->addSql('DROP TABLE reference_data_item');}
}
