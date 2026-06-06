<?php

namespace App\DataFixtures\Faker\Provider;

use Faker\Provider\Base as BaseProvider;

class PlayerProvider extends BaseProvider
{
    private static array $competitionData = [];

    private static int $teamIndex = 0;
    private static int $playerIndex = 0;
    private static ?string $currentCompetitionCode = null;

    /**
     * Charge dynamiquement les données d'une compétition (Dossier JSON)
     */
    public function loadCompetition(string $code): void
    {
        $this->loadCompetitionData($code);
    }

private function loadCompetitionData(string $code): void
    {
        $projectDir = realpath(__DIR__ . '/../../../../');
        $jsonPath = $projectDir . "/fixtures/json/{$code}/teams.json";

        // Si la compétition demandée est déjà chargée, on ne fait rien
        if (self::$currentCompetitionCode === $code && isset(self::$competitionData[$code])) {
            return;
        }

        // Si on change de compétition, on Reset obligatoirement les compteurs
        self::$competitionData[$code] = [
            'teams' => [],
            'players' => [],
        ];
        self::$teamIndex = 0;
        self::$playerIndex = 0;
        self::$currentCompetitionCode = $code;

        if (!file_exists($jsonPath)) {
            throw new \InvalidArgumentException(sprintf('Le fichier de compétition n\'existe pas : %s', $jsonPath));
        }

        $data = json_decode(file_get_contents($jsonPath), true);
        $teamsList = $data['teams'] ?? [];

        foreach ($teamsList as $teamKey => $teamData) {
            self::$competitionData[$code]['teams'][] = [
                'name' => $teamData['name'] ?? '',
                'country' => $teamData['area']['name'] ?? 'France',
                'logoUrl' => $teamData['crest'] ?? null,
            ];

            $squad = $teamData['squad'] ?? [];
            foreach ($squad as $playerData) {
                self::$competitionData[$code]['players'][] = [
                    'player' => $playerData,
                    'associatedTeamIndex' => $teamKey
                ];
            }
        }
    }

    // ========================================================
    // EXTRACTION DES DONNÉES D'ÉQUIPES
    // ========================================================
    public function competitionTeamData(string $key, ?string $code = null): mixed
    {
        if (null !== $code) {
            $this->loadCompetitionData($code);
        }

        $index = self::$teamIndex;

        // Alice lit séquentiellement. logoUrl (crest) étant la dernière propriété 
        // du bloc Team dans le YAML, on passe à l'index suivant juste après.
        if ($key === 'logoUrl') {
            self::$teamIndex++;
        }

        if (null === self::$currentCompetitionCode || !isset(self::$competitionData[self::$currentCompetitionCode]['teams'][$index])) {
            return null;
        }

        return self::$competitionData[self::$currentCompetitionCode]['teams'][$index][$key] ?? null;
    }

    // ========================================================
    // EXTRACTION DES DONNÉES DE JOUEURS
    // ========================================================
    public function competitionPlayerData(string $key, ?string $code = null): mixed
    {
        if (null !== $code) {
            $this->loadCompetitionData($code);
        }

        $index = self::$playerIndex;

        // Résolution des liaisons de clés étrangères pour @team_X et @club_X
        if ($key === 'associatedClubIndex' || $key === 'associatedTeamIndex') {
            $associatedIndex = self::$competitionData[self::$currentCompetitionCode]['players'][$index]['associatedTeamIndex'] ?? 0;
            
            // club est la dernière propriété lue du bloc Player dans le YAML.
            // Dès qu'elle est injectée, on passe au joueur suivant.
            if ($key === 'associatedClubIndex') {
                self::$playerIndex++; 
            }
            return $associatedIndex;
        }

        if (null === self::$currentCompetitionCode || !isset(self::$competitionData[self::$currentCompetitionCode]['players'][$index])) {
            return $key === 'firstName' || $key === 'lastName' ? 'Inconnu' : null;
        }

        $playerData = self::$competitionData[self::$currentCompetitionCode]['players'][$index]['player'];

        // Découpage propre du prénom et du nom
        if ($key === 'firstName' || $key === 'lastName') {
            $fullName = $playerData['name'] ?? '';
            $parts = explode(' ', $fullName, 2);

            if ($key === 'firstName') {
                return $parts[0] ?? 'Joueur';
            }
            return isset($parts[1]) ? $parts[1] : $parts[0];
        }

        if ($key === 'birthDate') {
            return $playerData['dateOfBirth'] ?? null;
        }

        return $playerData[$key] ?? null;
    }
}