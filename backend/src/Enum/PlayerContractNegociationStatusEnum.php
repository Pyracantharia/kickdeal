<?php

namespace App\Enum;

enum PlayerContractNegociationStatusEnum: string
{
    case AGENT_ACCEPTED = 'agent_accepted';
    case COMPLETED = 'completed';
    case COUNTER_OFFER = 'counter_offer';
    case EXPIRED = 'expired';
    case OPEN = 'open';
    case PLAYER_ACCEPTED = 'player_accepted';
    case REJECTED = 'rejected';
    case SENT_TO_PLAYER = 'sent_to_player';
}
