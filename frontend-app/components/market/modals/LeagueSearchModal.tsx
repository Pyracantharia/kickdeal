'use client'

import React from 'react'
import Modal from '@/components/ui/Modal'
import type { League } from '@/features/market/types/player'

interface LeagueSearchModalProps {
  isOpen: boolean
  onClose: () => void
  leagues: League[]
  onSelect: (league: League) => void
  selectedLeagueId?: string
}

function LeagueSearchModal({
  isOpen,
  onClose,
  leagues,
  onSelect,
  selectedLeagueId,
}: LeagueSearchModalProps) {
  const handleSelectLeague = (league: League) => {
    onSelect(league)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choisir une ligue">
      <div className="space-y-2">
        {leagues.map((league) => (
          <button
            key={league.id}
            onClick={() => handleSelectLeague(league)}
            className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
              selectedLeagueId === league.id
                ? 'border-brand-cyan bg-brand-cyan/10 text-white'
                : 'border-white/10 bg-white/5 text-white/80 hover:border-brand-cyan/50 hover:bg-white/10'
            }`}
          >
            <p className="font-semibold">{league.label}</p>
          </button>
        ))}
      </div>
    </Modal>
  )
}

export default LeagueSearchModal