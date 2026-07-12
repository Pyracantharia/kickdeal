import PlayerAgentRequestDetailsPage from '@/components/admin/PlayerAgentRequestDetailsPage';

interface PlayerAgentRequestDetailsRouteProps {
  params: Promise<{ requestId: string }>;
}

async function PlayerAgentRequestDetailsRoute({ params }: PlayerAgentRequestDetailsRouteProps) {
  const { requestId } = await params;

  return <PlayerAgentRequestDetailsPage requestId={requestId} />;
}

export default PlayerAgentRequestDetailsRoute;
