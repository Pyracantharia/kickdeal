import httpClient from '@/features/api'
import type { TransferListPlayer } from './types/transfer'

interface TransferListResponse {
  listings: TransferListPlayer[]
}

interface CreateTransferListingResponse {
  listing: TransferListPlayer
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
}

export const transfersManager = new TransfersManager()