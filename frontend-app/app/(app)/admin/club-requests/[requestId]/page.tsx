import ClubRequestDetailsPage from '@/components/admin/ClubRequestDetailsPage';

interface ClubRequestDetailsRouteProps {
  params: Promise<{ requestId: string }>;
}

async function ClubRequestDetailsRoute({ params }: ClubRequestDetailsRouteProps) {
  const { requestId } = await params;

  return <ClubRequestDetailsPage requestId={requestId} />;
}

export default ClubRequestDetailsRoute;
