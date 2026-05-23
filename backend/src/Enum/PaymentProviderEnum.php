<?php

namespace App\Enum;

enum PaymentProviderEnum: string
{
    case CHILIZ = 'chiliz';
    case STRIPE = 'stripe';
}