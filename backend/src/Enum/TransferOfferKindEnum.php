<?php

namespace App\Enum;

enum TransferOfferKindEnum: string
{
    case BUY_NOW = 'buy_now';
    case COUNTER_OFFER = 'counter_offer';
    case EXCHANGE = 'exchange';
    case INITIAL = 'initial';
    case LOAN = 'loan';
}
