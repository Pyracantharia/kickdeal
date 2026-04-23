import httpClient from '@/features/api'

export interface DashboardActiveDeal {
  id: string
  eventLabel: string
  eventDate: string | null
  homeClub: string | null
  awayClub: string | null
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
}

class DashboardManager {
  async getHome() {
    return httpClient.get<ClubDashboardHomeData>('/dashboard/home')
  }
}

export const dashboardManager = new DashboardManager()