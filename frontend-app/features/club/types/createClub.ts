export type ClubOption = {
  id: string
  name: string
  league: string
  country: string
  logoUrl?: string | null
  isClaimed?: boolean
}

export type VerificationMethod =
  | { type: 'document'; file: File }
  | { type: 'email'; email: string }
  | { type: 'message'; message: string }
