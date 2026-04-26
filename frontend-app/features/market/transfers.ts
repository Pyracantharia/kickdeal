import httpClient from '@/features/api'
import type {
  ReceivedOffer,
  SentOffer,
  TransferHistoryItem,
  TransferHistoryStats,
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
}

export const transfersManager = new TransfersManager()