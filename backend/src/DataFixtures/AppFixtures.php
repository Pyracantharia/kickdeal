<?php

namespace App\DataFixtures;

use App\Entity\Player;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class AppFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        // Charge les joueurs depuis le JSON du PSG
        $this->loadPSGPlayers($manager);
    }

    private function loadPSGPlayers(ObjectManager $manager): void
    {
        $jsonPath = dirname(__DIR__, 2) . '/fixtures/json/psg_players.json';
        
        if (!file_exists($jsonPath)) {
            return;
        }

        $data = json_decode(file_get_contents($jsonPath), true);
        $squad = $data['squad'] ?? [];

        foreach ($squad as $playerData) {
            $player = (new Player())
                ->setFirstName($this->extractFirstName($playerData['name']))
                ->setLastName($this->extractLastName($playerData['name']))
                ->setPhotoUrl('https://via.placeholder.com/200x200?text=' . urlencode($playerData['name']))
                ->setBirthDate(new \DateTimeImmutable($playerData['dateOfBirth']))
                ->setNationality($playerData['nationality'])
                ->setPosition($playerData['position'])
                ->setHeightCm(rand(170, 195))
                ->setWeightKg(rand(65, 90))
                ->setPreferredFoot(['Droit', 'Gauche', 'Ambidextre'][array_rand(['Droit', 'Gauche', 'Ambidextre'])])
                ->setMarketValue(rand(5000000, 90000000))
                ->setWeeklySalary(rand(15000, 300000))
                ->setReleaseClause(rand(20000000, 150000000))
                ->setContractStatus(\App\Enum\PlayerContractStatusEnum::UNDER_CONTRACT)
                ->setContractEndDate(\DateTimeImmutable::createFromFormat('Y-m-d', date('Y-m-d', strtotime('+' . rand(1, 3) . ' years'))))
                ->setJoinedAt(\DateTimeImmutable::createFromFormat('Y-m-d', date('Y-m-d', strtotime('-' . rand(1, 3) . ' years'))))
                ->setMarketStatus(\App\Enum\PlayerMarketStatusEnum::NOT_LISTED)
                ->setAvailabilityStatus(\App\Enum\PlayerAvailabilityStatusEnum::NORMAL);

            $manager->persist($player);
        }

        $manager->flush();
    }

    private function extractFirstName(string $fullName): string
    {
        $parts = explode(' ', $fullName, 2);
        return $parts[0] ?? '';
    }

    private function extractLastName(string $fullName): string
    {
        $parts = explode(' ', $fullName, 2);
        return isset($parts[1]) ? $parts[1] : $parts[0];
    }
}
