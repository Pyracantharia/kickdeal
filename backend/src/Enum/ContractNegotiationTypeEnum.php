<?php

namespace App\Enum;

enum ContractNegotiationTypeEnum: string
{
    case RENEWAL = 'renewal';
    case TERMINATION = 'termination';
    case TRANSFER = 'transfer';
}
