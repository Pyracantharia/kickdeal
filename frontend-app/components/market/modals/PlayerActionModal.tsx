'use client'

import React from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import type { Player } from '@/features/market/types/player'

interface PlayerActionModalProps {
  isOpen: boolean
  onClose: () => void
  player: Player
  onApproachPurchase: () => void
  onApproachLoan: () => void
}

function PlayerActionModal({
  isOpen,
  onClose,
  player,
  onApproachPurchase,
  onApproachLoan,
}: PlayerActionModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Actions pour ${player.firstName} ${player.lastName}`}>
      <div className="flex flex-col gap-4">
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">
                {player.firstName} {player.lastName}
              </p>
              <p className="text-white/60 text-sm">
                {player.position} • {player.age} ans • {player.club}
              </p>
            </div>
            <p className="text-brand-cyan text-lg">👑</p>
          </div>
        </div>

        <Button type="button" onClick={onApproachPurchase} className="w-full">
          Approcher pour achat
        </Button>

        <Button type="button" onClick={onApproachLoan} variant="secondary" className="w-full">
          Approcher pour prêt
        </Button>
      </div>
    </Modal>
  )
}

export default PlayerActionModal