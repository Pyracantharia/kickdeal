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
  transferStatus: string
  height?: number // cm
  weight?: number // kg
  foot?: string // "Droit" | "Gauche"
  marketValue?: string // "? M" format
  weeklySalary?: string // "? M" format
  releaseClause?: string // "? M" ou "Aucun(e)"
}

export interface Position {
  id: string
  label: string
}

export interface Nationality {
  id: string
  label: string
  flag: string
}

export interface League {
  id: string
  label: string
  country: string
}

export interface LeagueCountry {
  id: string
  label: string
  flag: string
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
