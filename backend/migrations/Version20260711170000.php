<?php
declare(strict_types=1);namespace DoctrineMigrations;
use Doctrine\DBAL\Schema\Schema;use Doctrine\Migrations\AbstractMigration;
final class Version20260711170000 extends AbstractMigration
{
 public function getDescription():string{return 'Add editable prices, descriptions and features to subscription plans.';}
 public function up(Schema $schema):void
 {
  $plans=[
   'agent_free'=>['audience'=>'agent','tier'=>'free','priceCents'=>0,'currency'=>'EUR','billingPeriod'=>'month','description'=>'Les outils essentiels pour gérer un portefeuille limité.','features'=>['Profil agent','Réponses aux sollicitations entrantes','Négociations contractuelles entrantes','Nombre limité de joueurs représentés']],
   'agent_pro'=>['audience'=>'agent','tier'=>'pro','priceCents'=>4900,'currency'=>'EUR','billingPeriod'=>'month','description'=>'Développez activement votre portefeuille et vos relations avec les clubs.','features'=>['Proposition active de joueurs','Mise sur le marché','Contacts directs avec les clubs','Joueurs représentés illimités','Visibilité renforcée']],
   'club_free'=>['audience'=>'club','tier'=>'free','priceCents'=>0,'currency'=>'EUR','billingPeriod'=>'month','description'=>'Les fonctions principales pour découvrir la plateforme.','features'=>['1 utilisateur','1 offre / approche gratuite','Nombre limité de négociations actives','Accès limité aux PDFs','Gestion d’effectif limitée'],'seats'=>1],
   'club_pro'=>['audience'=>'club','tier'=>'pro','priceCents'=>20000,'currency'=>'EUR','billingPeriod'=>'month','description'=>'Tous les outils nécessaires pour piloter le recrutement d’un club.','features'=>['3 utilisateurs inclus','Négociations illimitées','Gestion effectif complète','PDF officiels','Historique complet','Multi-utilisateurs'],'seats'=>3],
   'club_enterprise'=>['audience'=>'club','tier'=>'enterprise','priceCents'=>40000,'currency'=>'EUR','billingPeriod'=>'month','description'=>'Une offre complète pour les organisations et équipes étendues.','features'=>['Utilisateurs illimités','Permissions avancées','Analytics avancés','Support prioritaire','Négociations illimitées','PDF officiels'],'seats'=>null],
  ];
  foreach($plans as $code=>$value)$this->addSql('UPDATE reference_data_item SET value = :value, updated_at = NOW() WHERE type = \'plan\' AND code = :code',['value'=>json_encode($value,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR),'code'=>$code]);
 }
 public function down(Schema $schema):void{}
}
