export type ClubOption = {
  id: string
  name: string
  league: string
  country: string
  logoUrl?: string | null
}

export type VerificationMethod =
  | { type: 'document'; file: File }
  | { type: 'email'; email: string }
  | { type: 'message'; message: string }
