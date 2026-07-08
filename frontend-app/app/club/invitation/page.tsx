import { Suspense } from 'react'

import ClubInvitationClient, { ClubInvitationLoading } from '@/components/club/ClubInvitationClient'

export default function ClubInvitationPage() {
  return (
    <Suspense fallback={<ClubInvitationLoading />}>
      <ClubInvitationClient />
    </Suspense>
  )
}
