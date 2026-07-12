<?php

namespace App\Enum;

enum PlayerAvailabilityStatusEnum: string
{
    case INJURED = 'injured';
    case NORMAL = 'normal';
    case SUSPENDED = 'suspended';
}