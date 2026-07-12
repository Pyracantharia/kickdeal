import RegisterManagerCard from '@/components/auth/Register/RegisterManagerCard'
import React, { Suspense } from 'react'

function page() {
  return (
    <Suspense fallback={<div className="text-white/60">Chargement du formulaire...</div>}>
      <RegisterManagerCard />
    </Suspense>
  )
}

export default page
