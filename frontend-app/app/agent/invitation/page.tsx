import { Suspense } from 'react'

import AgentInvitationClient, { AgentInvitationLoading } from '@/components/agent/AgentInvitationClient'

export default function AgentInvitationPage() {
  return (
    <Suspense fallback={<AgentInvitationLoading />}>
      <AgentInvitationClient />
    </Suspense>
  )
}
