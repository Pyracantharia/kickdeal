import httpClient from '@/features/api'
import type {
  ReceivedOffer,
  SentOffer,
  TransferHistoryItem,
  TransferHistoryStats,
  TransferAgentInvitation,
  TransferListPlayer,
  TransferNegotiationContext,
  TransferOfferPayload,
} from './types/transfer'

interface TransferListResponse {
  listings: TransferListPlayer[]
}

interface CreateTransferListingResponse {
  listing: TransferListPlayer
}

interface TransferOffersResponse {
  sentOffers: SentOffer[]
  receivedOffers: ReceivedOffer[]
}

interface TransferOfferResponse {
  offer: SentOffer | ReceivedOffer
  contractNegociationId?: string | null
}

interface AgentInvitationResponse {
  message: string
  invitationUrl: string
}

interface AgentInvitationContextResponse {
  invitation: TransferAgentInvitation
}

interface TransferNegotiationContextResponse {
  context: TransferNegotiationContext
}

interface TransferHistoryResponse {
  transfers: TransferHistoryItem[]
  stats: TransferHistoryStats
}

class TransfersManager {
  async getMyList() {
    return httpClient.get<TransferListResponse>('/listings/mine')
  }

  async addPlayerToList(playerId: string, transferType: 'free' | 'loan' | 'permanent' = 'permanent') {
    return httpClient.post<CreateTransferListingResponse>('/listings', {
      playerId,
      transferType,
    })
  }

  async getMyOffers() {
    return httpClient.get<TransferOffersResponse>('/transfers/offers/mine')
  }

  async getNegotiationContext(params: { listingId?: string; offerId?: string }) {
    const searchParams = new URLSearchParams()

    if (params.listingId) {
      searchParams.set('listingId', params.listingId)
    }

    if (params.offerId) {
      searchParams.set('offerId', params.offerId)
    }

    return httpClient.get<TransferNegotiationContextResponse>(`/transfers/negotiate-context?${searchParams.toString()}`)
  }

  async getHistory() {
    return httpClient.get<TransferHistoryResponse>('/transfers/history')
  }

  async createOffer(payload: TransferOfferPayload) {
    return httpClient.post<TransferOfferResponse>('/transfers/offers', payload)
  }

  async acceptOffer(offerId: string) {
    return httpClient.put<TransferOfferResponse, Record<string, never>>(`/transfers/offers/${offerId}/accept`, {})
  }

  async rejectOffer(offerId: string) {
    return httpClient.put<TransferOfferResponse, Record<string, never>>(`/transfers/offers/${offerId}/reject`, {})
  }

  async counterOffer(offerId: string, payload: TransferOfferPayload) {
    return httpClient.post<TransferOfferResponse>(`/transfers/offers/${offerId}/counter`, payload)
  }

  async inviteAgent(negociationId: string, email: string) {
    return httpClient.post<AgentInvitationResponse>(`/transfers/negotiations/${negociationId}/agent-invitations`, { email })
  }

  async getAgentInvitation(token: string) {
    return httpClient.get<AgentInvitationContextResponse>(`/transfers/agent-invitations/${encodeURIComponent(token)}`)
  }

  async claimAgentInvitation(token: string) {
    return httpClient.post<{ message: string; contractNegociationIds: string[] }>(`/transfers/agent-invitations/${encodeURIComponent(token)}/claim`, {})
  }

  async confirmExternalContractAgreement(
    negociationId: string,
    payload: { weeklySalary?: number; durationMonths?: number } = {},
  ) {
    return httpClient.post<{ negociation: { id: string; status: string; contractResolution: unknown } }>(
      `/transfers/negotiations/${negociationId}/external-contract-agreement`,
      payload,
    )
  }
}

export const transfersManager = new TransfersManager()
