<?php

namespace App\DataFixtures;

use App\Entity\Team;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class TeamFixtures extends Fixture
{
    public const TEAMS = [
        [
            'name' => 'Paris Saint-Germain',
            'country' => 'France',
            'league' => 'Ligue 1',
            'logoUrl' => 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a7/Paris_Saint-Germain_F.C..svg/1200px-Paris_Saint-Germain_F.C..svg.png',
            'transferBudget' => 200000000,
            'verificationStatus' => \App\Enum\TeamVerificationStatusEnum::VERIFIED,
        ],
        [
            'name' => 'Manchester United',
            'country' => 'England',
            'league' => 'Premier League',
            'logoUrl' => 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/Manchester_United_FC_crest.svg/1200px-Manchester_United_FC_crest.svg.png',
            'transferBudget' => 150000000,
            'verificationStatus' => \App\Enum\TeamVerificationStatusEnum::VERIFIED,
        ],
        [
            'name' => 'Real Madrid',
            'country' => 'Spain',
            'league' => 'La Liga',
            'logoUrl' => 'https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/1200px-Real_Madrid_CF.svg.png',
            'transferBudget' => 250000000,
            'verificationStatus' => \App\Enum\TeamVerificationStatusEnum::VERIFIED,
        ],
    ];

    public function load(ObjectManager $manager): void
    {
        foreach (self::TEAMS as $teamData) {
            $team = (new Team())
                ->setName($teamData['name'])
                ->setCountry($teamData['country'])
                ->setLeague($teamData['league'])
                ->setLogoUrl($teamData['logoUrl'])
                ->setTransferBudget($teamData['transferBudget'])
                ->setVerificationStatus($teamData['verificationStatus']);

            $manager->persist($team);
            $this->addReference('team_' . strtolower(str_replace(' ', '_', $teamData['name'])), $team);
        }

        $manager->flush();
    }
}