<?php

namespace App\Enum;

enum PlayerDecisionStatusEnum: string
{
    case APPROVED = 'approved';
    case PENDING = 'pending';
    case REJECTED = 'rejected';
}
