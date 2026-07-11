import httpClient from '@/features/api'

export interface DashboardActiveDeal {
  id: string
  eventLabel: string
  eventDate: string | null
  homeClub: string | null
  homeClubLogoUrl?: string | null
  awayClub: string | null
  awayClubLogoUrl?: string | null
  playerName: string
  status: {
    value: string | null
    label: string
  }
  isCurrentClubBuyer: boolean
}

export interface ClubDashboardHomeData {
  activeDeal: DashboardActiveDeal | null
  pendingOffersCount: number
  unreadMessagesCount: number
  pendingRenewalsCount: number
  transferWindowStatus?: {
    isOpen: boolean
    name: string
    label: string
    daysRemaining?: number
    daysUntilOpen?: number
    startDate: string
    endDate: string
  }
}

export interface AgentDashboardPlayer {
  id: string
  firstName: string
  lastName: string
  photoUrl?: string | null
  position: string
  age: number
  club: string
  clubLogoUrl?: string | null
  marketStatus: string
  marketStatusValue?: string | null
  contractEndDate?: string | null
  marketValue: string
}

export interface AgentDashboardNegotiation {
  id: string
  type?: 'transfer' | 'renewal' | 'termination'
  typeLabel?: string
  player: AgentDashboardPlayer | null
  club: {
    name: string
    logoUrl?: string | null
  }
  status: {
    value?: string | null
    label: string
  }
  updatedAt?: string | null
  latestOffer?: {
    annualSalary: string
    displayAmount?: string
    durationMonths?: number | null
    status?: string | null
    statusLabel: string
  } | null
}

export interface AgentDashboardHomeData {
  profile: {
    agencyName?: string | null
    country?: string | null
  } | null
  stats: {
    representedPlayers: number
    activeNegotiations: number
    pendingOffers: number
    availablePlayers: number
    portfolioMarketValue: number
    portfolioMarketValueLabel: string
  }
  players: AgentDashboardPlayer[]
  negotiations: AgentDashboardNegotiation[]
}

class DashboardManager {
  async getHome() {
    return httpClient.get<ClubDashboardHomeData>('/dashboard/home')
  }

  async getAgentHome() {
    return httpClient.get<AgentDashboardHomeData>('/dashboard/agent')
  }
}

export const dashboardManager = new DashboardManager()
