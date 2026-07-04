<?php

namespace App\Enum;

enum PlayerAgentRequestTypeEnum: string
{
    case REPRESENTATION = 'representation';
    case AGENT_HANDOVER = 'agent_handover';
}
