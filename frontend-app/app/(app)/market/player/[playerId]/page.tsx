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

async function PlayerDetailPage({ params }: PlayerDetailPageProps) {
  const { playerId } = await params

  return <PlayerDetails playerId={playerId} />
}

export default PlayerDetailPage