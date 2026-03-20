<?php

namespace App\Enum;

enum PlayerContractStatusEnum: string
{
    case FREE_AGENT = 'free_agent';
    case UNDER_CONTRACT = 'under_contract';
}
