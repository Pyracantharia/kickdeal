import type { Player } from './player'

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired'
export type OfferType = 'purchase' | 'loan' | 'exchange'

export interface TransferListPlayer {
  id?: string
  listingId?: string | null
  playerId: string
  player: Player
  addedDate: string
  transferType?: 'free' | 'loan' | 'permanent'
  status?: 'active' | 'closed' | 'paused'
  askingPrice?: string | null
  offerStatus?: OfferStatus
}

export interface TransferOffer {
  id: string
  negociationId?: string
  listingId?: string
  playerId: string
  buyerTeamId?: string | null
  sellerTeamId?: string | null
  viewerRole?: 'buyer' | 'seller'
  player: Player
  type: OfferType
  kind?: string
  status: OfferStatus
  amount: string
  amountValue?: number | null
  duration?: number // months for loans
  paymentStructure?: string
  paymentPerInstallment?: string
  performanceBonus?: string
  performanceBonusValue?: number | null
  performanceBonusCondition?: string
  resaleClause?: string
  resalePercentage?: string
  resalePercentageValue?: number | null
  buyBackPriority?: boolean
  futureTransferPriority?: boolean
  exchangePlayerName?: string | null
  advancedOptions?: string[]
  customMessage?: string
  date: string
}

export interface TransferOfferPayload {
  listingId?: string
  amount: number
  type: OfferType
  durationMonths?: number
  paymentInstallments?: number
  performanceBonus?: number
  performanceBonusCondition?: string
  resalePercentage?: number
  buyBackPriority?: boolean
  futureTransferPriority?: boolean
  exchangePlayerId?: string
  message?: string
}

export interface NegotiationTeam {
  id: string
  name: string
  logoUrl?: string | null
  league?: string | null
  country?: string | null
  transferBudget?: string | null
  transferBudgetValue?: number | null
}

export interface NegotiationHistoryItem {
  id: string
  clubName: string
  clubLogoUrl?: string | null
  summary: string
  createdAt?: string | null
}

export interface TransferNegotiationContext {
  listingId: string
  sourceOfferId?: string | null
  negociationId?: string | null
  viewerRole: 'buyer' | 'seller'
  exchangeTeamId?: string | null
  player: Player
  sellerTeam: NegotiationTeam
  buyerTeam: NegotiationTeam
  viewerTeam: NegotiationTeam
  latestOffer?: TransferOffer | null
  history: NegotiationHistoryItem[]
}

export interface TransferHistoryItem {
  id: string
  date: string
  player: Player
  sellerTeam: NegotiationTeam
  buyerTeam: NegotiationTeam
  amount: string
  amountValue?: number | null
  type: OfferType
  status?: string | null
  direction: 'purchase' | 'sale'
  exchangePlayerName?: string | null
}

export interface TransferHistoryStats {
  totalTransfers: number
  totalAmount: string
  totalAmountValue: number
  freeTransfers: number
  paidTransfers: number
}

export interface SentOffer extends TransferOffer {
  fromClub: string
  toClub: string
  toAgent?: string
}

export interface ReceivedOffer extends TransferOffer {
  fromClub: string
  fromAgent?: string
  toClub: string
}