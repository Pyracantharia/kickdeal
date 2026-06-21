<?php

namespace App\Enum;

enum PlayerMarketAuthorizationStatusEnum: string
{
    case APPROVED = 'approved';
    case PENDING = 'pending';
    case REJECTED = 'rejected';
}
