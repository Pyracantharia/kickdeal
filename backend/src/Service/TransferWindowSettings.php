<?php

namespace App\Service;

use App\Repository\ReferenceDataItemRepository;

final class TransferWindowSettings
{
    private const string PARAMETER_CODE = 'transfer_windows';
    private const string DEFAULT_SUMMER_START = '06-10';
    private const string DEFAULT_SUMMER_END = '08-30';

    public function __construct(private readonly ReferenceDataItemRepository $items)
    {
    }

    public function status(?\DateTimeImmutable $referenceDate = null): array
    {
        $referenceDate ??= new \DateTimeImmutable('now');
        $windows = $this->windowsAround((int) $referenceDate->format('Y'));
        $timestamp = $referenceDate->setTime(12, 0)->getTimestamp();

        foreach ($windows as $window) {
            if ($timestamp >= $window['start']->getTimestamp() && $timestamp <= $window['end']->getTimestamp()) {
                $daysRemaining = $this->daysBetween($referenceDate, $window['end']);

                return [
                    'isOpen' => true,
                    'name' => $window['name'],
                    'label' => sprintf(
                        'Le %s actuel se termine dans %d jour%s',
                        $window['name'],
                        $daysRemaining,
                        $daysRemaining > 1 ? 's' : '',
                    ),
                    'daysRemaining' => $daysRemaining,
                    'startDate' => $window['start']->format('Y-m-d'),
                    'endDate' => $window['end']->format('Y-m-d'),
                ];
            }
        }

        $nextWindow = null;
        foreach ($windows as $window) {
            if ($window['start']->getTimestamp() > $timestamp) {
                $nextWindow = $window;
                break;
            }
        }
        $nextWindow ??= $this->windowsForYear((int) $referenceDate->format('Y') + 2)[0];
        $daysUntilOpen = $this->daysBetween($referenceDate, $nextWindow['start']);

        return [
            'isOpen' => false,
            'name' => $nextWindow['name'],
            'label' => sprintf(
                'La prochaine fenêtre de mercato ouvre dans %d jour%s',
                $daysUntilOpen,
                $daysUntilOpen > 1 ? 's' : '',
            ),
            'daysUntilOpen' => $daysUntilOpen,
            'startDate' => $nextWindow['start']->format('Y-m-d'),
            'endDate' => $nextWindow['end']->format('Y-m-d'),
        ];
    }

    public function validateValue(array $value): ?string
    {
        $windows = $this->summerWindows($value);
        $years = [];

        foreach ($windows as $window) {
            $year = $window['year'] ?? null;
            $startDate = $window['startDate'] ?? null;
            $endDate = $window['endDate'] ?? null;

            if (!is_int($year) || $year < 2000 || $year > 2100) {
                return 'Année de mercato invalide.';
            }

            if (!is_string($startDate) || !is_string($endDate)) {
                return 'Les dates du mercato estival sont invalides.';
            }

            $start = $this->parseDate($startDate);
            $end = $this->parseDate($endDate);

            if (!$start || !$end || $start->format('Y') !== (string) $year || $end->format('Y') !== (string) $year) {
                return 'Les dates doivent correspondre à l’année configurée.';
            }

            if ($end < $start) {
                return 'La date de fin du mercato estival doit être après la date de début.';
            }

            if (isset($years[$year])) {
                return 'Une seule plage estivale peut être configurée par année.';
            }

            $years[$year] = true;
        }

        return null;
    }

    private function windowsAround(int $year): array
    {
        $windows = [
            ...$this->windowsForYear($year - 1),
            ...$this->windowsForYear($year),
            ...$this->windowsForYear($year + 1),
        ];

        usort($windows, static fn (array $left, array $right): int => $left['start'] <=> $right['start']);

        return $windows;
    }

    private function windowsForYear(int $year): array
    {
        [$summerStart, $summerEnd] = $this->summerDatesForYear($year);

        return [
            [
                'name' => 'mercato hivernal',
                'start' => new \DateTimeImmutable(sprintf('%d-01-01 00:00:00', $year)),
                'end' => new \DateTimeImmutable(sprintf('%d-01-31 23:59:59', $year)),
            ],
            [
                'name' => 'mercato estival',
                'start' => $summerStart,
                'end' => $summerEnd,
            ],
        ];
    }

    private function summerDatesForYear(int $year): array
    {
        $settings = $this->items->findOneBy([
            'type' => 'business_parameter',
            'code' => self::PARAMETER_CODE,
            'active' => true,
        ]);
        $value = $settings?->getValue() ?? [];

        foreach ($this->summerWindows($value) as $window) {
            if (($window['year'] ?? null) === $year) {
                $start = $this->parseDate((string) ($window['startDate'] ?? ''));
                $end = $this->parseDate((string) ($window['endDate'] ?? ''));

                if ($start && $end && $end >= $start) {
                    return [$start->setTime(0, 0), $end->setTime(23, 59, 59)];
                }
            }
        }

        return [
            new \DateTimeImmutable(sprintf('%d-%s 00:00:00', $year, self::DEFAULT_SUMMER_START)),
            new \DateTimeImmutable(sprintf('%d-%s 23:59:59', $year, self::DEFAULT_SUMMER_END)),
        ];
    }

    private function summerWindows(array $value): array
    {
        $windows = $value['summerWindows'] ?? [];

        return is_array($windows) ? array_values(array_filter($windows, static fn (mixed $window): bool => is_array($window))) : [];
    }

    private function parseDate(string $date): ?\DateTimeImmutable
    {
        $parsed = \DateTimeImmutable::createFromFormat('!Y-m-d', $date);

        return $parsed instanceof \DateTimeImmutable ? $parsed : null;
    }

    private function daysBetween(\DateTimeImmutable $from, \DateTimeImmutable $to): int
    {
        $fromDay = $from->setTime(0, 0);
        $toDay = $to->setTime(0, 0);

        return max(0, (int) $fromDay->diff($toDay)->format('%a'));
    }
}
