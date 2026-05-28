<?php

namespace App\DataFixtures\Faker\Provider;

use Faker\Provider\Base as BaseProvider;

class PlayerProvider extends BaseProvider
{
    private array $teamsData = [];
    private array $playersData = [];

    private static int $teamIndex = 0;
    private static int $playerIndex = 0;

    public function __construct()
    {
        $projectDir = realpath(__DIR__ . '/../../../../');
        $jsonDir = $projectDir . '/fixtures/json/';

        if (file_exists($jsonDir . 'ligue1_teams.json')) {
            $this->teamsData = json_decode(file_get_contents($jsonDir . 'ligue1_teams.json'), true)['teams'] ?? [];
        }

        foreach ($this->teamsData as $teamIndex => $team) {
            foreach (($team['squad'] ?? []) as $player) {
                $fullName = $player['name'] ?? '';
                $parts = preg_split('/\s+/', trim($fullName), 2) ?: [];

                $this->playersData[] = [
                    'teamIndex' => $teamIndex,
                    'clubIndex' => $teamIndex,
                    'firstName' => $parts[0] ?? 'Joueur',
                    'lastName' => $parts[1] ?? ($parts[0] ?? 'Inconnu'),
                    'birthDate' => isset($player['dateOfBirth'])
                        ? new \DateTimeImmutable($player['dateOfBirth'])
                        : new \DateTimeImmutable('-25 years'),
                    'nationality' => $player['nationality'] ?? null,
                    'position' => $player['position'] ?? 'Offence',
                ];
            }
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

    public function teamSquadData(string $key): mixed
    {
        $index = self::$playerIndex;

        if (!isset($this->playersData[$index])) {
            return null;
        }

        $player = $this->playersData[$index];

        return match ($key) {
            'firstName' => $player['firstName'] ?? '',
            'lastName' => $player['lastName'] ?? '',
            'birthDate' => $player['birthDate'] ?? new \DateTimeImmutable('-25 years'),
            'nationality' => $player['nationality'] ?? null,
            'position' => $player['position'] ?? 'Offence',
            default => null,
        };
    }

    public function playerTeamIndex(): int
    {
        return $this->playersData[self::$playerIndex]['teamIndex'] ?? 0;
    }

    public function playerClubIndex(): int
    {
        $index = $this->playersData[self::$playerIndex]['clubIndex'] ?? 0;

        self::$playerIndex++;

        return $index;
    }
}