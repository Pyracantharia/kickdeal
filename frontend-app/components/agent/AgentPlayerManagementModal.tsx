'use client'

import React, { useState } from 'react'
import { ArrowRightLeft, BriefcaseBusiness, Check, Eye, Search, ShieldAlert, ShieldCheck, UserRoundCheck, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import type { Player } from '@/features/market/types/player'
import { agentPlayersManager, type RepresentationRequest } from '@/features/agent/agentPlayers'

interface AgentPlayerManagementModalProps {
  isOpen: boolean
  onClose: () => void
  player: Player | null
  handoverRequest?: RepresentationRequest | null
  onPlayerUpdated: () => void
  onDecideHandover?: (requestId: string, decision: 'approve' | 'reject') => void
}

type MarketStatus = 'on_market' | 'loan_listed' | 'not_listed'

function AgentPlayerManagementModal({
  isOpen,
  onClose,
  player,
  handoverRequest = null,
  onPlayerUpdated,
  onDecideHandover,
}: AgentPlayerManagementModalProps) {
  const router = useRouter()
  const [updatingStatus, setUpdatingStatus] = useState<MarketStatus | null>(null)
  const [isRequestingAuthorization, setIsRequestingAuthorization] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!player) return null
  const marketContext = player.marketContext
  const marketStatus = player.marketStatusValue ?? 'not_listed'

  async function updateMarketStatus(status: MarketStatus) {
    if (!player) return
    setUpdatingStatus(status)
    setErrorMessage(null)

    try {
      const response = await agentPlayersManager.updateMarketStatus(player.id, status)
      if (!response.ok) {
        setErrorMessage(readError(response.data, 'Impossible de modifier le statut du joueur.'))
        return
      }

      onPlayerUpdated()
      onClose()
    } catch {
      setErrorMessage('Impossible de modifier le statut du joueur.')
    } finally {
      setUpdatingStatus(null)
    }
  }

  async function requestAuthorization() {
    if (!player) return
    setIsRequestingAuthorization(true)
    setErrorMessage(null)

    try {
      const response = await agentPlayersManager.requestMarketAuthorization(player.id)
      if (!response.ok) {
        setErrorMessage(readError(response.data, 'Impossible d’envoyer la demande d’autorisation.'))
        return
      }

      onPlayerUpdated()
    } catch {
      setErrorMessage('Impossible d’envoyer la demande d’autorisation.')
    } finally {
      setIsRequestingAuthorization(false)
    }
  }

  function navigate(path: string) {
    onClose()
    router.push(path)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`GESTION - ${player.firstName.toUpperCase()} ${player.lastName.toUpperCase()}`}
      className="max-w-2xl"
    >
      <div className="space-y-6">
        {handoverRequest && (
          <div className="rounded-xl border border-brand-cyan/35 bg-brand-cyan/10 px-4 py-4 text-sm">
            <div className="flex items-start gap-3">
              <UserRoundCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-cyan" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">Demande de passation validée par l’administration</p>
                <p className="mt-1 text-white/65">
                  {handoverRequest.requestingAgent?.name ?? 'Un autre agent'} souhaite récupérer ce joueur.
                  Vous pouvez accepter la passation ou la refuser.
                </p>
                {handoverRequest.message && (
                  <p className="mt-3 rounded-lg border border-white/10 bg-[#071722]/70 px-3 py-2 text-white/55">
                    {handoverRequest.message}
                  </p>
                )}
                {onDecideHandover && (
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => onDecideHandover(handoverRequest.id, 'reject')}
                      icon={<X className="h-4 w-4" />}
                    >
                      Refuser la passation
                    </Button>
                    <Button
                      type="button"
                      onClick={() => onDecideHandover(handoverRequest.id, 'approve')}
                      icon={<Check className="h-4 w-4" />}
                    >
                      Accepter la passation
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {marketContext && (
          <div className={`rounded-xl border px-4 py-4 text-sm ${
            marketContext.canAgentProspect
              ? 'border-brand-cyan/30 bg-brand-cyan/10 text-white/80'
              : 'border-amber-400/35 bg-amber-400/10 text-amber-100'
          }`}>
            <div className="flex items-start gap-3">
              {marketContext.canAgentProspect ? (
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-cyan" />
              ) : (
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">{marketContext.message}</p>
                {marketContext.state === 'listed_by_club' && (
                  <p className="mt-1 text-white/60">
                    Le club contrôle actuellement la visibilité marché de ce joueur.
                  </p>
                )}
                {!marketContext.canAgentSetMarketStatus && marketContext.actionLabel && (
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={requestAuthorization}
                      isLoading={isRequestingAuthorization}
                    >
                      {marketContext.actionLabel}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <ActionSection title="Visibilité sur le marché" icon={<ArrowRightLeft className="h-4 w-4" />}>
          {marketStatus === 'on_market' ? (
            <ActionButton
              label="Retirer de la liste des transferts"
              description="Le joueur ne sera plus affiché comme disponible au transfert."
              onClick={() => updateMarketStatus('not_listed')}
              isLoading={updatingStatus === 'not_listed'}
              disabled={Boolean(marketContext && !marketContext.canAgentSetMarketStatus)}
            />
          ) : (
            <ActionButton
              label="Ajouter à la liste des transferts"
              description="Le joueur peut recevoir des approches de transfert."
              onClick={() => updateMarketStatus('on_market')}
              isLoading={updatingStatus === 'on_market'}
              disabled={Boolean(marketContext && !marketContext.canAgentSetMarketStatus)}
            />
          )}
          {marketStatus === 'loan_listed' ? (
            <ActionButton
              label="Retirer de la liste de prêt"
              description="Le joueur ne sera plus proposé pour un prêt."
              onClick={() => updateMarketStatus('not_listed')}
              isLoading={updatingStatus === 'not_listed'}
              disabled={Boolean(marketContext && !marketContext.canAgentSetMarketStatus)}
            />
          ) : (
            <ActionButton
              label="Ajouter à la liste de prêt"
              description="Signaler aux clubs qu’un prêt peut être étudié."
              onClick={() => updateMarketStatus('loan_listed')}
              isLoading={updatingStatus === 'loan_listed'}
              disabled={Boolean(marketContext && !marketContext.canAgentSetMarketStatus)}
            />
          )}
        </ActionSection>

        <ActionSection title="Négociations" icon={<BriefcaseBusiness className="h-4 w-4" />} purple>
          <ActionButton
            label="Voir les négociations"
            description="Suivre les offres et les échanges en cours."
            onClick={() => navigate('/negociations')}
          />
          <ActionButton
            label="Rechercher un club"
            description="Comparer les clubs et préparer une proposition ciblée."
            onClick={() => navigate(`/mes-joueurs/${player.id}/clubs`)}
            icon={<Search className="h-4 w-4" />}
          />
        </ActionSection>

        <ActionSection title="Dossier joueur" icon={<ShieldCheck className="h-4 w-4" />}>
          <ActionButton
            label="Voir le profil complet"
            description="Consulter ses informations sportives et contractuelles."
            onClick={() => navigate(`/market/player/${player.id}`)}
            icon={<Eye className="h-4 w-4" />}
          />
        </ActionSection>

        {errorMessage && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {errorMessage}
          </div>
        )}
      </div>
    </Modal>
  )
}

function ActionSection({
  title,
  icon,
  purple = false,
  children,
}: {
  title: string
  icon: React.ReactNode
  purple?: boolean
  children: React.ReactNode
}) {
  return (
    <section>
      <h3 className={`mb-3 flex items-center gap-2 text-sm font-bold uppercase ${purple ? 'text-brand-purple' : 'text-brand-cyan'}`}>
        {icon}
        {title}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  )
}

function ActionButton({
  label,
  description,
  onClick,
  icon,
  isLoading = false,
  disabled = false,
}: {
  label: string
  description: string
  onClick: () => void
  icon?: React.ReactNode
  isLoading?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading || disabled}
      className="rounded-xl border border-white/15 bg-white/5 p-4 text-left transition-all hover:border-brand-cyan/50 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="flex items-center gap-2 text-sm font-semibold text-white">
        {icon}
        {isLoading ? 'Mise à jour...' : label}
      </span>
      <span className="mt-1.5 block text-xs leading-5 text-white/50">{description}</span>
    </button>
  )
}

function readError(data: unknown, fallback: string): string {
  if (typeof data !== 'object' || data === null) return fallback
  if ('message' in data && typeof data.message === 'string') return data.message
  if ('errorMessage' in data && typeof data.errorMessage === 'string') return data.errorMessage

  return fallback
}

export default AgentPlayerManagementModal
