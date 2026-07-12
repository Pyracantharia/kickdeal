import httpClient from '@/features/api'

export type ContractViewerRole = 'agent' | 'club'
export type ContractNegotiationType = 'transfer' | 'renewal' | 'termination'
export type ContractNegotiationStatus =
  | 'open'
  | 'counter_offer'
  | 'sent_to_player'
  | 'player_accepted'
  | 'agent_accepted'
  | 'completed'
  | 'expired'
  | 'rejected'

export interface ContractOffer {
  id: string
  authorRole: ContractViewerRole
  authorLabel: string
  isMine: boolean
  annualSalary: string
  annualSalaryValue: number | null
  weeklySalary: string
  durationMonths: number | null
  signingBonus: string
  signingBonusValue: number | null
  releaseClause: string
  releaseClauseValue: number | null
  terminationCompensation: string
  terminationCompensationValue: number | null
  effectiveDate?: string | null
  validUntil?: string | null
  notes?: string | null
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
  createdAt: string
}

export interface MessageRecipient {
  id: string
  name?: string | null
  label?: string | null
}

export interface ContractNegotiation {
  id: string
  viewerRole: ContractViewerRole
  type: ContractNegotiationType
  typeLabel: string
  status: ContractNegotiationStatus
  statusLabel: string
  player: {
    id: string
    firstName: string
    lastName: string
    photoUrl?: string | null
    position: string
    age: number
    currentClub: string
    weeklySalary: string
    annualSalaryValue?: number | null
    releaseClause: string
    releaseClauseValue?: number | null
    contractEndDate?: string | null
  }
  sellerTeam: {
    id?: string | null
    name?: string | null
    logoUrl?: string | null
  }
  buyerTeam: {
    id?: string | null
    name?: string | null
    logoUrl?: string | null
  }
  agent: {
    agencyName?: string | null
    name?: string | null
  }
  messageRecipient?: MessageRecipient | null
  transferAgreement: {
    amount: string
    amountValue?: number | null
  }
  latestOffer: ContractOffer | null
  history: ContractOffer[]
  updatedAt?: string | null
}

interface ContractNegotiationsResponse {
  viewerRole: ContractViewerRole | null
  negotiations: ContractNegotiation[]
}

interface ContractNegotiationResponse {
  negotiation: ContractNegotiation
  message?: string
}

export interface ContractOfferPayload {
  annualSalary?: number
  durationMonths?: number
  signingBonus?: number
  releaseClause?: number
  terminationCompensation?: number
  effectiveDate?: string
  validUntil?: string
  notes?: string
}

class ContractsManager {
  async startForPlayer(playerId: string, type: Exclude<ContractNegotiationType, 'transfer'>) {
    return httpClient.post<ContractNegotiationResponse, { type: typeof type }>(
      `/contracts/negotiations/players/${playerId}`,
      { type },
    )
  }

  async getMine() {
    return httpClient.get<ContractNegotiationsResponse>('/contracts/negotiations/mine')
  }

  async getById(id: string) {
    return httpClient.get<ContractNegotiationResponse>(`/contracts/negotiations/${id}`)
  }

  async createOffer(id: string, payload: ContractOfferPayload) {
    return httpClient.post<ContractNegotiationResponse, ContractOfferPayload>(
      `/contracts/negotiations/${id}/offers`,
      payload,
    )
  }

  async cancelNegotiation(id: string) {
    return httpClient.remove<{ message?: string; errorMessage?: string }>(
      `/contracts/negotiations/${id}`,
    )
  }

  async acceptOffer(offerId: string) {
    return httpClient.put<ContractNegotiationResponse, Record<string, never>>(
      `/contracts/negotiations/offers/${offerId}/accept`,
      {},
    )
  }

  async rejectOffer(offerId: string) {
    return httpClient.put<ContractNegotiationResponse, Record<string, never>>(
      `/contracts/negotiations/offers/${offerId}/reject`,
      {},
    )
  }
}

export const contractsManager = new ContractsManager()
