import type { Metadata } from 'next'

import TransferHistoryPage from '@/components/market/TransferHistoryPage'

export const metadata: Metadata = {
  title: 'Historique des transferts',
}

export default function Page() {
  return <TransferHistoryPage />
}