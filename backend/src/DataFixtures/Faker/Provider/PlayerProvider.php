<?php

namespace App\DataFixtures\Faker\Provider;

use Faker\Provider\Base as BaseProvider;

class PlayerProvider extends BaseProvider
{
    private array $teams = [];
    private array $players = [];

    private static int $teamIndex = 0;
    private static int $playerIndex = 0;

    /**
     * Charge dynamiquement les données d'une compétition (Dossier JSON)
     */
    public function loadCompetition(string $code): void
    {
        $projectDir = realpath(__DIR__ . '/../../../../');
        $jsonPath = $projectDir . "/fixtures/json/{$code}/teams.json";

        // Réinitialisation complète des compteurs et de la mémoire à chaque nouvelle ligue
        $this->teams = [];
        $this->players = [];
        self::$teamIndex = 0;
        self::$playerIndex = 0;

        if (!file_exists($jsonPath)) {
            throw new \InvalidArgumentException(sprintf('Le fichier de compétition n\'existe pas : %s', $jsonPath));
        }

        $data = json_decode(file_get_contents($jsonPath), true);
        $teamsList = $data['teams'] ?? [];

        foreach ($teamsList as $teamKey => $teamData) {
            // Extraction et stockage des informations de l'équipe
            $this->teams[] = [
                'name' => $teamData['name'] ?? '',
                'country' => $teamData['area']['name'] ?? 'France',
                'logoUrl' => $teamData['crest'] ?? null,
            ];

            // Aplatissement et stockage de tous les joueurs de l'équipe
            $squad = $teamData['squad'] ?? [];
            foreach ($squad as $playerData) {
                $this->players[] = [
                    'player' => $playerData,
                    'associatedTeamIndex' => $teamKey // Index correspondant à la boucle de fixtures Alice
                ];
            }
        }
    }

    // ========================================================
    // EXTRACTION DES DONNÉES D'ÉQUIPES
    // ========================================================
    public function competitionTeamData(string $key): mixed
    {
        $index = self::$teamIndex;

        // Alice lit séquentiellement. logoUrl (crest) étant la dernière propriété 
        // du bloc Team dans le YAML, on passe à l'index suivant juste après.
        if ($key === 'logoUrl') {
            self::$teamIndex++;
        }

        if (!isset($this->teams[$index])) {
            return null;
        }

        return $this->teams[$index][$key] ?? null;
    }

    // ========================================================
    // EXTRACTION DES DONNÉES DE JOUEURS
    // ========================================================
    public function competitionPlayerData(string $key): mixed
    {
        $index = self::$playerIndex;

        // Résolution des liaisons de clés étrangères pour @team_X et @club_X
        if ($key === 'associatedClubIndex' || $key === 'associatedTeamIndex') {
            $associatedIndex = $this->players[$index]['associatedTeamIndex'] ?? 0;
            
            // club est la dernière propriété lue du bloc Player dans le YAML.
            // Dès qu'elle est injectée, on passe au joueur suivant.
            if ($key === 'associatedClubIndex') {
                self::$playerIndex++; 
            }
            return $associatedIndex;
        }

        if (!isset($this->players[$index])) {
            return $key === 'firstName' || $key === 'lastName' ? 'Inconnu' : null;
        }

        $playerData = $this->players[$index]['player'];

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