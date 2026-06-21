import AgentClubProspectingPage from '@/components/agent/AgentClubProspectingPage'

interface PlayerClubProspectingPageProps {
  params: Promise<{ playerId: string }>
}

async function PlayerClubProspectingPage({ params }: PlayerClubProspectingPageProps) {
  const { playerId } = await params

  return <AgentClubProspectingPage playerId={playerId} />
}

export default PlayerClubProspectingPage
