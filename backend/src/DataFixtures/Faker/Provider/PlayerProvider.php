<?php

namespace App\DataFixtures\Faker\Provider;

use Faker\Provider\Base as BaseProvider;

class PlayerProvider extends BaseProvider
{
    private array $teamsData = [];
    private array $scorersData = [];

    private static int $teamIndex = 0;
    private static int $scorerIndex = 0;

    public function __construct()
    {
        $projectDir = realpath(__DIR__ . '/../../../../');
        $jsonDir = $projectDir . '/fixtures/json/';

        if (file_exists($jsonDir . 'ligue1_teams.json')) {
            $this->teamsData = json_decode(file_get_contents($jsonDir . 'ligue1_teams.json'), true)['teams'] ?? [];
        }

        if (file_exists($jsonDir . 'ligue1_scorers.json')) {
            $this->scorersData = json_decode(file_get_contents($jsonDir . 'ligue1_scorers.json'), true)['scorers'] ?? [];
        }
    }

    public function ligue1TeamData(string $key): mixed
    {
        $index = self::$teamIndex;

        // On passe à l'index suivant dès qu'on traite la dernière propriété de l'entité Team dans le YAML
        if ($key === 'logoUrl') {
            self::$teamIndex++;
        }

        if (!isset($this->teamsData[$index])) {
            return $key === 'name' ? 'Club Fictif ' . $index : '';
        }

        $team = $this->teamsData[$index];

        return match ($key) {
            'name' => $team['name'] ?? '',
            'country' => $team['area']['name'] ?? 'France',
            'logoUrl' => $team['crest'] ?? null,
            default => null,
        };
    }

    public function scorerData(string $key): mixed
    {
        $index = self::$scorerIndex;

        if ($key === 'position') {
            self::$scorerIndex++;
        }

        if (!isset($this->scorersData[$index])) {
            return null;
        }

        $scorer = $this->scorersData[$index];

        return match ($key) {
            'firstName' => $scorer['player']['firstName'] ?? '',
            'lastName' => $scorer['player']['lastName'] ?? '',
            'birthDate' => isset($scorer['player']['dateOfBirth'])
            ? new \DateTimeImmutable($scorer['player']['dateOfBirth'])
            : new \DateTimeImmutable('-25 years'),
            'nationality' => $scorer['player']['nationality'] ?? null,
            'position' => $scorer['player']['section'] ?? 'Offence',
            default => null,
        };
    }
}