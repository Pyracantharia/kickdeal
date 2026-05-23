<?php

namespace App\Enum;

enum PaymentStatusEnum: string
{
    case CONFIRMED = 'confirmed';
    case PENDING = 'pending';
    case REJECTED = 'rejected';
}