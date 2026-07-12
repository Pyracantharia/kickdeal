<?php

namespace App\Enum;

enum MessageTypeEnum: string
{
    case TEXT = 'text';
    case SYSTEM = 'system';
}
