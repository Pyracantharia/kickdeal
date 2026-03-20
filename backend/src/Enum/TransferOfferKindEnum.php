<?php

namespace App\Enum;

enum TransferOfferKindEnum: string
{
    case BUY_NOW = 'buy_now';
    case COUNTER_OFFER = 'counter_offer';
    case INITIAL = 'initial';
}
