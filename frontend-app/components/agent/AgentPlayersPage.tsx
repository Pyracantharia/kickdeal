'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Clock3, Plus, Search, UserRoundCheck, UsersRound, X } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

import Button from '@/components/ui/Button'
import CircleImage from '@/components/media/CircleImage'
import { CountryFlag } from '@/components/media/CountryFlag'
import AgentPlayerDetailsCard from '@/components/agent/AgentPlayerDetailsCard'
import AddRepresentedPlayerModal from '@/components/agent/AddRepresentedPlayerModal'
import AgentPlayerManagementModal from '@/components/agent/AgentPlayerManagementModal'
import type { Player } from '@/features/market/types/player'
import {
  getTransferFilterId,
  getTransferFilterLabel,
  playersManager,
} from '@/features/players/players'
import { getPositionDisplayName } from '@/features/players/position'
import {
  agentPlayersManager,
  type RepresentationRequest,
} from '@/features/agent/agentPlayers'

function AgentPlayersPage() {
  const searchParams = useSearchParams()
  const [players, setPlayers] = useState<Player[]>([])
  const [requests, setRequests] = useState<RepresentationRequest[]>([])
  const [receivedHandoverRequests, setReceivedHandoverRequests] = useState<RepresentationRequest[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false)
  const hasHandledManagementLink = useRef(false)
  const hasHandledAddLink = useRef(false)

  const loadData = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoading(true)
    setErrorMessage(null)

    try {
      const requestResponse = await agentPlayersManager.getRepresentationRequests()
      if (requestResponse.ok) {
        setRequests(requestResponse.data.requests ?? [])
        setReceivedHandoverRequests(requestResponse.data.receivedHandoverRequests ?? [])
      }

      const rosterResponse = await playersManager.getAgentRoster()
      if (!rosterResponse.ok) {
        setErrorMessage('Impossible de charger vos joueurs.')
        return
      }

      const nextPlayers = rosterResponse.data.players ?? []
      setPlayers(nextPlayers)
      setSelectedPlayer((current) => (
        nextPlayers.find((player) => player.id === current?.id) ?? nextPlayers[0] ?? null
      ))
    } catch {
      setErrorMessage('Impossible de charger vos joueurs.')
    } finally {
      if (showLoader) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData(true)
  }, [loadData])

  useEffect(() => {
    if (hasHandledManagementLink.current || players.length === 0) return

    const searchParams = new URLSearchParams(window.location.search)
    const linkedPlayerId = searchParams.get('playerId')
    const shouldOpenManagement = searchParams.get('manage') === '1'
    if (!linkedPlayerId || !shouldOpenManagement) return

    const linkedPlayer = players.find((player) => player.id === linkedPlayerId)
    if (!linkedPlayer) return

    hasHandledManagementLink.current = true
    setSelectedPlayer(linkedPlayer)
    setIsManagementModalOpen(true)
  }, [players])

  useEffect(() => {
    if (hasHandledAddLink.current) return

    const searchParams = new URLSearchParams(window.location.search)
    const shouldOpenAddModal = searchParams.get('add') === '1'
    if (!shouldOpenAddModal) return

    hasHandledAddLink.current = true
    setIsAddModalOpen(true)
  }, [])

  const initialAddQuery = searchParams.get('query') ?? ''

  const positionFilters = useMemo(
    () => [
      { id: '', label: 'Tous' },
      ...Array.from(new Set(players.map((player) => player.position)))
        .sort((a, b) => a.localeCompare(b))
        .map((position) => ({ id: position, label: getPositionDisplayName(position) })),
    ],
    [players],
  )

  const statusFilters = [
    { id: '', label: 'Tous' },
    { id: 'on_market', label: 'Liste des transferts' },
    { id: 'loan_listed', label: 'Liste de prêt' },
    { id: 'free_agent', label: 'Libres' },
    { id: 'under_contract', label: 'Sous contrat' },
    { id: 'not_listed', label: 'Non listés' },
  ]

  const filteredPlayers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('fr')

    return players.filter((player) => {
      const fullName = `${player.firstName} ${player.lastName}`.toLocaleLowerCase('fr')
      const matchesSearch = !normalizedSearch
        || fullName.includes(normalizedSearch)
        || player.club.toLocaleLowerCase('fr').includes(normalizedSearch)
      const matchesPosition = !selectedPosition || player.position === selectedPosition
      const matchesStatus = !selectedStatus || getTransferFilterId(player) === selectedStatus || player.contractStatus === selectedStatus

      return matchesSearch && matchesPosition && matchesStatus
    })
  }, [players, searchTerm, selectedPosition, selectedStatus])

  const pendingRequests = useMemo(
    () => requests.filter((request) => ['pending', 'admin_approved'].includes(request.status)),
    [requests],
  )
  const pendingReceivedHandoverRequests = useMemo(
    () => receivedHandoverRequests.filter((request) => request.status === 'admin_approved'),
    [receivedHandoverRequests],
  )
  const selectedPlayerHandoverRequest = useMemo(
    () => pendingReceivedHandoverRequests.find((request) => request.player.id === selectedPlayer?.id) ?? null,
    [pendingReceivedHandoverRequests, selectedPlayer],
  )
  const pendingPlayerIds = useMemo(
    () => new Set(pendingRequests.map((request) => request.player.id)),
    [pendingRequests],
  )

  function handleRequestSubmitted() {
    setSuccessMessage('Demande envoyée. Elle sera traitée par la bonne partie avant ajout à votre portefeuille.')
    void loadData()
  }

  async function decideHandover(requestId: string, decision: 'approve' | 'reject') {
    setErrorMessage(null)
    setSuccessMessage(null)

    const response = decision === 'approve'
      ? await agentPlayersManager.approveRepresentationHandover(requestId)
      : await agentPlayersManager.rejectRepresentationHandover(requestId)

    if (!response.ok) {
      setErrorMessage(readError(response.data, 'Impossible de traiter la demande de passation.'))
      return
    }

    setSuccessMessage(response.data.message)
    setIsManagementModalOpen(false)
    void loadData()
  }

  return (
    <div className="auth-bg min-h-screen w-full px-4 pb-14 pt-36 md:px-8 md:pt-40">
      <div className="mx-auto w-full max-w-[1500px]">
        <header className="mb-8 flex flex-col gap-5 border-b border-white/10 pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-cyan">Portefeuille agent</p>
            <h1 className="mt-2 text-4xl font-bold text-white">MES JOUEURS</h1>
            <p className="mt-2 text-white/60">
              Gérez les joueurs que vous représentez et leur visibilité sur le marché.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            icon={<Plus className="h-4 w-4" />}
          >
            Ajouter un joueur
          </Button>
        </header>

        {errorMessage && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-brand-cyan/30 bg-brand-cyan/10 px-4 py-3 text-sm text-brand-cyan">
            <span>{successMessage}</span>
            <button type="button" onClick={() => setSuccessMessage(null)} className="text-white/60 hover:text-white">
              Fermer
            </button>
          </div>
        )}

        {pendingReceivedHandoverRequests.length > 0 && (
          <div className="mb-6 space-y-3 rounded-xl border border-brand-cyan/30 bg-brand-cyan/10 p-4">
            <div className="flex items-center gap-3">
              <UserRoundCheck className="h-5 w-5 text-brand-cyan" />
              <div>
                <p className="font-semibold text-white">Demandes de passation reçues</p>
                <p className="text-sm text-white/60">
                  Ces demandes ont été validées par l’administration et attendent votre décision.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {pendingReceivedHandoverRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col gap-3 rounded-lg border border-white/10 bg-[#071722]/80 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-white">
                      {request.player.firstName} {request.player.lastName}
                    </p>
                    <p className="text-sm text-white/55">
                      Demande de {request.requestingAgent?.name ?? 'Nouvel agent'}
                    </p>
                    {request.message && (
                      <p className="mt-1 text-sm text-white/45">{request.message}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => decideHandover(request.id, 'reject')}
                      icon={<X className="h-4 w-4" />}
                    >
                      Refuser
                    </Button>
                    <Button
                      type="button"
                      onClick={() => decideHandover(request.id, 'approve')}
                      icon={<Check className="h-4 w-4" />}
                    >
                      Accepter
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pendingRequests.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-brand-purple/30 bg-brand-purple/10 px-4 py-3">
            <Clock3 className="h-5 w-5 text-brand-purple" />
            <p className="text-sm text-white/75">
              {pendingRequests.length} demande{pendingRequests.length > 1 ? 's' : ''} joueur en attente :
            </p>
            {pendingRequests.map((request) => (
              <span key={request.id} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                {request.player.firstName} {request.player.lastName}
                <span className="ml-2 text-white/50">{agentRequestStatusLabel(request)}</span>
              </span>
            ))}
          </div>
        )}

        <div className="mb-5 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/45" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Rechercher un joueur ou un club..."
              className="w-full rounded-xl border border-white/15 bg-[#071722]/70 py-3 pl-12 pr-4 text-white placeholder:text-white/35 focus:border-brand-cyan focus:outline-none"
            />
          </div>

          <FilterRow
            filters={positionFilters}
            value={selectedPosition}
            onChange={setSelectedPosition}
          />
          <FilterRow
            filters={statusFilters}
            value={selectedStatus}
            onChange={setSelectedStatus}
          />
        </div>

        <div className="flex flex-col items-start gap-6 lg:flex-row">
          <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-white/15 bg-[#071722]/80 shadow-xl backdrop-blur">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px]">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <TableHeader>Poste</TableHeader>
                    <TableHeader>Joueur</TableHeader>
                    <TableHeader>Âge</TableHeader>
                    <TableHeader>Club actuel</TableHeader>
                    <TableHeader>Valeur</TableHeader>
                    <TableHeader>Fin de contrat</TableHeader>
                    <TableHeader>Statut</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-white/55">
                        Chargement de votre portefeuille...
                      </td>
                    </tr>
                  )}

                  {!isLoading && filteredPlayers.map((player) => (
                    <tr
                      key={player.id}
                      onClick={() => setSelectedPlayer(player)}
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
                            <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-white/45">
                              <CountryFlag country={player.nationality} className="h-3 w-5" />
                              {player.nationality}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-white/70">{player.age}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          {player.clubLogoUrl && (
                            <CircleImage
                              src={player.clubLogoUrl}
                              alt={player.club}
                              className="relative h-7 w-7 overflow-hidden"
                              sizes="28px"
                              fallback={
                                <div className="h-7 w-7 rounded-full border border-white/15 bg-white/5" />
                              }
                            />
                          )}
                          <span className="text-sm text-white/80">{player.club}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-brand-cyan">{player.marketValue ?? '-'}</td>
                      <td className="px-5 py-4 text-sm text-white/65">{formatContractYear(player.contractEndDate)}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge status={getTransferFilterLabel(player)} variant={getTransferFilterId(player)} />
                          {player.marketContext?.isListedByClub && (
                            <StatusBadge status="Listé par le club" variant="club-listed" />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!isLoading && filteredPlayers.length === 0 && (
              <div className="px-6 py-14 text-center text-white/55">
                <UsersRound className="mx-auto mb-3 h-10 w-10 text-brand-cyan/70" />
                {players.length === 0
                  ? 'Aucun joueur n’est encore rattaché à votre portefeuille.'
                  : 'Aucun joueur ne correspond à ces critères.'}
              </div>
            )}
          </div>

          {selectedPlayer && (
            <AgentPlayerDetailsCard
              player={selectedPlayer}
              handoverRequest={selectedPlayerHandoverRequest}
              onManage={() => setIsManagementModalOpen(true)}
              onDecideHandover={decideHandover}
            />
          )}
        </div>
      </div>

      <AddRepresentedPlayerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        pendingPlayerIds={pendingPlayerIds}
        onSubmitted={handleRequestSubmitted}
        initialQuery={initialAddQuery}
      />

      <AgentPlayerManagementModal
        isOpen={isManagementModalOpen}
        onClose={() => setIsManagementModalOpen(false)}
        player={selectedPlayer}
        handoverRequest={selectedPlayerHandoverRequest}
        onPlayerUpdated={() => void loadData()}
        onDecideHandover={decideHandover}
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

function PlayerAvatar({ player }: { player: Player }) {
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

function StatusBadge({
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

function formatContractYear(value?: string | null): string {
  if (!value) return '-'
  return new Date(`${value}T00:00:00`).getFullYear().toString()
}

function readError(data: unknown, fallback: string): string {
  if (data && typeof data === 'object') {
    const message = (data as { errorMessage?: unknown; message?: unknown }).errorMessage
      ?? (data as { message?: unknown }).message

    if (typeof message === 'string') {
      return message
    }
  }

  return fallback
}

function agentRequestStatusLabel(request: RepresentationRequest): string {
  if (request.type === 'agent_handover' && request.status === 'pending') {
    return 'Validation admin'
  }

  if (request.type === 'agent_handover' && request.status === 'admin_approved') {
    return 'Avis agent actuel'
  }

  return 'Validation admin'
}

export default AgentPlayersPage
