<?php

namespace App\Enum;

enum PlayerAgentRequestStatusEnum: string
{
    case PENDING = 'pending';
    case ADMIN_APPROVED = 'admin_approved';
    case APPROVED = 'approved';
    case REJECTED = 'rejected';
}
