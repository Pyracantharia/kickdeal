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

export interface ClubDetail {
  id: string
  name: string
  logo: string
  league: string
  country: string
  joinDate: string
  stats: ClubStats
  finances: ClubFinances
  players: ClubPlayer[]
}