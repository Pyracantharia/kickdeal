import type { Metadata } from 'next'

import TransferNegotiationPage from '@/components/market/TransferNegotiationPage'

export const metadata: Metadata = {
  title: 'Négociation transfert',
}

export default function Page() {
  return <TransferNegotiationPage />
}