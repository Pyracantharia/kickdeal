'use client'

import React from 'react'
import Modal from '@/components/ui/Modal'
import type { Club } from '@/features/market/types/player'

interface ClubSearchModalProps {
  isOpen: boolean
  onClose: () => void
  clubs: Club[]
  onSelect: (club: Club) => void
  selectedClubId?: string
}

function ClubSearchModal({
  isOpen,
  onClose,
  clubs,
  onSelect,
  selectedClubId,
}: ClubSearchModalProps) {
  const handleSelectClub = (club: Club) => {
    onSelect(club)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choisir un club">
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {clubs.map((club) => (
          <button
            key={club.id}
            onClick={() => handleSelectClub(club)}
            className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
              selectedClubId === club.id
                ? 'border-brand-purple bg-brand-purple/10 text-white'
                : 'border-white/10 bg-white/5 text-white/80 hover:border-brand-purple/50 hover:bg-white/10'
            }`}
          >
            <p className="font-semibold">{club.label}</p>
          </button>
        ))}
      </div>
    </Modal>
  )
}

export default ClubSearchModal