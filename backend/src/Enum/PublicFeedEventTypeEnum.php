<?php

namespace App\Enum;

enum PublicFeedEventTypeEnum: string
{
    case AGREEMENT = 'agreement';
    case CONTRACT_SIGNED = 'contract_signed';
    case CONTRACT_RENEWAL = 'contract_renewal';
    case LOAN = 'loan';
    case MARKET_LISTING = 'market_listing';
    case MARKET_REMOVAL = 'market_removal';
    case NEGOTIATION = 'negotiation';
    case OFFER_ACCEPTED = 'offer_accepted';
    case OFFER_REFUSED = 'offer_refused';
    case OFFER_SENT = 'offer_sent';
    case TRANSFER_OFFICIAL = 'transfer_official';
}
