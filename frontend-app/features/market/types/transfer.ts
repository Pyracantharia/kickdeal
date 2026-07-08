import type { Player } from './player'

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired'
export type OfferType = 'purchase' | 'loan' | 'exchange'
export type TransferNegotiationStatus = 'open' | 'counter_offer' | 'permission_to_speak' | 'agreed_clubs' | 'pending_agent' | 'pending_seller_club' | 'seller_club_invited' | 'seller_club_external_contacted' | 'completed' | 'expired' | 'rejected'

export interface ContractResolution {
  requiresAction: boolean
  playerHasAgent: boolean
  buyerConfirmedExternalAgreement: boolean
  sellerConfirmedExternalAgreement: boolean
  viewerConfirmedExternalAgreement: boolean
  viewerRole: 'buyer' | 'seller'
  canInviteAgent: boolean
  canConfirmExternalAgreement: boolean
  buyerTeamName?: string | null
  sellerTeamName?: string | null
  externalContractDurationMonths?: number | null
  externalContractWeeklySalary?: string | null
}

export interface SellerClubResolution {
  requiresAction: boolean
  viewerRole: 'buyer' | 'seller'
  sellerClubRepresented: boolean
  canInviteSellerClub: boolean
  canMarkExternalContact: boolean
  sellerTeamName?: string | null
  buyerTeamName?: string | null
  invitationSent: boolean
  invitedEmail?: string | null
  invitedAt?: string | null
  externalContacted: boolean
  externalContactedAt?: string | null
}

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
  negociationStatus?: TransferNegotiationStatus | null
  buyerTeamId?: string | null
  sellerTeamId?: string | null
  viewerRole?: 'buyer' | 'seller'
  contractResolution?: ContractResolution | null
  sellerClubResolution?: SellerClubResolution | null
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
  negociationStatus?: TransferNegotiationStatus | null
  viewerRole: 'buyer' | 'seller'
  exchangeTeamId?: string | null
  contractResolution?: ContractResolution | null
  sellerClubResolution?: SellerClubResolution | null
  player: Player
  sellerTeam: NegotiationTeam
  buyerTeam: NegotiationTeam
  viewerTeam: NegotiationTeam
  latestOffer?: TransferOffer | null
  history: NegotiationHistoryItem[]
}

export interface TransferAgentInvitation {
  email: string
  acceptedAt?: string | null
  player: Player
  buyerTeam: NegotiationTeam
  sellerTeam: NegotiationTeam
  negociationStatus?: TransferNegotiationStatus | null
}

export interface TransferClubInvitation {
  email: string
  acceptedAt?: string | null
  player: Player
  buyerTeam: NegotiationTeam
  sellerTeam: NegotiationTeam
  negociationStatus?: TransferNegotiationStatus | null
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
