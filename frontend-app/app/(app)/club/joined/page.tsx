import { Suspense } from 'react'
import ClubJoinedCard from '@/components/club/ClubJoinedCard'

function ClubJoinedPage() {
  return (
    <Suspense>
      <ClubJoinedCard />
    </Suspense>
  )
}

export default ClubJoinedPage