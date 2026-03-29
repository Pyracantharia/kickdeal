'use client'

import React from 'react'
import PlayerRosterTable from './PlayerRosterTable'

function RosterManagement() {
  return (
    <div className="auth-bg min-h-screen w-full pt-28 pb-10 px-4">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">GESTION D'EFFECTIF</h1>
          <div className="h-1 w-32 bg-gradient-to-r from-brand-cyan to-brand-purple rounded-full"></div>
        </div>
        <PlayerRosterTable />
      </div>
    </div>
  )
}

export default RosterManagement