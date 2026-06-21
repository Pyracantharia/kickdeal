<?php

namespace App\Service\Player;

use App\Entity\Player;
use App\Enum\PlayerContractStatusEnum;
use App\Enum\PlayerMarketAuthorizationStatusEnum;
use App\Enum\PlayerMarketListingSourceEnum;
use App\Enum\PlayerMarketStatusEnum;

final class PlayerMarketContextResolver
{
    /**
     * @return array{
     *   state: 'none'|'pending'|'accepted'|'refused'|'listed_by_club'|'free',
     *   contractState: 'under_contract'|'free_agent',
     *   canAgentProspect: bool,
     *   canAgentSetMarketStatus: bool,
     *   requiresClubAuthorization: bool,
     *   authorizationStatus: ?string,
     *   listingSource: ?string,
     *   message: string,
     *   actionLabel: ?string,
     *   isListedByClub: bool,
     *   isFreePlayer: bool
     * }
     */
    public function resolve(Player $player): array
    {
        $isFreePlayer = PlayerContractStatusEnum::FREE_AGENT === $player->getContractStatus() || null === $player->getTeam();
        $isListedByClub = PlayerMarketListingSourceEnum::CLUB === $player->getMarketListingSource()
            && $this->isListed($player);

        if ($isFreePlayer) {
            return [
                'state' => 'free',
                'contractState' => PlayerContractStatusEnum::FREE_AGENT->value,
                'canAgentProspect' => true,
                'canAgentSetMarketStatus' => true,
                'requiresClubAuthorization' => false,
                'authorizationStatus' => null,
                'listingSource' => $player->getMarketListingSource()?->value,
                'message' => 'Joueur libre : vous pouvez le proposer directement.',
                'actionLabel' => null,
                'isListedByClub' => false,
                'isFreePlayer' => true,
            ];
        }

        if ($isListedByClub) {
            return [
                'state' => 'listed_by_club',
                'contractState' => PlayerContractStatusEnum::UNDER_CONTRACT->value,
                'canAgentProspect' => true,
                'canAgentSetMarketStatus' => false,
                'requiresClubAuthorization' => false,
                'authorizationStatus' => $player->getMarketAuthorizationStatus()?->value,
                'listingSource' => PlayerMarketListingSourceEnum::CLUB->value,
                'message' => 'Votre joueur a été mis sur le marché par son club.',
                'actionLabel' => null,
                'isListedByClub' => true,
                'isFreePlayer' => false,
            ];
        }

        return match ($player->getMarketAuthorizationStatus()) {
            PlayerMarketAuthorizationStatusEnum::PENDING => [
                'state' => 'pending',
                'contractState' => PlayerContractStatusEnum::UNDER_CONTRACT->value,
                'canAgentProspect' => false,
                'canAgentSetMarketStatus' => false,
                'requiresClubAuthorization' => true,
                'authorizationStatus' => PlayerMarketAuthorizationStatusEnum::PENDING->value,
                'listingSource' => $player->getMarketListingSource()?->value,
                'message' => 'En attente de décision du club',
                'actionLabel' => null,
                'isListedByClub' => false,
                'isFreePlayer' => false,
            ],
            PlayerMarketAuthorizationStatusEnum::APPROVED => [
                'state' => 'accepted',
                'contractState' => PlayerContractStatusEnum::UNDER_CONTRACT->value,
                'canAgentProspect' => true,
                'canAgentSetMarketStatus' => true,
                'requiresClubAuthorization' => false,
                'authorizationStatus' => PlayerMarketAuthorizationStatusEnum::APPROVED->value,
                'listingSource' => $player->getMarketListingSource()?->value,
                'message' => 'Autorisation accordée',
                'actionLabel' => null,
                'isListedByClub' => false,
                'isFreePlayer' => false,
            ],
            PlayerMarketAuthorizationStatusEnum::REJECTED => [
                'state' => 'refused',
                'contractState' => PlayerContractStatusEnum::UNDER_CONTRACT->value,
                'canAgentProspect' => false,
                'canAgentSetMarketStatus' => false,
                'requiresClubAuthorization' => true,
                'authorizationStatus' => PlayerMarketAuthorizationStatusEnum::REJECTED->value,
                'listingSource' => $player->getMarketListingSource()?->value,
                'message' => 'Autorisation refusée',
                'actionLabel' => 'Demander l’autorisation',
                'isListedByClub' => false,
                'isFreePlayer' => false,
            ],
            default => [
                'state' => 'none',
                'contractState' => PlayerContractStatusEnum::UNDER_CONTRACT->value,
                'canAgentProspect' => false,
                'canAgentSetMarketStatus' => false,
                'requiresClubAuthorization' => true,
                'authorizationStatus' => null,
                'listingSource' => $player->getMarketListingSource()?->value,
                'message' => 'Ce joueur est sous contrat. Vous devez obtenir l’autorisation du club actuel avant de le proposer.',
                'actionLabel' => 'Demander l’autorisation',
                'isListedByClub' => false,
                'isFreePlayer' => false,
            ],
        };
    }

    public function canClubManagePlayer(Player $player, ?string $teamId): bool
    {
        return null !== $teamId && $player->getTeam()?->getId()?->toRfc4122() === $teamId;
    }

    public function isListed(Player $player): bool
    {
        return in_array($player->getMarketStatus(), [
            PlayerMarketStatusEnum::ON_MARKET,
            PlayerMarketStatusEnum::LOAN_LISTED,
        ], true);
    }
}
