import httpClient from '@/features/api'
import type { ClubPlayer } from '@/features/club/types/roster'
import type {
  Club,
  League,
  LeagueCountry,
  Nationality,
  Player,
  Position,
  TransferStatus,
} from '@/features/market/types/player'
import {
  getLeagueDisplayName,
  getLeagueCountryId,
  isDisplayedLeague,
  LEAGUE_CONFIG,
} from '@/features/league/leagueConfig'
import { getPositionDisplayName } from '@/features/players/position'

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

const TRANSFER_STATUS_LABELS: Record<string, string> = {
  all: 'Tout',
  on_market: 'Sur liste des transferts',
  loan_listed: 'Liste de prêt',
  free_agent: 'Libre',
  under_contract: 'Sous contrat',
  not_listed: 'Non listé',
}

const TRANSFER_STATUS_ORDER = ['on_market', 'loan_listed', 'free_agent', 'under_contract', 'not_listed'] as const

type TransferStatusSource = {
  contractStatus?: 'free_agent' | 'under_contract'
  marketStatusValue?: 'on_market' | 'loan_listed' | 'not_listed' | null
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

  async getAgentRoster() {
    return httpClient.get<PlayersListResponse>('/players/agent-roster')
  }

  async getTeamRoster(teamId: string) {
    return httpClient.get<ClubRosterResponse>(`/players/team/${teamId}/roster`)
  }
}

export function buildPlayerFilters(players: Player[]): {
  positions: Position[]
  nationalities: Nationality[]
  countries: LeagueCountry[]
  leagues: League[]
  clubs: Club[]
  transferStatuses: TransferStatus[]
} {
  const positions = Array.from(new Set(players.map((player) => player.position)))
    .sort((a, b) => a.localeCompare(b))
    .map((position) => ({
      id: position,
      label: getPositionDisplayName(position),
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
        .filter((player) => player.league && isDisplayedLeague(player.league))
        .map((player) => [
          player.league,
          {
            id: player.league,
            label: getLeagueDisplayName(player.league),
            country: getLeagueCountryId(player.league) ?? player.country,
          },
        ]),
    ).values(),
  ).sort((a, b) => a.label.localeCompare(b.label))

  const countries = Array.from(
    new Map(
      Object.values(LEAGUE_CONFIG).map((league) => [
        league.countryId,
        {
          id: league.countryId,
          label: league.countryName,
          flag: league.countryFlag,
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

  const transferStatusIds = new Set<string>(TRANSFER_STATUS_ORDER)
  players.forEach((player) => {
    transferStatusIds.add(getTransferFilterId(player))
    if (player.contractStatus) {
      transferStatusIds.add(player.contractStatus)
    }
  })

  const transferStatuses = Array.from(transferStatusIds)
    .sort((a, b) => TRANSFER_STATUS_ORDER.indexOf(a as typeof TRANSFER_STATUS_ORDER[number]) - TRANSFER_STATUS_ORDER.indexOf(b as typeof TRANSFER_STATUS_ORDER[number]))
    .map((status) => ({
      id: status,
      label: TRANSFER_STATUS_LABELS[status] ?? status,
    }))

  return {
    positions,
    nationalities,
    countries,
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
    countryId?: string | null
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

    if (filters.countryId && getLeagueCountryId(player.league) !== filters.countryId) {
      return false
    }

    if (filters.transferStatusId && !matchesTransferStatusFilter(player, filters.transferStatusId)) {
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

export function getTransferFilterId(
  player: TransferStatusSource,
): 'on_market' | 'loan_listed' | 'free_agent' | 'under_contract' | 'not_listed' {
  if (player.contractStatus === 'free_agent') {
    return 'free_agent'
  }

  if (player.contractStatus === 'under_contract') {
    return 'under_contract'
  }

  if (player.marketStatusValue === 'loan_listed') {
    return 'loan_listed'
  }

  if (player.marketStatusValue === 'on_market') {
    return 'on_market'
  }

  return 'not_listed'
}

export function getTransferFilterLabel(player: TransferStatusSource): string {
  return TRANSFER_STATUS_LABELS[getTransferFilterId(player)] ?? 'Non listé'
}

export function matchesTransferStatusFilter(player: TransferStatusSource, filterId: string): boolean {
  if (filterId === 'all') return true
  if (filterId === 'free_agent' || filterId === 'under_contract') {
    return player.contractStatus === filterId
  }

  return getTransferFilterId(player) === filterId
}

export const playersManager = new PlayersManager()
