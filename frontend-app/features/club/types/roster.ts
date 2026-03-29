export interface ClubPlayer {
  id: string
  firstName: string
  lastName: string
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
}

export interface PositionFilter {
  id: string
  label: string
  code: string
}