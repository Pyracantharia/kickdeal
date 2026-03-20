<?php

namespace App\Enum;

enum ListingStatusEnum: string
{
    case ACTIVE = 'active';
    case CLOSED = 'closed';
    case PAUSED = 'paused';
}
