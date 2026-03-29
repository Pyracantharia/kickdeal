'use client'

import React, { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { MOCK_CLUB_PLAYERS, POSITION_FILTERS } from '@/features/club/mockRoster'
import type { ClubPlayer } from '@/features/club/types/roster'
import PlayerActionsModal from './modals/PlayerActionsModal'
import PlayerDetailsCard from './PlayerDetailsCard'

function PlayerRosterTable() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('')
  const [selectedPlayer, setSelectedPlayer] = useState<ClubPlayer | null>(null)
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false)

  const filteredPlayers = useMemo(() => {
    return MOCK_CLUB_PLAYERS.filter((player) => {
      const matchesSearch =
        searchTerm === '' ||
        player.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.lastName.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesPosition = selectedPosition === '' || player.position === selectedPosition

      return matchesSearch && matchesPosition
    })
  }, [searchTerm, selectedPosition])

  const handlePlayerAction = (player: ClubPlayer) => {
    setSelectedPlayer(player)
  }

  const handleOpenActionsModal = () => {
    setIsActionsModalOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Normal':
        return 'text-brand-cyan'
      case 'Blessé':
        return 'text-red-400'
      case 'Suspendu':
        return 'text-yellow-400'
      default:
        return 'text-white'
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/60" />
        <input
          type="text"
          placeholder="Rechercher un joueur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 pl-12 pr-4 py-3 text-white placeholder-white/40 focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan/50"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {POSITION_FILTERS.map((position) => (
          <button
            key={position.id}
            onClick={() => setSelectedPosition(position.code)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              selectedPosition === position.code
                ? 'bg-brand-cyan text-[#0d1526]'
                : 'border border-white/20 bg-white/5 text-white hover:border-brand-cyan hover:bg-white/10'
            }`}
          >
            {position.label}
          </button>
        ))}
      </div>

      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0 overflow-x-auto rounded-lg border border-white/10 bg-white/5 backdrop-blur">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/10">
                <th className="px-6 py-4 text-left text-xs font-bold text-brand-cyan uppercase">
                  Poste
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-brand-cyan uppercase">
                  Nom
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-brand-cyan uppercase">
                  Âge
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-brand-cyan uppercase">
                  Valeur
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-brand-cyan uppercase">
                  Salaire
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-brand-cyan uppercase">
                  Contrat
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-brand-cyan uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player) => (
                <tr
                  key={player.id}
                  onClick={() => handlePlayerAction(player)}
                  className={`border-b border-white/10 hover:bg-white/10 transition-colors cursor-pointer ${
                    selectedPlayer?.id === player.id ? 'bg-white/20' : ''
                  }`}
                >
                  <td className="px-6 py-4 text-sm font-semibold text-brand-cyan">
                    {player.position}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center text-white text-xs font-bold">
                        {player.firstName.charAt(0)}{player.lastName.charAt(0)}
                      </div>
                      <div className="text-white font-medium">
                        {player.firstName} {player.lastName}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-white/80">{player.age}</td>
                  <td className="px-6 py-4 text-sm font-medium text-brand-cyan">
                    {player.marketValue}
                  </td>
                  <td className="px-6 py-4 text-sm text-white/80">{player.weeklySalary}</td>
                  <td className="px-6 py-4 text-sm text-white/80">{player.contract} ans</td>
                  <td className={`px-6 py-4 text-sm font-semibold ${getStatusColor(player.status)}`}>
                    {player.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPlayers.length === 0 && (
            <div className="py-12 text-center text-white/60">
              Aucun joueur trouvé avec ces critères
            </div>
          )}
        </div>

        {selectedPlayer && (
          <PlayerDetailsCard
            player={selectedPlayer}
            onActionsClick={handleOpenActionsModal}
          />
        )}
      </div>

      <PlayerActionsModal
        isOpen={isActionsModalOpen}
        onClose={() => setIsActionsModalOpen(false)}
        player={selectedPlayer}
      />
    </div>
  )
}

export default PlayerRosterTable