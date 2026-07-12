import type { PlayerMarketContext } from '@/features/market/types/player'

export interface ClubPlayer {
  id: string
  firstName: string
  lastName: string
  photoUrl?: string | null
  position: string
  age: number
  height: number // cm
  weight: number // kg
  foot: string // "Droit" | "Gauche"
  marketValue: string // "35.0 M€"
  weeklySalary: string // "180 k€/sem"
  contract: string // durée en années
  status: string // "Normal" | "Blessé" | "Suspendu"
  nationality: string
  joinDate: string
  agentName?: string
  contractStatus?: 'free_agent' | 'under_contract'
  marketStatusValue?: 'on_market' | 'loan_listed' | 'not_listed' | null
  marketContext?: PlayerMarketContext
}

export interface PositionFilter {
  id: string
  label: string
  code: string
}
