import httpClient from '../api'

type JoinClubResponse = {
  message: string
}

export type ClubSearchItem = {
  id: string
  name: string
  league: string
  country: string
}

type SearchClubsResponse = {
  clubs: ClubSearchItem[]
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
}

class ClubManager {
  async searchClubs(query: string) {
    const response = await httpClient.get<SearchClubsResponse>(`/clubs/search?query=${encodeURIComponent(query)}`)
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
    const response = await httpClient.post<JoinClubResponse>('/club/join', {
      invitationCode,
    })
    return response
  }
}

export const clubManager = new ClubManager()