<?php

namespace App\DataFixtures\Faker\Provider;

use Symfony\Component\HttpKernel\KernelInterface;

class FootballPlayerProvider
{
    private array $players = [];
    private string $projectDir;

    public function __construct(KernelInterface $kernel)
    {
        $this->projectDir = $kernel->getProjectDir();
    }

    public function getPlayerData(string|int $indexOrKey): array
    {
        // Extraire le numéro si c'est une clé comme "player_0"
        if (is_string($indexOrKey)) {
            preg_match('/(\d+)/', $indexOrKey, $matches);
            $index = (int) ($matches[1] ?? 0);
        } else {
            $index = $indexOrKey;
        }

        if (empty($this->players)) {
            $jsonPath = $this->projectDir . '/data/fixtures/players.json';

            if (!file_exists($jsonPath)) {
                throw new \Exception("Le fichier JSON est introuvable à l'adresse : " . $jsonPath);
            }

            $content = file_get_contents($jsonPath);
            $data = json_decode($content, true);

            $this->players = $data['player'] ?? [];

            if (empty($this->players)) {
                throw new \Exception("Aucun joueur trouvé dans le fichier JSON (clé 'player' manquante ou vide).");
            }
        }

        return $this->players[$index % count($this->players)];
    }

    public function getPlayerFirstName(array $apiData): string
    {
        return str_replace(" " . ($apiData["strLastName"] ?? ""), "", $apiData["strPlayer"] ?? "");
    }

    public function getPlayerLastName(array $apiData): string
    {
        return $apiData["strLastName"] ?? "N/A";
    }

    public function getPlayerPosition(array $apiData): string
    {
        return $apiData["strPosition"] ?? "Unknown";
    }

    public function getPlayerBirthDate(array $apiData): \DateTime
    {
        return new \DateTime($apiData["dateBorn"] ?? "2000-01-01");
    }
}