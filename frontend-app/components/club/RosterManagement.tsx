'use client'

import React from 'react'
import PlayerRosterTable from './PlayerRosterTable'

function RosterManagement() {
  return (
    <div className="auth-bg min-h-screen w-full px-4 pb-14 pt-36 md:px-8 md:pt-40">
      <div className="mx-auto w-full max-w-[1500px]">
        <header className="mb-8 border-b border-white/10 pb-7">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-cyan">
            Effectif du club
          </p>
          <h1 className="mt-2 text-4xl font-bold text-white">MES JOUEURS</h1>
          <p className="mt-2 text-white/60">
            Consultez votre effectif et gérez la situation sportive et contractuelle de chaque joueur.
          </p>
        </header>
        <PlayerRosterTable />
      </div>
    </div>
  )
}

export default RosterManagement
