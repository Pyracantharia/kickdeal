'use client'

import React from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import CircleImage from '@/components/media/CircleImage'
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
            <div className="flex items-center gap-3">
              {player.photoUrl ? (
                <CircleImage
                  src={player.photoUrl}
                  alt={`${player.firstName} ${player.lastName}`}
                  className="relative h-12 w-12 overflow-hidden rounded-full border border-white/20"
                  sizes="48px"
                  fallback={
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan text-sm font-bold text-white">
                      {player.firstName.charAt(0)}{player.lastName.charAt(0)}
                    </div>
                  }
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan text-sm font-bold text-white">
                  {player.firstName.charAt(0)}{player.lastName.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-white font-semibold">
                  {player.firstName} {player.lastName}
                </p>
                <p className="text-white/60 text-sm">
                  {player.position} • {player.age} ans • {player.club}
                </p>
              </div>
            </div>
            {player.clubLogoUrl ? (
              <CircleImage
                src={player.clubLogoUrl}
                alt={player.club}
                className="relative h-10 w-10 overflow-hidden rounded-full"
                sizes="40px"
                imageClassName="object-contain p-1"
                fallback={<div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">{player.club.charAt(0).toUpperCase()}</div>}
              />
            ) : (
              <p className="text-brand-cyan text-lg">{player.club.charAt(0).toUpperCase()}</p>
            )}
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