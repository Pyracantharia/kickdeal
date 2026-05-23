<?php

namespace App\Service\Subscription;

use App\Entity\Team;
use App\Entity\User;
use App\Enum\SubscriptionPlanEnum;
use App\Repository\TeamMembershipRepository;
use App\Repository\Transfer\TransferNegociationRepository;
use App\Repository\Transfer\TransferOfferRepository;

class SubscriptionLimits
{
    private const int CLUB_FREE_OFFER_LIMIT = 1;
    private const int CLUB_FREE_ACTIVE_NEGOTIATION_LIMIT = 2;
    private const int AGENT_FREE_PLAYER_LIMIT = 3;

    public function __construct(
        private readonly TeamMembershipRepository $teamMembershipRepository,
        private readonly TransferOfferRepository $transferOfferRepository,
        private readonly TransferNegociationRepository $transferNegociationRepository,
    ) {
    }

    public function getSummary(User $user): array
    {
        $plan = $user->getSubscriptionPlan();
        $team = $this->teamMembershipRepository->findPrimaryForUser($user)?->getTeam();

        if ($plan->isAgentPlan()) {
            return $this->getAgentSummary($plan);
        }

        return $this->getClubSummary($plan, $team);
    }

    public function canCreateClubOffer(User $user): bool
    {
        $plan = $user->getSubscriptionPlan();

        if ($plan->isPro()) {
            return true;
        }

        $team = $this->teamMembershipRepository->findPrimaryForUser($user)?->getTeam();

        if (!$team instanceof Team) {
            return false;
        }

        return $this->transferOfferRepository->countSentByTeam($team) < self::CLUB_FREE_OFFER_LIMIT;
    }

    private function getClubSummary(SubscriptionPlanEnum $plan, ?Team $team): array
    {
        $offersUsed = $team instanceof Team ? $this->transferOfferRepository->countSentByTeam($team) : 0;
        $activeNegotiations = $team instanceof Team ? $this->transferNegociationRepository->countActiveForTeam($team) : 0;
        $seatsUsed = $team instanceof Team ? $this->teamMembershipRepository->countByTeam($team) : 0;
        $seatsIncluded = $plan->clubSeatsIncluded();
        $isPro = $plan->isPro();

        return [
            'audience' => 'club',
            'plan' => $plan->value,
            'planLabel' => $plan->label(),
            'tier' => $plan->tier(),
            'isPro' => $isPro,
            'seats' => [
                'used' => $seatsUsed,
                'included' => $seatsIncluded,
                'unlimited' => null === $seatsIncluded,
            ],
            'limits' => [
                $this->seatLimit($seatsUsed, $seatsIncluded),
                $this->limit('club_free_offer', 'Offre / approche gratuite', $offersUsed, $isPro ? null : self::CLUB_FREE_OFFER_LIMIT),
                $this->limit('active_negotiations', 'Négociations actives', $activeNegotiations, $isPro ? null : self::CLUB_FREE_ACTIVE_NEGOTIATION_LIMIT),
                $this->limit('pdf_access', 'PDF d’accord', null, $isPro ? null : 0),
                $this->limit('roster_management', 'Gestion d’effectif', null, $isPro ? null : 5, 'joueurs'),
            ],
            'proBenefits' => [
                'Négociations illimitées',
                'Gestion effectif complète',
                'PDF officiels',
                'Historique complet',
                'Multi-utilisateurs',
                'Permissions avancées avec Club Enterprise',
                'Analytics avancés avec Club Enterprise',
            ],
            'canCreateOffer' => $isPro || $offersUsed < self::CLUB_FREE_OFFER_LIMIT,
            'upgradeCta' => 'Passer à Club Pro — 200 €/mois',
            'enterpriseCta' => 'Passer à Club Enterprise — 400 €/mois',
            'manageCta' => 'Gérer l’abonnement',
        ];
    }

    private function getAgentSummary(SubscriptionPlanEnum $plan): array
    {
        $isPro = $plan->isPro();

        return [
            'audience' => 'agent',
            'plan' => $plan->value,
            'planLabel' => $plan->label(),
            'tier' => $plan->tier(),
            'isPro' => $isPro,
            'seats' => null,
            'limits' => [
                $this->limit('represented_players', 'Joueurs représentés', 0, $isPro ? null : self::AGENT_FREE_PLAYER_LIMIT, 'joueurs'),
                $this->limit('direct_club_contacts', 'Contacts directs clubs', 0, $isPro ? null : 0),
            ],
            'proBenefits' => [
                'Proposer activement ses joueurs aux clubs',
                'Mettre des joueurs sur le marché',
                'Contacter directement les clubs',
                'Joueurs représentés illimités',
                'Visibilité renforcée',
            ],
            'canCreateOffer' => true,
            'upgradeCta' => 'Passer à Agent Pro — 49 €/mois',
            'enterpriseCta' => null,
            'manageCta' => 'Gérer l’abonnement',
        ];
    }

    private function seatLimit(int $used, ?int $included): array
    {
        return [
            'key' => 'club_seats',
            'label' => 'Utilisateurs club',
            'used' => $used,
            'limit' => $included,
            'remaining' => null === $included ? null : max(0, $included - $used),
            'unit' => 'utilisateurs',
            'isLimited' => null !== $included,
            'unlimited' => null === $included,
        ];
    }

    private function limit(string $key, string $label, ?int $used, ?int $limit, ?string $unit = null): array
    {
        return [
            'key' => $key,
            'label' => $label,
            'used' => $used,
            'limit' => $limit,
            'remaining' => null === $limit || null === $used ? null : max(0, $limit - $used),
            'unit' => $unit,
            'isLimited' => null !== $limit,
        ];
    }
}