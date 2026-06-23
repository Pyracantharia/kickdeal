<?php

namespace App\DataFixtures;

use App\Entity\Club;
use App\Entity\Team;
use App\Entity\Player;
use App\Enum\TeamVerificationStatusEnum;
use App\Enum\PlayerContractStatusEnum;
use App\Enum\PlayerMarketStatusEnum;
use App\Enum\PlayerAvailabilityStatusEnum;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Faker\Factory;

class CompetitionFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        // Désactiver le logger SQL pour économiser de la RAM
        $manager->getConnection()->getConfiguration()->setSQLLogger(null);

        $faker = Factory::create('fr_FR');
        $projectDir = dirname(__DIR__, 2);
        
        $competitions = ['PL', 'BL1', 'FL1', 'PD', 'SA', 'DED', 'PPL'];
        
        $batchSize = 20;
        $i = 0;

        foreach ($competitions as $code) {
            $jsonPath = $projectDir . "/fixtures/json/{$code}/teams.json";

            if (!file_exists($jsonPath)) {
                continue;
            }

            $data = json_decode(file_get_contents($jsonPath), true);
            $teamsList = $data['teams'] ?? [];

            foreach ($teamsList as $teamData) {
                $i++;
                $teamName = $teamData['name'] ?? 'Équipe Inconnue';

                // Chaque bloc de joueurs d'un fichier a besoin d'un Club technique
                $club = new Club();
                
                // On vérifie si l'équipe (ex: "Germany") existe déjà globalement en BDD
                $team = $manager->getRepository(Team::class)->findOneBy(['name' => $teamName]);
                
                if (!$team) {
                    // Si elle n'existe pas encore, on la crée
                    $team = new Team();
                    $team->setName($teamName);
                    $team->setCountry($teamData['area']['name'] ?? 'Inconnu');
                    $team->setLogoUrl($teamData['crest'] ?? null);
                    $team->setLeague($data['competition']['name'] ?? $code);
                    $team->setTransferBudget($faker->numberBetween(15000000, 300000000));
                    $team->setVerificationStatus(TeamVerificationStatusEnum::VERIFIED);
                    $team->setClub($club);
                    $manager->persist($team);

                    $club->setTeam($team);
                    $manager->persist($club);
                }

                // 3. Création des Joueurs de cette effectif
                $squad = $teamData['squad'] ?? [];
                
                foreach ($squad as $playerData) {
                    $player = new Player();
                    
                    $fullName = $playerData['name'] ?? '';
                    $parts = explode(' ', $fullName, 2);
                    $firstName = $parts[0] ?? 'Inconnu';
                    $lastName = isset($parts[1]) ? $parts[1] : $parts[0];

                    $birthDate = isset($playerData['dateOfBirth']) 
                        ? new \DateTimeImmutable($playerData['dateOfBirth']) 
                        : \DateTimeImmutable::createFromMutable($faker->dateTimeBetween('-35 years', '-18 years'));

                    $player->setFirstName($firstName);
                    $player->setLastName($lastName);
                    $player->setPhotoUrl('https://via.placeholder.com/200x200?text=Player');
                    $player->setBirthDate($birthDate);
                    $player->setNationality($playerData['nationality'] ?? 'Inconnue');
                    $player->setPosition($playerData['position'] ?? 'Offence');
                    
                    $player->setHeightCm($faker->numberBetween(170, 195));
                    $player->setWeightKg($faker->numberBetween(65, 90));
                    $player->setPreferredFoot($faker->randomElement(['Droitier', 'Gaucher']));
                    $player->setMarketValue($faker->numberBetween(1000000, 120000000));
                    $player->setWeeklySalary($faker->numberBetween(15000, 400000));
                    $player->setReleaseClause($faker->numberBetween(5000000, 200000000));
                    $player->setContractStatus(PlayerContractStatusEnum::UNDER_CONTRACT);
                    
                    $player->setContractEndDate(\DateTimeImmutable::createFromMutable($faker->dateTimeBetween('+1 year', '+4 years')));
                    $player->setJoinedAt(\DateTimeImmutable::createFromMutable($faker->dateTimeBetween('-4 years', '-1 month')));
                    
                    $player->setMarketStatus(PlayerMarketStatusEnum::NOT_LISTED);
                    $player->setAvailabilityStatus(PlayerAvailabilityStatusEnum::NORMAL);

                    // Association directe sur l'entité Player
                    $player->setTeam($team);
                    $player->setClub($club);

                    $manager->persist($player);
                }

                // Flush par lots de 20 équipes pour garder une consommation RAM basse
                if (($i % $batchSize) === 0) {
                    $manager->flush();
                    $manager->clear(); 
                }
            }
        }

        $manager->flush();
        $manager->clear();
    }
}
