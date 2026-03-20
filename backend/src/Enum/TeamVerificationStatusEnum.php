<?php

namespace App\Enum;

enum TeamVerificationStatusEnum: string
{
    case PENDING = 'pending';
    case UNVERIFIED = 'unverified';
    case VERIFIED = 'verified';
}
