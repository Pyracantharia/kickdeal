'use client'

import React from 'react'
import Modal from '@/components/ui/Modal'
import type { Position } from '@/features/market/types/player'

interface PositionSearchModalProps {
  isOpen: boolean
  onClose: () => void
  positions: Position[]
  onSelect: (position: Position) => void
  selectedPositionId?: string
}

function PositionSearchModal({
  isOpen,
  onClose,
  positions,
  onSelect,
  selectedPositionId,
}: PositionSearchModalProps) {
  const handleSelectPosition = (position: Position) => {
    onSelect(position)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choisir un poste">
      <div className="space-y-2">
        {positions.map((position) => (
          <button
            key={position.id}
            onClick={() => handleSelectPosition(position)}
            className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
              selectedPositionId === position.id
                ? 'border-brand-purple bg-brand-purple/10 text-white'
                : 'border-white/10 bg-white/5 text-white/80 hover:border-brand-purple/50 hover:bg-white/10'
            }`}
          >
            <p className="font-semibold">{position.label}</p>
          </button>
        ))}
      </div>
    </Modal>
  )
}

export default PositionSearchModal