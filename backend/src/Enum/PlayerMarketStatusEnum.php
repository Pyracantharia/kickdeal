<?php

namespace App\Enum;

enum PlayerMarketStatusEnum: string
{
    case LOAN_LISTED = 'loan_listed';
    case NOT_LISTED = 'not_listed';
    case ON_MARKET = 'on_market';
}
