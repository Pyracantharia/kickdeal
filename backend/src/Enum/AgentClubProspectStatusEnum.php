<?php

namespace App\Enum;

enum AgentClubProspectStatusEnum: string
{
    case PROPOSAL_SENT = 'proposal_sent';
    case INTERESTED = 'interested';
    case REJECTED = 'rejected';
    case DISCUSSION_OPEN = 'discussion_open';
}
