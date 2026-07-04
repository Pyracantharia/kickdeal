<?php

namespace App\Enum;

enum TransferNegociationStatusEnum: string
{
    case AGREED_CLUBS = 'agreed_clubs';
    case COMPLETED = 'completed';
    case COUNTER_OFFER = 'counter_offer';
    case EXPIRED = 'expired';
    case OPEN = 'open';
    case PENDING_AGENT = 'pending_agent';
    case PERMISSION_TO_SPEAK = 'permission_to_speak';
    case REJECTED = 'rejected';
}
