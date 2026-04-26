import httpClient from '@/features/api'
import type { ClubPlayer } from '@/features/club/types/roster'
import type {
  Club,
  League,
  Nationality,
  Player,
  Position,
  TransferStatus,
} from '@/features/market/types/player'

const NATIONALITY_FLAGS: Record<string, string> = {
  Belgique: '🇧🇪',
  France: '🇫🇷',
  Uruguay: '🇺🇾',
}

interface PlayersListResponse {
  players: Player[]
}

interface ClubRosterResponse {
  players: ClubPlayer[]
}

class PlayersManager {
  async getAll() {
    return httpClient.get<PlayersListResponse>('/players')
  }

  async getById(id: string) {
    return httpClient.get<Player>(`/players/${id}`)
  }

  async getClubRoster() {
    return httpClient.get<ClubRosterResponse>('/players/club-roster')
  }
}

export function buildPlayerFilters(players: Player[]): {
  positions: Position[]
  nationalities: Nationality[]
  leagues: League[]
  clubs: Club[]
  transferStatuses: TransferStatus[]
} {
  const positions = Array.from(new Set(players.map((player) => player.position)))
    .sort((a, b) => a.localeCompare(b))
    .map((position) => ({
      id: position,
      label: position,
    }))

  const nationalities = Array.from(new Set(players.map((player) => player.nationality)))
    .sort((a, b) => a.localeCompare(b))
    .map((nationality) => ({
      id: nationality,
      label: nationality,
      flag: NATIONALITY_FLAGS[nationality] ?? '🌍',
    }))

  const leagues = Array.from(
    new Map(
      players
        .filter((player) => player.league)
        .map((player) => [
          player.league,
          {
            id: player.league,
            label: player.league,
            country: player.country,
          },
        ]),
    ).values(),
  ).sort((a, b) => a.label.localeCompare(b.label))

  const clubs = Array.from(
    new Map(
      players
        .filter((player) => player.club)
        .map((player) => [
          `${player.league}:${player.club}`,
          {
            id: player.club,
            label: player.club,
            leagueId: player.league,
            logoUrl: player.clubLogoUrl,
          },
        ]),
    ).values(),
  ).sort((a, b) => a.label.localeCompare(b.label))

  const transferStatuses = Array.from(new Set(players.map((player) => player.transferStatus)))
    .sort((a, b) => a.localeCompare(b))
    .map((status) => ({
      id: status,
      label: status,
    }))

  return {
    positions,
    nationalities,
    leagues,
    clubs,
    transferStatuses,
  }
}

export function filterPlayers(
  players: Player[],
  filters: {
    playerId?: string | null
    positionId?: string | null
    nationalityId?: string | null
    transferStatusId?: string | null
    ageMin?: number
    ageMax?: number
    leagueId?: string | null
    clubId?: string | null
  },
): Player[] {
  return players.filter((player) => {
    if (filters.playerId && player.id !== filters.playerId) {
      return false
    }

    if (filters.positionId && player.position !== filters.positionId) {
      return false
    }

    if (filters.nationalityId && player.nationality !== filters.nationalityId) {
      return false
    }

    if (filters.transferStatusId && player.transferStatus !== filters.transferStatusId) {
      return false
    }

    if (filters.ageMin !== undefined && player.age < filters.ageMin) {
      return false
    }

    if (filters.ageMax !== undefined && player.age > filters.ageMax) {
      return false
    }

    if (filters.leagueId && player.league !== filters.leagueId) {
      return false
    }

    if (filters.clubId && player.club !== filters.clubId) {
      return false
    }

    return true
  })
}

export const playersManager = new PlayersManager()