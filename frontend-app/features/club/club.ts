import httpClient from '../api'
import type { ClubDetail, CreatePlayerPayload, UpdateClubBudgetPayload } from './types/club'
import type { LeagueOption } from './types/createClub'
import type { PlayerMarketContext } from '@/features/market/types/player'

type JoinClubResponse = {
  message: string
  club?: ClubDetail
}

export type ClubSearchItem = {
  id: string
  name: string
  league: string
  country: string
  logoUrl?: string | null
  isClaimed?: boolean
}

type SearchClubsResponse = {
  clubs: ClubSearchItem[]
}

type SearchLeaguesResponse = {
  leagues: LeagueOption[]
}

export type ClubRequestSummary = {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt?: string | null
  team: {
    id: string
    name: string
    league: string
    country: string
    logoUrl?: string | null
  } | null
}

export type CreateClubRequestPayload = {
  teamId?: string
  clubName: string
  league?: string
  country?: string
  verificationEmail?: string
  verificationMessage?: string
  verificationDocument?: File
}

type CreateClubRequestResponse = {
  message: string
  clubRequestId: string
  teamId: string
  clubRequest?: ClubRequestSummary
}

type ClubRequestMineResponse = {
  clubRequest: ClubRequestSummary | null
  hasClubAccess: boolean
}

type ClubMineResponse = {
  club: ClubDetail
}

type CreatePlayerResponse = {
  message: string
  club: ClubDetail
}

type UpdateClubBudgetResponse = {
  message: string
  club: ClubDetail
}

type ClubPlayerMarketStatusResponse = {
  message: string
  status: string
  marketContext?: PlayerMarketContext
}

type ClubPlayerAuthorizationResponse = {
  message: string
  wasRemovedFromMarket?: boolean
  marketContext: PlayerMarketContext
}

class ClubManager {
  async getMine() {
    const response = await httpClient.get<ClubMineResponse>('/clubs/mine')
    return response
  }

  async searchClubs(query: string) {
    const response = await httpClient.get<SearchClubsResponse>(`/clubs/search?query=${encodeURIComponent(query)}`)
    return response
  }

  async getLeagues() {
    return httpClient.get<SearchLeaguesResponse>('/clubs/leagues')
  }

  async getClubsByLeague(league: string) {
    return httpClient.get<SearchClubsResponse>(`/clubs/search?league=${encodeURIComponent(league)}`)
  }

  async getMyClubRequest() {
    const response = await httpClient.get<ClubRequestMineResponse>('/clubs/requests/mine')
    return response
  }

  async createClubRequest(payload: CreateClubRequestPayload) {
    const formData = new FormData()

    if (payload.teamId) {
      formData.append('teamId', payload.teamId)
    }

    formData.append('clubName', payload.clubName)
    formData.append('league', payload.league ?? '')
    formData.append('country', payload.country ?? '')

    if (payload.verificationEmail) {
      formData.append('verificationEmail', payload.verificationEmail)
    }

    if (payload.verificationMessage) {
      formData.append('verificationMessage', payload.verificationMessage)
    }

    if (payload.verificationDocument) {
      formData.append('verificationDocument', payload.verificationDocument)
    }

    const response = await httpClient.postFormData<CreateClubRequestResponse>('/clubs/requests', formData)
    return response
  }

  async joinClub(invitationCode: string) {
    const response = await httpClient.post<JoinClubResponse>('/clubs/join', {
      invitationCode,
    })
    return response
  }

  async createPlayer(payload: CreatePlayerPayload) {
    const response = await httpClient.post<CreatePlayerResponse>('/clubs/mine/players', payload)
    return response
  }

  async updateBudget(payload: UpdateClubBudgetPayload) {
    const response = await httpClient.put<UpdateClubBudgetResponse, UpdateClubBudgetPayload>('/clubs/mine/budget', payload)
    return response
  }

  async updatePlayerMarketStatus(playerId: string, status: 'on_market' | 'loan_listed' | 'not_listed') {
    return httpClient.put<ClubPlayerMarketStatusResponse, { status: string }>(
      `/clubs/mine/players/${playerId}/market-status`,
      { status },
    )
  }

  async decidePlayerMarketAuthorization(playerId: string, decision: 'approved' | 'rejected' | 'revoked') {
    return httpClient.put<ClubPlayerAuthorizationResponse, { decision: 'approved' | 'rejected' | 'revoked' }>(
      `/clubs/mine/players/${playerId}/market-authorization`,
      { decision },
    )
  }
}

export const clubManager = new ClubManager()
