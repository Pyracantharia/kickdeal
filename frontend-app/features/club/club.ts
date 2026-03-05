import httpClient from '../api'

type JoinClubResponse = {
  message: string
}

class ClubManager {
  async joinClub(invitationCode: string) {
    const response = await httpClient.post<JoinClubResponse>('/club/join', {
      invitationCode,
    })
    return response
  }
}

export const clubManager = new ClubManager()