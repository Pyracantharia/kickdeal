'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, FileCheck2, Search, ShieldCheck, Upload, UserPlus } from 'lucide-react'

import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import CircleImage from '@/components/media/CircleImage'
import type { Player } from '@/features/market/types/player'
import { agentPlayersManager } from '@/features/agent/agentPlayers'
import { getPositionDisplayName } from '@/features/players/position'

interface AddRepresentedPlayerModalProps {
  isOpen: boolean
  onClose: () => void
  pendingPlayerIds: Set<string>
  onSubmitted: () => void
  initialQuery?: string
}

function AddRepresentedPlayerModal({
  isOpen,
  onClose,
  pendingPlayerIds,
  onSubmitted,
  initialQuery = '',
}: AddRepresentedPlayerModalProps) {
  const [query, setQuery] = useState('')
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [document, setDocument] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || selectedPlayer) return

    const timer = window.setTimeout(async () => {
      setIsSearching(true)
      setErrorMessage(null)

      try {
        const response = await agentPlayersManager.searchCandidates(query)
        if (response.ok) {
          setPlayers(response.data.players ?? [])
        } else {
          setErrorMessage(readError(response.data, 'Impossible de rechercher les joueurs.'))
        }
      } catch {
        setErrorMessage('Impossible de rechercher les joueurs.')
      } finally {
        setIsSearching(false)
      }
    }, 250)

    return () => window.clearTimeout(timer)
  }, [isOpen, query, selectedPlayer])

  useEffect(() => {
    if (isOpen) return
    setQuery(initialQuery)
    setPlayers([])
    setSelectedPlayer(null)
    setDocument(null)
    setMessage('')
    setErrorMessage(null)
  }, [initialQuery, isOpen])

  useEffect(() => {
    if (!isOpen || selectedPlayer) return
    setQuery(initialQuery)
  }, [initialQuery, isOpen, selectedPlayer])

  const selectedPlayerName = useMemo(
    () => selectedPlayer ? `${selectedPlayer.firstName} ${selectedPlayer.lastName}` : '',
    [selectedPlayer],
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedPlayer || !document) {
      setErrorMessage('Ajoutez un justificatif officiel avant d’envoyer la demande.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const response = await agentPlayersManager.createRepresentationRequest(
        selectedPlayer.id,
        document,
        message,
      )

      if (!response.ok) {
        setErrorMessage(readError(response.data, 'Impossible d’envoyer la demande.'))
        return
      }

      onSubmitted()
      onClose()
    } catch {
      setErrorMessage('Impossible d’envoyer la demande.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={selectedPlayer ? `AJOUTER ${selectedPlayerName.toUpperCase()}` : 'AJOUTER UN JOUEUR'}
      className="max-w-2xl"
    >
      {selectedPlayer ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          <button
            type="button"
            onClick={() => {
              setSelectedPlayer(null)
              setDocument(null)
              setErrorMessage(null)
            }}
            className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Choisir un autre joueur
          </button>

          <div className="flex items-center gap-4 rounded-xl border border-brand-cyan/25 bg-brand-cyan/10 p-4">
            <PlayerAvatar player={selectedPlayer} />
            <div className="min-w-0">
              <p className="truncate font-bold text-white">{selectedPlayerName}</p>
              <p className="mt-1 text-sm text-white/60">
                {getPositionDisplayName(selectedPlayer.position)} · {selectedPlayer.age} ans · {selectedPlayer.club}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-brand-purple/30 bg-brand-purple/10 p-4">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-purple" />
              <div>
                <p className="font-semibold text-white">Vérification obligatoire</p>
                <p className="mt-1 text-sm leading-6 text-white/60">
                  Fournissez un mandat de représentation, un contrat d’agent ou tout document officiel
                  prouvant que vous représentez ce joueur. Un administrateur vérifiera la demande.
                </p>
              </div>
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white">
              Justificatif officiel <span className="text-red-400">*</span>
            </span>
            <span className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/25 bg-white/5 p-4 transition-colors hover:border-brand-cyan/60">
              {document ? (
                <FileCheck2 className="h-6 w-6 shrink-0 text-brand-cyan" />
              ) : (
                <Upload className="h-6 w-6 shrink-0 text-white/50" />
              )}
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-white">
                  {document?.name ?? 'Sélectionner un document'}
                </span>
                <span className="mt-1 block text-xs text-white/45">PDF, DOC, DOCX, JPG ou PNG · 10 Mo maximum</span>
              </span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="sr-only"
                onChange={(event) => setDocument(event.target.files?.[0] ?? null)}
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white">Message à l’administrateur</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={3}
              placeholder="Précisez le contexte de votre mandat si nécessaire..."
              className="w-full resize-none rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-brand-cyan focus:outline-none"
            />
          </label>

          {errorMessage && <ErrorMessage message={errorMessage} />}

          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={!document}
            className="w-full"
            icon={<UserPlus className="h-4 w-4" />}
          >
            Envoyer la demande
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="text-sm leading-6 text-white/60">
            Recherchez un joueur qui n’est pas encore rattaché à un agent sur KickDeal.
          </p>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/45" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nom du joueur ou club..."
              autoFocus
              className="w-full rounded-xl border border-white/15 bg-white/5 py-3 pl-12 pr-4 text-white placeholder:text-white/35 focus:border-brand-cyan focus:outline-none"
            />
          </div>

          {errorMessage && <ErrorMessage message={errorMessage} />}

          <div className="max-h-[430px] space-y-2 overflow-y-auto pr-1">
            {isSearching && <p className="py-10 text-center text-sm text-white/50">Recherche en cours...</p>}

            {!isSearching && players.map((player) => {
              const isPending = pendingPlayerIds.has(player.id)

              return (
                <button
                  key={player.id}
                  type="button"
                  disabled={isPending}
                  onClick={() => setSelectedPlayer(player)}
                  className="flex w-full items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-brand-cyan/50 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <PlayerAvatar player={player} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">
                      {player.firstName} {player.lastName}
                    </p>
                    <p className="mt-1 truncate text-sm text-white/55">
                      {getPositionDisplayName(player.position)} · {player.age} ans · {player.club}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-brand-cyan">
                    {isPending ? 'Demande en cours' : 'Sélectionner'}
                  </span>
                </button>
              )
            })}

            {!isSearching && players.length === 0 && (
              <div className="py-10 text-center text-white/50">
                <UserPlus className="mx-auto mb-3 h-8 w-8" />
                Aucun joueur disponible ne correspond à cette recherche.
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

function PlayerAvatar({ player }: { player: Player }) {
  const fallback = (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan text-sm font-bold text-white">
      {player.firstName.charAt(0)}{player.lastName.charAt(0)}
    </div>
  )

  if (!player.photoUrl) return fallback

  return (
    <CircleImage
      src={player.photoUrl}
      alt={`${player.firstName} ${player.lastName}`}
      className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/20"
      sizes="48px"
      fallback={fallback}
    />
  )
}

function ErrorMessage({ message }: { message: string }) {
  return <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{message}</div>
}

function readError(data: unknown, fallback: string): string {
  if (typeof data !== 'object' || data === null) return fallback
  if ('message' in data && typeof data.message === 'string') return data.message
  if ('errorMessage' in data && typeof data.errorMessage === 'string') return data.errorMessage

  return fallback
}

export default AddRepresentedPlayerModal
