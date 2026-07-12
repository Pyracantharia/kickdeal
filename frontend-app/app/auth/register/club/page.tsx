import RegisterClubCard from '@/components/auth/Register/RegisterClubCard'
import React, { Suspense } from 'react'


function page() {
  return (
    <Suspense fallback={<div className="text-white/60">Chargement du formulaire...</div>}>
      <RegisterClubCard />
    </Suspense>
  )
}

export default page
