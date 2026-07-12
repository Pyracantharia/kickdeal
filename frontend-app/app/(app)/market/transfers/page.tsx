import { Suspense } from 'react'
import TransferHome from '@/components/market/TransferHome'

export const metadata = {
  title: 'Accueil des transferts',
  description: 'Gérez vos listes de transfert et vos offres',
}

function TransferHomePage() {
  return (
    <Suspense>
      <TransferHome />
    </Suspense>
  )
}

export default TransferHomePage