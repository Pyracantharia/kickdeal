<?php

namespace App\Enum;

enum MembershipRoleEnum: string
{
    case CLUB_MANAGER = 'club_manager';
    case RECRUITER = 'recruiter';
    case SPORTING_DIRECTOR = 'sporting_director';
    case STAFF = 'staff';
}
