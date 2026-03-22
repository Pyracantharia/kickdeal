import { Suspense } from 'react'
import PlayerSearchResults from '@/components/market/PlayerSearchResults'

export const metadata = {
  title: 'Résultats de recherche',
  description: 'Résultats de la recherche de joueurs',
}

function PlayerSearchResultsPage() {
  return (
    <Suspense>
      <PlayerSearchResults />
    </Suspense>
  )
}

export default PlayerSearchResultsPage