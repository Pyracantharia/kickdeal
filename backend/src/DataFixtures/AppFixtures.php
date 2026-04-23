<?php

namespace App\DataFixtures;

use App\Entity\Team;
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

        $manager->flush();
    }
}
