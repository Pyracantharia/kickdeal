<?php

namespace App\DataFixtures;

final class EnrichmentDataProvider
{
    /** @var array<string, array{market_value_eur: string, weekly_salary_eur: string, joined_at_month: string, joined_at_year: string}>|null */
    private ?array $players = null;

    /** @var array<string, array{transfer_budget_eur: string}>|null */
    private ?array $teams = null;

    public function __construct(
        private readonly string $fixturesDir,
    ) {
    }

    /**
     * @return array{marketValue: int, weeklySalary: int, joinedAt: \DateTimeImmutable}|null
     */
    public function player(string $key): ?array
    {
        $this->load();
        $row = $this->players[$key] ?? null;

        if (null === $row) {
            return null;
        }

        return [
            'marketValue' => $this->eurosToCents($row['market_value_eur']),
            'weeklySalary' => $this->eurosToCents($row['weekly_salary_eur']),
            'joinedAt' => new \DateTimeImmutable(sprintf(
                '%04d-%02d-01',
                (int) $row['joined_at_year'],
                (int) $row['joined_at_month'],
            )),
        ];
    }

    /**
     * @return array{transferBudget: int}|null
     */
    public function team(string $key): ?array
    {
        $this->load();
        $row = $this->teams[$key] ?? null;

        if (null === $row) {
            return null;
        }

        return [
            'transferBudget' => $this->eurosToCents($row['transfer_budget_eur']),
        ];
    }

    private function load(): void
    {
        if (null !== $this->players && null !== $this->teams) {
            return;
        }

        $this->players = [];
        $this->teams = [];

        $completedDir = $this->fixturesDir.'/enrichment/templates-completed';
        if (!is_dir($completedDir)) {
            return;
        }

        foreach (glob($completedDir.'/*_completed.csv') ?: [] as $filePath) {
            $filename = basename($filePath);
            $rows = $this->readCsv($filePath);

            if (str_starts_with($filename, 'players_')) {
                foreach ($rows as $row) {
                    if (!isset($row['player_key'])) {
                        continue;
                    }

                    $this->players[$row['player_key']] = $row;
                }
                continue;
            }

            if (str_starts_with($filename, 'clubs_')) {
                foreach ($rows as $row) {
                    if (!isset($row['team_key'])) {
                        continue;
                    }

                    $this->teams[$row['team_key']] = $row;
                }
            }
        }
    }

    /**
     * @return list<array<string, string>>
     */
    private function readCsv(string $filePath): array
    {
        $handle = fopen($filePath, 'rb');
        if (false === $handle) {
            return [];
        }

        $headers = fgetcsv($handle, null, ',', '"', '');
        if (false === $headers) {
            fclose($handle);

            return [];
        }

        $headers[0] = preg_replace('/^\xEF\xBB\xBF/', '', (string) $headers[0]);
        $rows = [];

        while (false !== ($values = fgetcsv($handle, null, ',', '"', ''))) {
            $row = [];
            foreach ($headers as $index => $header) {
                $row[(string) $header] = (string) ($values[$index] ?? '');
            }
            $rows[] = $row;
        }

        fclose($handle);

        return $rows;
    }

    private function eurosToCents(string $value): int
    {
        $normalized = trim($value);
        if ('' === $normalized) {
            return 0;
        }

        return (int) round(((float) $normalized) * 100);
    }
}
