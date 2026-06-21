import httpClient from '@/features/api'
import type { Player, PlayerMarketContext } from '@/features/market/types/player'

export type RepresentationRequestStatus = 'pending' | 'approved' | 'rejected'

export interface RepresentationRequest {
  id: string
  status: RepresentationRequestStatus
  createdAt: string
  player: {
    id: string
    firstName: string
    lastName: string
  }
}

interface PlayerCandidatesResponse {
  players: Player[]
}

interface RepresentationRequestsResponse {
  requests: RepresentationRequest[]
}

interface RepresentationRequestResponse {
  message: string
  requestId: string
  status: RepresentationRequestStatus
}

interface MarketStatusResponse {
  message: string
  status: string
  marketContext?: PlayerMarketContext
}

interface MarketAuthorizationResponse {
  message: string
  marketContext: PlayerMarketContext
}

export type ClubProspectStatus =
  | 'proposal_sent'
  | 'interested'
  | 'rejected'
  | 'discussion_open'

export interface ClubProspectContact {
  id: string
  teamId: string
  status: ClubProspectStatus
  message: string
  createdAt: string
  updatedAt: string
}

export interface ProspectClub {
  id: string
  name: string
  logoUrl?: string | null
  country: string
  league: string
  transferBudget: string
  transferBudgetValue: number
  squadSize: number
  positionCount: number
  sportingNeed: string
  financialFit: string
  clubLevel: string
  interestPotential: string
  compatibilityScore: number
  contact: ClubProspectContact | null
}

export interface ClubProspectingResponse {
  player: Player
  eligibility: {
    canContact: boolean
    requiresAuthorization: boolean
    reason: string
    state: string
    actionLabel?: string | null
  }
  suggestedMessage: string
  clubs: ProspectClub[]
}

interface CreateClubProspectResponse {
  message: string
  prospect: ClubProspectContact
}

class AgentPlayersManager {
  async searchCandidates(query = '') {
    const searchParams = new URLSearchParams()
    if (query.trim()) searchParams.set('query', query.trim())
    const suffix = searchParams.toString() ? `?${searchParams.toString()}` : ''

    return httpClient.get<PlayerCandidatesResponse>(`/agents/players/candidates${suffix}`)
  }

  async getRepresentationRequests() {
    return httpClient.get<RepresentationRequestsResponse>('/agents/player-requests/mine')
  }

  async createRepresentationRequest(
    playerId: string,
    verificationDocument: File,
    message?: string,
  ) {
    const formData = new FormData()
    formData.append('playerId', playerId)
    formData.append('verificationDocument', verificationDocument)
    if (message?.trim()) formData.append('message', message.trim())

    return httpClient.postFormData<RepresentationRequestResponse>('/agents/player-requests', formData)
  }

  async updateMarketStatus(playerId: string, status: 'on_market' | 'loan_listed' | 'not_listed') {
    return httpClient.put<MarketStatusResponse, { status: string }>(
      `/agents/players/${playerId}/market-status`,
      { status },
    )
  }

  async requestMarketAuthorization(playerId: string) {
    return httpClient.post<MarketAuthorizationResponse, Record<string, never>>(
      `/agents/players/${playerId}/market-authorization-request`,
      {},
    )
  }

  async getClubProspects(playerId: string) {
    return httpClient.get<ClubProspectingResponse>(`/agents/players/${playerId}/club-prospects`)
  }

  async createClubProspect(playerId: string, teamId: string, message: string) {
    return httpClient.post<CreateClubProspectResponse, { teamId: string; message: string }>(
      `/agents/players/${playerId}/club-prospects`,
      { teamId, message },
    )
  }
}

export const agentPlayersManager = new AgentPlayersManager()
