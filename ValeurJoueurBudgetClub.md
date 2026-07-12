Valeur marchande du joueur
Entité : App\Entity\Player dans [Player.php (line 62)](/Users/jeremy/kickdeal/backend/src/Entity/Player.php:62)
Table : player
Champ BDD : market_value
Type : BIGINT en base, mappé Doctrine en ?string interne puis exposé par getter en ?int dans [Player.php (line 228)](/Users/jeremy/kickdeal/backend/src/Entity/Player.php:228)
Unité attendue : centimes d’euro
Où la donnée est utilisée dans l’application :Sérialisation des joueurs marché dans [PlayerController.php (line 120)](/Users/jeremy/kickdeal/backend/src/Controller/PlayerController.php:120) et champ retourné en [PlayerController.php (line 140)](/Users/jeremy/kickdeal/backend/src/Controller/PlayerController.php:140)
Sérialisation effectif club dans [PlayerController.php (line 148)](/Users/jeremy/kickdeal/backend/src/Controller/PlayerController.php:148) et champ retourné en [PlayerController.php (line 160)](/Users/jeremy/kickdeal/backend/src/Controller/PlayerController.php:160)
Sérialisation annonces/transferts dans [ListingController.php (line 220)](/Users/jeremy/kickdeal/backend/src/Controller/ListingController.php:220) et [TransferController.php (line 658)](/Users/jeremy/kickdeal/backend/src/Controller/TransferController.php:658)
Dashboard agent dans [DashboardController.php (line 188)](/Users/jeremy/kickdeal/backend/src/Controller/DashboardController.php:188)
Prospecting agent pour score de compatibilité financière dans [AgentPlayerController.php (line 428)](/Users/jeremy/kickdeal/backend/src/Controller/AgentPlayerController.php:428) et sérialisation en [AgentPlayerController.php (line 560)](/Users/jeremy/kickdeal/backend/src/Controller/AgentPlayerController.php:560)
Agrégation valeur d’effectif via SUM(player.marketValue) dans [TeamRepository.php (line 97)](/Users/jeremy/kickdeal/backend/src/Repository/TeamRepository.php:97)
Agrégation finances club dans [ClubController.php (line 460)](/Users/jeremy/kickdeal/backend/src/Controller/ClubController.php:460)

Où elle est affichée côté front :Fiche joueur marché dans [PlayerDetails.tsx (line 178)](/Users/jeremy/kickdeal/frontend-app/components/market/PlayerDetails.tsx:178)
Résultats de recherche joueurs dans [PlayerSearchResults.tsx (line 150)](/Users/jeremy/kickdeal/frontend-app/components/market/PlayerSearchResults.tsx:150)
Négociation transfert dans [TransferNegotiationParts.tsx (line 36)](/Users/jeremy/kickdeal/frontend-app/components/market/negotiation/TransferNegotiationParts.tsx:36)
Tableau effectif club dans [PlayerRosterTable.tsx (line 159)](/Users/jeremy/kickdeal/frontend-app/components/club/PlayerRosterTable.tsx:159)
Carte détail joueur club dans [PlayerDetailsCard.tsx (line 37)](/Users/jeremy/kickdeal/frontend-app/components/club/PlayerDetailsCard.tsx:37)
Pages agent dans [AgentPlayerDetailsCard.tsx (line 44)](/Users/jeremy/kickdeal/frontend-app/components/agent/AgentPlayerDetailsCard.tsx:44), [AgentPlayersPage.tsx (line 259)](/Users/jeremy/kickdeal/frontend-app/components/agent/AgentPlayersPage.tsx:259), [AgentClubProspectingPage.tsx (line 307)](/Users/jeremy/kickdeal/frontend-app/components/agent/AgentClubProspectingPage.tsx:307), [AgentDashboardHome.tsx (line 394)](/Users/jeremy/kickdeal/frontend-app/components/dashboard/AgentDashboardHome.tsx:394)
Valeur d’effectif club affichée comme finance agrégée dans [ClubDetailPage.tsx (line 258)](/Users/jeremy/kickdeal/frontend-app/components/club/ClubDetailPage.tsx:258)

Format attendu dans les fixtures :setMarketValue(?int) attend un entier en centimes, pas un float en millions ni un montant formaté
Exemple : 180 M€ => 18000000000
Le fixture actuel injecte des valeurs brutes probablement en euros dans [CompetitionFixtures.php (line 90)](/Users/jeremy/kickdeal/backend/src/DataFixtures/CompetitionFixtures.php:90), ce qui est incohérent avec le reste de l’app

Salaire hebdomadaire du joueur
Entité : App\Entity\Player dans [Player.php (line 65)](/Users/jeremy/kickdeal/backend/src/Entity/Player.php:65)
Table : player
Champ BDD : weekly_salary
Type : BIGINT en base, mappé Doctrine en ?string interne puis getter ?int dans [Player.php (line 240)](/Users/jeremy/kickdeal/backend/src/Entity/Player.php:240)
Unité attendue : centimes d’euro par semaine
Où la donnée est utilisée dans l’application :Sérialisation joueurs marché dans [PlayerController.php (line 141)](/Users/jeremy/kickdeal/backend/src/Controller/PlayerController.php:141)
Sérialisation effectif club avec format hebdo dédié dans [PlayerController.php (line 161)](/Users/jeremy/kickdeal/backend/src/Controller/PlayerController.php:161)
Sérialisation annonces/transferts dans [ListingController.php (line 229)](/Users/jeremy/kickdeal/backend/src/Controller/ListingController.php:229) et [TransferController.php (line 679)](/Users/jeremy/kickdeal/backend/src/Controller/TransferController.php:679)
Sérialisation agent dans [AgentPlayerController.php (line 561)](/Users/jeremy/kickdeal/backend/src/Controller/AgentPlayerController.php:561)
Calcul de masse salariale annuelle club via weeklySalary * 52 dans [ClubController.php (line 456)](/Users/jeremy/kickdeal/backend/src/Controller/ClubController.php:456) puis exposé en [ClubController.php (line 487)](/Users/jeremy/kickdeal/backend/src/Controller/ClubController.php:487)
Utilisé comme base dans les négociations contractuelles dans [ContractNegotiationController.php (line 388)](/Users/jeremy/kickdeal/backend/src/Controller/ContractNegotiationController.php:388)
Mis à jour automatiquement après acceptation d’une négociation de contrat dans [ContractNegotiationWorkflow.php (line 136)](/Users/jeremy/kickdeal/backend/src/Service/Contract/ContractNegotiationWorkflow.php:136)

Où elle est affichée côté front :Fiche joueur marché dans [PlayerDetails.tsx (line 179)](/Users/jeremy/kickdeal/frontend-app/components/market/PlayerDetails.tsx:179)
Tableau effectif club dans [PlayerRosterTable.tsx (line 160)](/Users/jeremy/kickdeal/frontend-app/components/club/PlayerRosterTable.tsx:160)
Carte détail joueur club dans [PlayerDetailsCard.tsx (line 38)](/Users/jeremy/kickdeal/frontend-app/components/club/PlayerDetailsCard.tsx:38)
Carte détail joueur agent dans [AgentPlayerDetailsCard.tsx (line 45)](/Users/jeremy/kickdeal/frontend-app/components/agent/AgentPlayerDetailsCard.tsx:45)
Négociation de contrat dans [ContractNegotiationPage.tsx (line 252)](/Users/jeremy/kickdeal/frontend-app/components/agent/ContractNegotiationPage.tsx:252)

Format attendu dans les fixtures :setWeeklySalary(?int) attend un entier en centimes correspondant au salaire hebdomadaire
Exemple : 250 000 €/semaine => 25000000
Le fixture actuel injecte des valeurs brutes probablement en euros dans [CompetitionFixtures.php (line 91)](/Users/jeremy/kickdeal/backend/src/DataFixtures/CompetitionFixtures.php:91)

Date d’arrivée au club
Entité : App\Entity\Player dans [Player.php (line 78)](/Users/jeremy/kickdeal/backend/src/Entity/Player.php:78)
Table : player
Champ BDD : joined_at
Type : DATE en base, mappé Doctrine en ?\DateTimeInterface dans [Player.php (line 288)](/Users/jeremy/kickdeal/backend/src/Entity/Player.php:288)
Format attendu : date complète
Où elle est utilisée dans l’application :Sérialisation effectif club dans [PlayerController.php (line 165)](/Users/jeremy/kickdeal/backend/src/Controller/PlayerController.php:165)
Création manuelle de joueur : fixée aujourd’hui par défaut dans [ClubController.php (line 106)](/Users/jeremy/kickdeal/backend/src/Controller/ClubController.php:106)

Où elle est affichée côté front :Carte détail joueur club sous “Arrivée au club” dans [PlayerDetailsCard.tsx (line 40)](/Users/jeremy/kickdeal/frontend-app/components/club/PlayerDetailsCard.tsx:40)

Format attendu dans les fixtures :setJoinedAt(?\DateTimeInterface) attend un objet DateTimeImmutable
Le fixture actuel utilise déjà ce format dans [CompetitionFixtures.php (line 96)](/Users/jeremy/kickdeal/backend/src/DataFixtures/CompetitionFixtures.php:96)
Comme la colonne est un DATE, si ta source ne donne que mois + année, il faudra normaliser en une date complète
Recommandation pratique : stocker le premier jour du mois
Exemple : “juillet 2023” => new \DateTimeImmutable('2023-07-01')

Point important :Le besoin métier que tu décris est “mois et année d’arrivée”
Le modèle actuel ne stocke pas séparément mois et année, il stocke une date complète
Donc il faudra convertir la donnée collectée en date canonique avant injection

Budget transfert du club
Entité : App\Entity\Team dans [Team.php (line 46)](/Users/jeremy/kickdeal/backend/src/Entity/Team.php:46)
Table : team
Champ BDD : transfer_budget
Type : BIGINT en base, mappé Doctrine en ?string interne puis getter ?int dans [Team.php (line 146)](/Users/jeremy/kickdeal/backend/src/Entity/Team.php:146)
Unité attendue : centimes d’euro
Où la donnée est utilisée dans l’application :Mise à jour manuelle club via moneyToCents() dans [ClubController.php (line 146)](/Users/jeremy/kickdeal/backend/src/Controller/ClubController.php:146) et affectation en [ClubController.php (line 154)](/Users/jeremy/kickdeal/backend/src/Controller/ClubController.php:154)
Sérialisation finances club en [ClubController.php (line 485)](/Users/jeremy/kickdeal/backend/src/Controller/ClubController.php:485)
Contrôle qu’une offre de transfert ne dépasse pas le budget dans [TransferController.php (line 439)](/Users/jeremy/kickdeal/backend/src/Controller/TransferController.php:439)
Sérialisation budget pour contexte de négociation dans [TransferController.php (line 644)](/Users/jeremy/kickdeal/backend/src/Controller/TransferController.php:644)
Calcul de compatibilité financière en prospection agent dans [AgentPlayerController.php (line 429)](/Users/jeremy/kickdeal/backend/src/Controller/AgentPlayerController.php:429) et exposition en [AgentPlayerController.php (line 487)](/Users/jeremy/kickdeal/backend/src/Controller/AgentPlayerController.php:487)
Débité/crédité après transfert accepté dans [ContractNegotiationWorkflow.php (line 145)](/Users/jeremy/kickdeal/backend/src/Service/Contract/ContractNegotiationWorkflow.php:145)

Où elle est affichée côté front :Page club : cartes finances dans [ClubDetailPage.tsx (line 255)](/Users/jeremy/kickdeal/frontend-app/components/club/ClubDetailPage.tsx:255)
Page club : résumé budget en header dans [ClubDetailPage.tsx (line 214)](/Users/jeremy/kickdeal/frontend-app/components/club/ClubDetailPage.tsx:214)
Prospection agent : “Budget estimé” dans [AgentClubProspectingPage.tsx (line 350)](/Users/jeremy/kickdeal/frontend-app/components/agent/AgentClubProspectingPage.tsx:350) et [AgentClubProspectingPage.tsx (line 394)](/Users/jeremy/kickdeal/frontend-app/components/agent/AgentClubProspectingPage.tsx:394)

Format attendu dans les fixtures :setTransferBudget(?int) attend un entier en centimes
Exemple : 200 M€ => 20000000000
Le fixture actuel injecte des valeurs brutes probablement en euros dans [CompetitionFixtures.php (line 59)](/Users/jeremy/kickdeal/backend/src/DataFixtures/CompetitionFixtures.php:59)

Vérification des unités monétaires
Conclusion
Les montants métier sont stockés en centimes, pas en euros.
Preuves dans le code
transferBudget est explicitement commenté “Value in cents” dans [Team.php (line 46)](/Users/jeremy/kickdeal/backend/src/Entity/Team.php:46)
Tous les helpers formatMoney() divisent par 100 avant affichage :[PlayerController.php (line 206)](/Users/jeremy/kickdeal/backend/src/Controller/PlayerController.php:206)
[AgentPlayerController.php (line 584)](/Users/jeremy/kickdeal/backend/src/Controller/AgentPlayerController.php:584)
[TransferController.php (line 732)](/Users/jeremy/kickdeal/backend/src/Controller/TransferController.php:732)
[DashboardController.php (line 288)](/Users/jeremy/kickdeal/backend/src/Controller/DashboardController.php:288)
[ContractNegotiationController.php (line 551)](/Users/jeremy/kickdeal/backend/src/Controller/ContractNegotiationController.php:551)

Tous les inputs back convertissent des nombres front en centimes via moneyToCents() :[ClubController.php (line 655)](/Users/jeremy/kickdeal/backend/src/Controller/ClubController.php:655)
[TransferController.php (line 684)](/Users/jeremy/kickdeal/backend/src/Controller/TransferController.php:684)
[ContractNegotiationController.php (line 536)](/Users/jeremy/kickdeal/backend/src/Controller/ContractNegotiationController.php:536)

Le front saisit bien des montants en euros “humains”, puis le back les convertit :création joueur dans [ClubDetailPage.tsx (line 101)](/Users/jeremy/kickdeal/frontend-app/components/club/ClubDetailPage.tsx:101)
update budget club dans [ClubDetailPage.tsx (line 141)](/Users/jeremy/kickdeal/frontend-app/components/club/ClubDetailPage.tsx:141)

Les valeurs numériques “brutes” exposées côté API pour le front sont reconverties en euros, pas en centimes :transferBudgetValue => budget / 100 dans [AgentPlayerController.php (line 488)](/Users/jeremy/kickdeal/backend/src/Controller/AgentPlayerController.php:488)
transferBudgetValue => team->getTransferBudget() / 100 dans [TransferController.php (line 644)](/Users/jeremy/kickdeal/backend/src/Controller/TransferController.php:644)
annualSalaryValue => weeklySalary * 52 / 100 dans [ContractNegotiationController.php (line 389)](/Users/jeremy/kickdeal/backend/src/Controller/ContractNegotiationController.php:389)

Les finances club affichées côté front sont converties en millions d’euros via centsToMillions() :helper en [ClubController.php (line 664)](/Users/jeremy/kickdeal/backend/src/Controller/ClubController.php:664)
usage en [ClubController.php (line 485)](/Users/jeremy/kickdeal/backend/src/Controller/ClubController.php:485)

Réponse directe à ta question d’injection
Si le budget du Real Madrid est de 200 M€, il faut stocker :
20000000000
Pas :
200000000
ni 20000000000.00
ni une string formatée
Même logique :
valeur marchande 180 M€ => 18000000000
salaire hebdomadaire 250 000 € => 25000000
Ce que doivent contenir les seeders
Pour les champs monétaires des fixtures, injecter directement des centimes dans les setters :
$team->setTransferBudget(20000000000); // 200 M€
$player->setMarketValue(18000000000); // 180 M€
$player->setWeeklySalary(25000000);   // 250 000 €/sem
$player->setJoinedAt(new \DateTimeImmutable('2023-07-01')); // juillet 2023 normalisé
Attention importante sur l’existant
Les fixtures actuelles sont très probablement fausses en unité, car elles injectent des nombres bruts sans passage par moneyToCents() :
[CompetitionFixtures.php (line 59)](/Users/jeremy/kickdeal/backend/src/DataFixtures/CompetitionFixtures.php:59)
[CompetitionFixtures.php (line 90)](/Users/jeremy/kickdeal/backend/src/DataFixtures/CompetitionFixtures.php:90)
[CompetitionFixtures.php (line 91)](/Users/jeremy/kickdeal/backend/src/DataFixtures/CompetitionFixtures.php:91)
Donc aujourd’hui :
200000000 dans un fixture serait interprété comme 2 000 000 € à l’affichage
pas comme 200 000 000 €
Recommandation pratique pour ta collecte IA
Demande à l’IA de te renvoyer :
market_value_eur
weekly_salary_eur
joined_at_month
joined_at_year
transfer_budget_eur
Puis transforme avant injection :
*_eur => eur * 100
joined_at_month + joined_at_year => date ISO YYYY-MM-01
Si tu veux, je peux te faire maintenant le livrable suivant : un mapping JSON/CSV prêt à remplir par une IA, avec exactement les colonnes d’entrée et les colonnes de transformation pour tes seeders.