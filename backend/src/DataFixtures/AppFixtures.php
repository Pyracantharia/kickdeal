<?php

namespace App\DataFixtures;

use App\Entity\Player;
use App\Entity\Team;
use App\Enum\PlayerAvailabilityStatusEnum;
use App\Enum\PlayerContractStatusEnum;
use App\Enum\PlayerMarketStatusEnum;
use App\Enum\TeamVerificationStatusEnum;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class AppFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        $realMadrid = (new Team())
            ->setName('Real Madrid')
            ->setCountry('Espagne')
            ->setLeague('La Liga')
            ->setLogoUrl('https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg')
            ->setVerificationStatus(TeamVerificationStatusEnum::VERIFIED);

        $manager->persist($realMadrid);

        $players = [
            [
                'firstName' => 'Kylian',
                'lastName' => 'Mbappe',
                'photoUrl' => 'https://commons.wikimedia.org/wiki/Special:FilePath/Kylian%20Mbapp%C3%A9%20(cropped).jpg',
                'birthDate' => '1998-12-20',
                'nationality' => 'France',
                'position' => 'BU',
                'heightCm' => 178,
                'weightKg' => 77,
                'preferredFoot' => 'Droit',
                'marketValue' => 180_000_000_00,
                'weeklySalary' => 300_000_00,
                'releaseClause' => null,
                'contractEndDate' => '2028-06-30',
                'joinedAt' => '2024-07-01',
                'marketStatus' => PlayerMarketStatusEnum::ON_MARKET,
                'availabilityStatus' => PlayerAvailabilityStatusEnum::NORMAL,
            ],
            [
                'firstName' => 'Federico',
                'lastName' => 'Valverde',
                'photoUrl' => 'https://commons.wikimedia.org/wiki/Special:FilePath/Federico%20Valverde%202021%20(cropped).jpg',
                'birthDate' => '1998-07-22',
                'nationality' => 'Uruguay',
                'position' => 'MC',
                'heightCm' => 182,
                'weightKg' => 76,
                'preferredFoot' => 'Droit',
                'marketValue' => 100_000_000_00,
                'weeklySalary' => 200_000_00,
                'releaseClause' => null,
                'contractEndDate' => '2029-06-30',
                'joinedAt' => '2016-11-23',
                'marketStatus' => PlayerMarketStatusEnum::NOT_LISTED,
                'availabilityStatus' => PlayerAvailabilityStatusEnum::NORMAL,
            ],
            [
                'firstName' => 'Ferland',
                'lastName' => 'Mendy',
                'photoUrl' => 'https://commons.wikimedia.org/wiki/Special:FilePath/OL-MHSC%20(2017)%20-%20Ferland%20Mendy.jpg',
                'birthDate' => '1995-06-08',
                'nationality' => 'France',
                'position' => 'DG',
                'heightCm' => 180,
                'weightKg' => 73,
                'preferredFoot' => 'Gauche',
                'marketValue' => 22_000_000_00,
                'weeklySalary' => 150_000_00,
                'releaseClause' => null,
                'contractEndDate' => '2027-06-30',
                'joinedAt' => '2019-07-01',
                'marketStatus' => PlayerMarketStatusEnum::LOAN_LISTED,
                'availabilityStatus' => PlayerAvailabilityStatusEnum::NORMAL,
            ],
            [
                'firstName' => 'Thibaut',
                'lastName' => 'Courtois',
                'photoUrl' => 'https://commons.wikimedia.org/wiki/Special:FilePath/Thibaut%20Courtois%20-%2002.jpg',
                'birthDate' => '1992-05-11',
                'nationality' => 'Belgique',
                'position' => 'GB',
                'heightCm' => 200,
                'weightKg' => 96,
                'preferredFoot' => 'Gauche',
                'marketValue' => 25_000_000_00,
                'weeklySalary' => 180_000_00,
                'releaseClause' => null,
                'contractEndDate' => '2027-06-30',
                'joinedAt' => '2018-08-09',
                'marketStatus' => PlayerMarketStatusEnum::NOT_LISTED,
                'availabilityStatus' => PlayerAvailabilityStatusEnum::INJURED,
            ],
        ];

        foreach ($players as $playerData) {
            $player = (new Player())
                ->setFirstName($playerData['firstName'])
                ->setLastName($playerData['lastName'])
                ->setPhotoUrl($playerData['photoUrl'])
                ->setBirthDate(new \DateTimeImmutable($playerData['birthDate']))
                ->setNationality($playerData['nationality'])
                ->setPosition($playerData['position'])
                ->setHeightCm($playerData['heightCm'])
                ->setWeightKg($playerData['weightKg'])
                ->setPreferredFoot($playerData['preferredFoot'])
                ->setMarketValue($playerData['marketValue'])
                ->setWeeklySalary($playerData['weeklySalary'])
                ->setReleaseClause($playerData['releaseClause'])
                ->setContractStatus(PlayerContractStatusEnum::UNDER_CONTRACT)
                ->setContractEndDate(new \DateTimeImmutable($playerData['contractEndDate']))
                ->setJoinedAt(new \DateTimeImmutable($playerData['joinedAt']))
                ->setMarketStatus($playerData['marketStatus'])
                ->setAvailabilityStatus($playerData['availabilityStatus'])
                ->setTeam($realMadrid);

            $manager->persist($player);
        }

        $manager->flush();
    }
}
