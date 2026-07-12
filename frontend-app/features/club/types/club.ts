export interface ClubPlayer {
  id: string
  firstName: string
  lastName: string
  position: string
  age: number
  nationality: string
  salary: number
  contractEndDate: string
  status: 'active' | 'injured' | 'loan'
}

export interface ClubStats {
  totalPlayers: number
  playersOnMarket: number
  injuredPlayers: number
  offersReceived: number
  blockedOffers: number
  negotiations: number
}

export interface ClubFinances {
  totalBudget: number
  remainingBudget: number
  totalSalaries: number
  playerValue: number
  recentRevenues: number
}

export interface ClubAccountMember {
  id: string
  userId?: string | null
  name: string
  email?: string | null
  role: string
  roleLabel: string
  isPrimary: boolean
  joinedAt?: string | null
}

export interface ClubAccounts {
  canManage: boolean
  invitationCode: string
  seats: {
    used: number
    included?: number | null
    remaining?: number | null
    unlimited: boolean
  }
  members: ClubAccountMember[]
}

export interface ClubDetail {
  id: string
  name: string
  logo?: string
  logoUrl?: string | null
  league: string
  country: string
  joinDate: string
  stats: ClubStats
  finances: ClubFinances
  accounts?: ClubAccounts
  players?: ClubPlayer[]
}

export interface CreatePlayerPayload {
  firstName: string
  lastName: string
  position: string
  birthDate?: string
  nationality?: string
  photoUrl?: string
  heightCm?: number
  weightKg?: number
  preferredFoot?: string
  marketValue?: number
  weeklySalary?: number
  releaseClause?: number
  contractEndDate?: string
}

export interface UpdateClubBudgetPayload {
  totalBudget: number
}