import { Suspense, use } from 'react'
import PlayerDetails from '@/components/market/PlayerDetails'

export const metadata = {
  title: 'Détails du joueur',
  description: 'Détails complets du joueur',
}

interface PlayerDetailPageProps {
  params: Promise<{
    playerId: string
  }>
}

function PlayerDetailPage({ params }: PlayerDetailPageProps) {
  const { playerId } = use(params)

  return (
    <Suspense>
      <PlayerDetails playerId={playerId} />
    </Suspense>
  )
}

export default PlayerDetailPage