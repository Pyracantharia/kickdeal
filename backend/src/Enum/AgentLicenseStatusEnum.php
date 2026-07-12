<?php

namespace App\Enum;

enum AgentLicenseStatusEnum: string
{
    case APPROVED = 'approved';
    case PENDING = 'pending';
    case REJECTED = 'rejected';
}
