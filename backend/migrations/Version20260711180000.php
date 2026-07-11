<?php
declare(strict_types=1);namespace DoctrineMigrations;
use Doctrine\DBAL\Schema\Schema;use Doctrine\Migrations\AbstractMigration;
final class Version20260711180000 extends AbstractMigration
{
 public function getDescription():string{return 'Add editable transfer window business parameter.';}
 public function up(Schema $schema):void
 {
  $value=json_encode(['winter'=>['fixed'=>true,'start'=>'01-01','end'=>'01-31'],'summerWindows'=>[['year'=>2026,'startDate'=>'2026-06-10','endDate'=>'2026-08-30']]],JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
  $this->addSql('INSERT INTO reference_data_item (id,type,code,label,value,active,created_at,updated_at) VALUES (gen_random_uuid(),\'business_parameter\',\'transfer_windows\',\'Périodes de mercato\',:value,true,NOW(),NOW()) ON CONFLICT (type, code) DO UPDATE SET label = EXCLUDED.label, value = CASE WHEN reference_data_item.value IS NULL OR reference_data_item.value::text = \'{}\' THEN EXCLUDED.value ELSE reference_data_item.value END, updated_at = NOW()',['value'=>$value]);
 }
 public function down(Schema $schema):void
 {
  $this->addSql('DELETE FROM reference_data_item WHERE type = \'business_parameter\' AND code = \'transfer_windows\'');
 }
}
