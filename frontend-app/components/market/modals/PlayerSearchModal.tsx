'use client'

import React, { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import type { Player } from '@/features/market/types/player'

interface PlayerSearchModalProps {
  isOpen: boolean
  onClose: () => void
  players: Player[]
  onSelect: (player: Player) => void
}

function PlayerSearchModal({
  isOpen,
  onClose,
  players,
  onSelect,
}: PlayerSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredPlayers = useMemo(() => {
    if (!searchTerm.trim()) return []
    const lowerTerm = searchTerm.toLowerCase()
    return players.filter(
      (p) =>
        p.firstName.toLowerCase().includes(lowerTerm) ||
        p.lastName.toLowerCase().includes(lowerTerm)
    )
  }, [searchTerm, players])

  const handleSelectPlayer = (player: Player) => {
    onSelect(player)
    setSearchTerm('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Recherche par nom">
      <div className="flex flex-col gap-4">
        <Input
          label="Nom du joueur"
          placeholder="Mbappé"
          icon={<Search className="h-5 w-5" />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
        />

        <div className="max-h-96 overflow-y-auto">
          {filteredPlayers.length === 0 && searchTerm.trim() ? (
            <div className="flex items-center justify-center py-8 text-center">
              <p className="text-sm text-white/60">Aucun joueur trouvé</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPlayers.map((player) => (
                <button
                  key={player.id}
                  onClick={() => handleSelectPlayer(player)}
                  className="w-full rounded-lg border border-brand-cyan/50 bg-white/5 p-3 text-left transition-all hover:border-brand-cyan hover:bg-brand-cyan/10"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">
                        {player.firstName} {player.lastName}
                      </p>
                      <p className="text-sm text-white/60">
                        {player.position} • {player.age} ans
                      </p>
                    </div>
                    <p className="text-xs text-brand-cyan">{player.club}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default PlayerSearchModal