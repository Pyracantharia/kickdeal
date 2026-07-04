export type PlayerMarketContextState =
  | 'none'
  | 'pending'
  | 'accepted'
  | 'refused'
  | 'listed_by_club'
  | 'free'

export interface PlayerMarketContext {
  state: PlayerMarketContextState
  contractState: 'free_agent' | 'under_contract'
  canAgentProspect: boolean
  canAgentSetMarketStatus: boolean
  requiresClubAuthorization: boolean
  authorizationStatus?: 'pending' | 'approved' | 'rejected' | null
  listingSource?: 'agent' | 'club' | null
  message: string
  actionLabel?: string | null
  isListedByClub: boolean
  isFreePlayer: boolean
}

export interface Player {
  id: string
  firstName: string
  lastName: string
  photoUrl?: string | null
  age: number
  position: string
  nationality: string
  country: string
  league: string
  club: string
  clubLogoUrl?: string | null
  agent?: {
    id: string
    name: string
  } | null
  transferStatus: string
  height?: number // cm
  weight?: number // kg
  foot?: string // "Droit" | "Gauche"
  marketValue?: string // "? M" format
  weeklySalary?: string // "? M" format
  releaseClause?: string // "? M" ou "Aucun(e)"
  contractEndDate?: string | null
  contractStatus?: 'free_agent' | 'under_contract'
  marketStatusValue?: 'on_market' | 'loan_listed' | 'not_listed' | null
  marketContext?: PlayerMarketContext
}

export interface Position {
  id: string
  label: string
}

export interface Nationality {
  id: string
  label: string
  flag: string
  countryCode?: string
}

export interface League {
  id: string
  label: string
  country: string
  countryCode?: string
}

export interface LeagueCountry {
  id: string
  label: string
  flag: string
  countryCode?: string
}

export interface Club {
  id: string
  label: string
  leagueId: string
  logoUrl?: string | null
}

export interface TransferStatus {
  id: string
  label: string
}

export interface PlayerSearchFilters {
  name?: string
  position?: string
  nationality?: string
  transferStatus?: string
  ageMin?: number
  ageMax?: number
  league?: string
  club?: string
}
