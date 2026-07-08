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
    case PENDING_SELLER_CLUB = 'pending_seller_club';
    case PERMISSION_TO_SPEAK = 'permission_to_speak';
    case REJECTED = 'rejected';
    case SELLER_CLUB_EXTERNAL_CONTACTED = 'seller_club_external_contacted';
    case SELLER_CLUB_INVITED = 'seller_club_invited';
}
