<?php

namespace App\Enum;

enum OfferStatusEnum: string
{
    case ACCEPTED = 'accepted';
    case EXPIRED = 'expired';
    case PENDING = 'pending';
    case REJECTED = 'rejected';
}
