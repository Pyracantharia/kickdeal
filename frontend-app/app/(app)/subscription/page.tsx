import type { Metadata } from 'next'

import SubscriptionPage from '@/components/subscription/SubscriptionPage'

export const metadata: Metadata = {
  title: 'Abonnement',
}

export default function Page() {
  return <SubscriptionPage />
}