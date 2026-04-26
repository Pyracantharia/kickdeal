import type { Player } from './player'

export type OfferStatus = 'pending' | 'accepted' | 'rejected'
export type OfferType = 'purchase' | 'loan'

export interface TransferListPlayer {
  id?: string
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
  playerId: string
  player: Player
  type: OfferType
  status: OfferStatus
  amount: string
  duration?: number // months for loans
  paymentStructure?: string
  paymentPerInstallment?: string
  performanceBonus?: string
  performanceBonusCondition?: string
  resaleClause?: string
  resalePercentage?: string
  advancedOptions?: string[]
  customMessage?: string
  date: string
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