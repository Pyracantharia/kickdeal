<?php

namespace App\Enum;

use App\Entity\User;

enum SubscriptionPlanEnum: string
{
    case AGENT_FREE = 'agent_free';
    case AGENT_PRO = 'agent_pro';
    case CLUB_FREE = 'club_free';
    case CLUB_PRO = 'club_pro';
    case CLUB_ENTERPRISE = 'club_enterprise';

    public function isPro(): bool
    {
        return self::AGENT_PRO === $this || self::CLUB_PRO === $this || self::CLUB_ENTERPRISE === $this;
    }

    public function isAgentPlan(): bool
    {
        return self::AGENT_FREE === $this || self::AGENT_PRO === $this;
    }

    public function label(): string
    {
        return match ($this) {
            self::AGENT_FREE => 'Agent Free',
            self::AGENT_PRO => 'Agent Pro',
            self::CLUB_FREE => 'Club Free',
            self::CLUB_PRO => 'Club Pro',
            self::CLUB_ENTERPRISE => 'Club Enterprise',
        };
    }

    public function tier(): string
    {
        return match ($this) {
            self::CLUB_ENTERPRISE => 'enterprise',
            self::AGENT_PRO, self::CLUB_PRO => 'pro',
            self::AGENT_FREE, self::CLUB_FREE => 'free',
        };
    }

    public function clubSeatsIncluded(): ?int
    {
        return match ($this) {
            self::CLUB_FREE => 1,
            self::CLUB_PRO => 3,
            self::CLUB_ENTERPRISE => null,
            default => null,
        };
    }

    public function proPlan(): self
    {
        return $this->isAgentPlan() ? self::AGENT_PRO : self::CLUB_PRO;
    }

    public function enterprisePlan(): self
    {
        return $this->isAgentPlan() ? self::AGENT_PRO : self::CLUB_ENTERPRISE;
    }

    public static function defaultForUser(User $user): self
    {
        return in_array(User::ROLE_AGENT, $user->getRoles(), true) ? self::AGENT_FREE : self::CLUB_FREE;
    }
}