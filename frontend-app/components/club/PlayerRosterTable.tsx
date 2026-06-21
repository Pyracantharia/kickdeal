'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, UsersRound } from 'lucide-react'
import type { ClubPlayer } from '@/features/club/types/roster'
import PlayerActionsModal from './modals/PlayerActionsModal'
import PlayerDetailsCard from './PlayerDetailsCard'
import CircleImage from '@/components/media/CircleImage'
import {
  getTransferFilterId,
  getTransferFilterLabel,
  playersManager,
} from '@/features/players/players'
import { getPositionDisplayName } from '@/features/players/position'

function PlayerRosterTable() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [players, setPlayers] = useState<ClubPlayer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<ClubPlayer | null>(null)
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false)

  const loadRoster = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await playersManager.getClubRoster()
      if (!response.ok) {
        setErrorMessage('Impossible de charger l’effectif du club.')
        return
      }

      const nextPlayers = response.data.players ?? []
      setPlayers(nextPlayers)
      setSelectedPlayer((current) => (
        nextPlayers.find((player) => player.id === current?.id) ?? nextPlayers[0] ?? null
      ))
    } catch {
      setErrorMessage('Impossible de charger l’effectif du club.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRoster()
  }, [loadRoster])

  const positionFilters = useMemo(
    () => [
      { id: '', label: 'Tous' },
      ...Array.from(new Set(players.map((player) => player.position)))
        .sort((a, b) => a.localeCompare(b))
        .map((position) => ({ id: position, label: getPositionDisplayName(position) })),
    ],
    [players],
  )

  const statusFilters = useMemo(
    () => [
      { id: '', label: 'Tous' },
      ...Array.from(new Set(players.map((player) => player.status)))
        .sort((a, b) => a.localeCompare(b))
        .map((status) => ({ id: status, label: status })),
    ],
    [players],
  )

  const filteredPlayers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('fr')

    return players.filter((player) => {
      const fullName = `${player.firstName} ${player.lastName}`.toLocaleLowerCase('fr')
      const matchesSearch = !normalizedSearch
        || fullName.includes(normalizedSearch)
        || player.nationality.toLocaleLowerCase('fr').includes(normalizedSearch)
      const matchesPosition = selectedPosition === '' || player.position === selectedPosition
      const matchesStatus = selectedStatus === '' || player.status === selectedStatus

      return matchesSearch && matchesPosition && matchesStatus
    })
  }, [players, searchTerm, selectedPosition, selectedStatus])

  const handlePlayerAction = (player: ClubPlayer) => {
    setSelectedPlayer(player)
  }

  const handleOpenActionsModal = () => {
    setIsActionsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
          {errorMessage}
        </div>
      )}

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/45" />
          <input
            type="search"
            placeholder="Rechercher un joueur ou une nationalité..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-xl border border-white/15 bg-[#071722]/70 py-3 pl-12 pr-4 text-white placeholder:text-white/35 focus:border-brand-cyan focus:outline-none"
          />
        </div>

        <FilterRow filters={positionFilters} value={selectedPosition} onChange={setSelectedPosition} />
        <FilterRow filters={statusFilters} value={selectedStatus} onChange={setSelectedStatus} />
      </div>

      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-white/15 bg-[#071722]/80 shadow-xl backdrop-blur">
          <div className="overflow-x-auto">
              <table className="w-full min-w-[1020px]">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <TableHeader>Poste</TableHeader>
                    <TableHeader>Joueur</TableHeader>
                    <TableHeader>Âge</TableHeader>
                    <TableHeader>Valeur</TableHeader>
                    <TableHeader>Salaire</TableHeader>
                    <TableHeader>Contrat</TableHeader>
                    <TableHeader>Marché</TableHeader>
                    <TableHeader>Disponibilité</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-white/55">
                        Chargement de votre effectif...
                      </td>
                    </tr>
                  )}

                {!isLoading && filteredPlayers.map((player) => (
                  <tr
                    key={player.id}
                    onClick={() => handlePlayerAction(player)}
                    className={`cursor-pointer border-b border-white/10 transition-colors last:border-b-0 hover:bg-white/10 ${
                      selectedPlayer?.id === player.id ? 'bg-brand-cyan/10' : ''
                    }`}
                  >
                    <td className="px-5 py-4 text-sm font-bold text-brand-cyan">{getPositionDisplayName(player.position)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <PlayerAvatar player={player} />
                        <div>
                          <p className="font-semibold text-white">{player.firstName} {player.lastName}</p>
                          <p className="mt-0.5 text-xs text-white/45">{player.nationality}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-white/70">{player.age}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-brand-cyan">{player.marketValue}</td>
                    <td className="px-5 py-4 text-sm text-white/70">{player.weeklySalary}</td>
                    <td className="px-5 py-4 text-sm text-white/65">{player.contract} an{player.contract === '1' ? '' : 's'}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <MarketBadge status={getTransferFilterLabel(player)} variant={getTransferFilterId(player)} />
                        {player.marketContext?.isListedByClub && (
                          <MarketBadge status="Listé par le club" variant="club-listed" />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={player.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isLoading && filteredPlayers.length === 0 && (
            <div className="px-6 py-14 text-center text-white/55">
              <UsersRound className="mx-auto mb-3 h-10 w-10 text-brand-cyan/70" />
              {players.length === 0
                ? 'Aucun joueur n’est actuellement rattaché à votre club.'
                : 'Aucun joueur ne correspond à ces critères.'}
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
        onPlayerUpdated={loadRoster}
      />
    </div>
  )
}

function FilterRow({
  filters,
  value,
  onChange,
}: {
  filters: Array<{ id: string; label: string }>
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {filters.map((filter) => (
        <button
          key={filter.id || 'all'}
          type="button"
          onClick={() => onChange(filter.id)}
          className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            value === filter.id
              ? 'bg-brand-cyan text-[#071722]'
              : 'border border-white/15 bg-white/5 text-white/65 hover:border-brand-cyan/50 hover:text-white'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return <th className="px-5 py-4 text-left text-xs font-bold uppercase text-brand-cyan">{children}</th>
}

function PlayerAvatar({ player }: { player: ClubPlayer }) {
  const fallback = (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan text-xs font-bold text-white">
      {player.firstName.charAt(0)}{player.lastName.charAt(0)}
    </div>
  )

  if (!player.photoUrl) return fallback

  return (
    <CircleImage
      src={player.photoUrl}
      alt={`${player.firstName} ${player.lastName}`}
      className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/20"
      sizes="36px"
      fallback={fallback}
    />
  )
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLocaleLowerCase('fr')
  const style = normalized.includes('bless')
    ? 'border-red-400/30 bg-red-400/10 text-red-300'
    : normalized.includes('suspend')
      ? 'border-amber-300/30 bg-amber-300/10 text-amber-200'
      : 'border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan'

  return <span className={`inline-flex rounded-lg border px-3 py-1 text-xs font-semibold ${style}`}>{status}</span>
}

function MarketBadge({
  status,
  variant,
}: {
  status: string
  variant: 'on_market' | 'loan_listed' | 'free_agent' | 'under_contract' | 'not_listed' | 'club-listed'
}) {
  const style = variant === 'on_market'
    ? 'border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan'
    : variant === 'loan_listed'
      ? 'border-brand-purple/30 bg-brand-purple/10 text-brand-purple'
      : variant === 'free_agent'
        ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
        : variant === 'club-listed'
          ? 'border-amber-400/30 bg-amber-400/10 text-amber-200'
          : 'border-white/15 bg-white/5 text-white/60'

  return <span className={`inline-flex rounded-lg border px-3 py-1 text-xs font-semibold ${style}`}>{status}</span>
}

export default PlayerRosterTable
