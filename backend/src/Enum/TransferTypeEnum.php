<?php

namespace App\Enum;

enum TransferTypeEnum: string
{
    case FREE = 'free';
    case LOAN = 'loan';
    case PERMANENT = 'permanent';
}
