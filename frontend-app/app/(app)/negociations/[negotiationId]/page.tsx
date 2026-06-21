import ContractNegotiationPage from '@/components/agent/ContractNegotiationPage'

interface ContractNegotiationRouteProps {
  params: Promise<{ negotiationId: string }>
}

async function ContractNegotiationRoute({ params }: ContractNegotiationRouteProps) {
  const { negotiationId } = await params

  return <ContractNegotiationPage negotiationId={negotiationId} />
}

export default ContractNegotiationRoute
