<?php

namespace App\DataFixtures\Faker\Provider;

use Faker\Generator;
use Faker\Provider\Base as BaseProvider;

class PlayerProvider extends BaseProvider
{
    private array $squad = [];

    public function __construct(Generator $generator)
    {
        parent::__construct($generator);
        
        // Récupère la racine du projet Symfony
        $projectDir = dirname(__DIR__, 4);
        $jsonPath = $projectDir . '/fixtures/json/psg_players.json';

        if (file_exists($jsonPath)) {
            $data = json_decode(file_get_contents($jsonPath), true);
            $this->squad = $data['squad'] ?? [];
        }
    }

    /**
     * Extrait une valeur du tableau 'squad' selon l'index de la boucle Alice
     * $current est l'index passé par Alice lors de la boucle {0..35}
     */
    public function psgSquadData($current, string $key): mixed
    {
        $index = (int)$current; // Assure que c'est un entier
        
        if (!isset($this->squad[$index])) {
            return null;
        }

        $player = $this->squad[$index];

        // Séparation propre Prénom / Nom
        if ($key === 'firstName' || $key === 'lastName') {
            $fullName = $player['name'] ?? '';
            $parts = explode(' ', $fullName, 2);

            if ($key === 'firstName') {
                return $parts[0] ?? '';
            }
            // Si le joueur n'a qu'un nom (ex: Marquinhos), on le met dans le lastName
            return isset($parts[1]) ? $parts[1] : $parts[0];
        }

        return $player[$key] ?? null;
    }

    /**
     * Parse une date de naissance du JSON et retourne un DateTime
     */
    public function parseBirthDate($current): ?\DateTime
    {
        $index = (int)$current;
        
        if (!isset($this->squad[$index])) {
            return null;
        }

        $dateStr = $this->squad[$index]['dateOfBirth'] ?? null;
        if (!$dateStr) {
            return null;
        }

        try {
            return new \DateTime($dateStr);
        } catch (\Exception) {
            return null;
        }
    }
}