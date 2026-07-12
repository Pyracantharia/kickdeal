import ClubCard from '@/components/auth/Register/ClubCard'
import ManagerCard from '@/components/auth/Register/ManagerCard'
import Image from 'next/image'
import React from 'react'

function page() {
  return (
    <>
    <div className='flex flex-col items-center justify-center'>
      <div className="flex flex-col items-center justify-center mb-5">
        <div className="relative h-16 w-16 inline-block">
          <Image
            src="/images/logo.png"
            alt="KickDeal logo"
            fill
            sizes="64px"
            className="object-contain"
            priority
          />
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">KickDeal</h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-cyan">
            Football Transfers
          </p>
        </div>
      </div>

      <h1 className="text-white text-xl font-bold text-center mb-4">Créer un compte</h1>
      <p className="text-sm text-white mb-4">Choisissez votre type de compte</p>

      <div className="flex flex-col gap-2 md:flex-row md:gap-6">
        <ClubCard />
        <ManagerCard />
      </div>

      <p className="text-xs text-white mt-4">Déjà un compte ? <a href="/auth/login" className="text-brand-purple">Connectez-vous</a></p>
    </div>
    </>
  )
}

export default page