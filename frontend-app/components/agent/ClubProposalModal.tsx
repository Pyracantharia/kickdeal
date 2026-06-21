'use client'

import React, { useEffect, useState } from 'react'
import { CheckCircle2, Send, ShieldAlert } from 'lucide-react'

import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import CircleImage from '@/components/media/CircleImage'
import type { Player } from '@/features/market/types/player'
import {
  agentPlayersManager,
  type ProspectClub,
} from '@/features/agent/agentPlayers'

interface ClubProposalModalProps {
  isOpen: boolean
  onClose: () => void
  player: Player
  club: ProspectClub | null
  suggestedMessage: string
  canContact: boolean
  blockedReason?: string
  onSubmitted: () => void
}

function ClubProposalModal({
  isOpen,
  onClose,
  player,
  club,
  suggestedMessage,
  canContact,
  blockedReason,
  onSubmitted,
}: ClubProposalModalProps) {
  const [message, setMessage] = useState(suggestedMessage)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setMessage(suggestedMessage)
      setErrorMessage(null)
    }
  }, [isOpen, suggestedMessage, club?.id])

  if (!club) return null
  const selectedClub = club

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canContact || !message.trim()) return

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const response = await agentPlayersManager.createClubProspect(player.id, selectedClub.id, message)
      if (!response.ok) {
        setErrorMessage(readError(response.data, 'Impossible d’envoyer la proposition.'))
        return
      }

      onSubmitted()
      onClose()
    } catch {
      setErrorMessage('Impossible d’envoyer la proposition.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`PROPOSER ${player.lastName.toUpperCase()} À ${club.name.toUpperCase()}`}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-3 rounded-xl border border-white/15 bg-white/5 p-4 sm:grid-cols-2">
          <SummaryItem label="Joueur" value={`${player.firstName} ${player.lastName}`} />
          <div className="flex items-center gap-3">
            <ClubLogo club={club} />
            <SummaryItem label="Club ciblé" value={club.name} />
          </div>
          <SummaryItem label="Compatibilité" value={`${club.compatibilityScore}%`} accent />
          <SummaryItem label="Potentiel d’intérêt" value={club.interestPotential} />
        </div>

        {!canContact && (
          <div className="flex gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            {blockedReason ?? 'Ce joueur est sous contrat. Vous devez obtenir l’autorisation du club actuel avant de le proposer.'}
          </div>
        )}

        {club.contact ? (
          <div className="flex gap-3 rounded-xl border border-brand-cyan/30 bg-brand-cyan/10 p-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-cyan" />
            <div>
              <p className="font-semibold text-white">Club déjà contacté</p>
              <p className="mt-1 text-sm text-white/60">
                Une proposition a déjà été envoyée pour ce joueur.
              </p>
            </div>
          </div>
        ) : (
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white">
              Message de prise de contact
            </span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={10}
              className="w-full resize-none rounded-xl border border-white/15 bg-[#071722]/80 px-4 py-3 text-sm leading-6 text-white focus:border-brand-cyan focus:outline-none"
            />
            <span className="mt-2 block text-xs text-white/45">
              Ce message est enregistré avec la proposition. La messagerie pourra reprendre cet échange lorsqu’elle sera connectée.
            </span>
          </label>
        )}

        {errorMessage && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        {!club.contact && (
          <Button
            type="submit"
            className="w-full"
            disabled={!canContact || !message.trim()}
            isLoading={isSubmitting}
            icon={<Send className="h-4 w-4" />}
          >
            Envoyer la proposition
          </Button>
        )}
      </form>
    </Modal>
  )
}

function SummaryItem({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-white/45">{label}</p>
      <p className={`mt-1 font-semibold ${accent ? 'text-brand-cyan' : 'text-white'}`}>{value}</p>
    </div>
  )
}

function ClubLogo({ club }: { club: ProspectClub }) {
  const fallback = (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 font-bold text-white">
      {club.name.charAt(0)}
    </div>
  )

  if (!club.logoUrl) return fallback

  return (
    <CircleImage
      src={club.logoUrl}
      alt={club.name}
      className="relative h-11 w-11 shrink-0 overflow-hidden"
      sizes="44px"
      imageClassName="object-contain"
      fallback={fallback}
    />
  )
}

function readError(data: unknown, fallback: string): string {
  if (typeof data !== 'object' || data === null) return fallback
  if ('errorMessage' in data && typeof data.errorMessage === 'string') return data.errorMessage
  if ('message' in data && typeof data.message === 'string') return data.message

  return fallback
}

export default ClubProposalModal
