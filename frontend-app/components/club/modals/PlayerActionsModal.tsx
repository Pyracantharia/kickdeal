'use client'

import React, { useState } from 'react'
import { CheckCircle2, Mail, ShieldAlert, Users, History, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import type { ClubPlayer } from '@/features/club/types/roster'
import { clubManager } from '@/features/club/club'
import {
  contractsManager,
  type ContractNegotiationType,
} from '@/features/contracts/contracts'

interface PlayerActionsModalProps {
  isOpen: boolean
  onClose: () => void
  player: ClubPlayer | null
  onPlayerUpdated: () => void
}

function PlayerActionsModal({ isOpen, onClose, player, onPlayerUpdated }: PlayerActionsModalProps) {
  const router = useRouter()
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [revocationNotice, setRevocationNotice] = useState<{
    playerName: string
    isOpen: boolean
  }>({
    playerName: '',
    isOpen: false,
  })

  if (!player) return null
  const playerId = player.id
  const marketContext = player.marketContext
  const marketStatus = player.marketStatusValue ?? 'not_listed'
  const marketMessage = getClubMarketMessage(player)

  async function openContractNegotiation(
    type: Exclude<ContractNegotiationType, 'transfer'>,
    focus: 'contract' | 'duration' | 'salary' | 'release-clause' | 'termination',
  ) {
    setPendingAction(focus)
    setErrorMessage(null)

    try {
      const response = await contractsManager.startForPlayer(playerId, type)
      if (!response.ok) {
        setErrorMessage(readError(response.data, 'Impossible d’ouvrir cette négociation.'))
        return
      }

      onClose()
      router.push(`/negociations/${response.data.negotiation.id}?focus=${focus}`)
    } catch {
      setErrorMessage('Impossible d’ouvrir cette négociation.')
    } finally {
      setPendingAction(null)
    }
  }

  async function updateMarketStatus(status: 'on_market' | 'loan_listed' | 'not_listed') {
    setPendingAction(status)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const response = await clubManager.updatePlayerMarketStatus(playerId, status)
      if (!response.ok) {
        setErrorMessage(readError(response.data, 'Impossible de modifier le statut marché.'))
        return
      }

      setSuccessMessage(response.data.message)
      onPlayerUpdated()
    } catch {
      setErrorMessage('Impossible de modifier le statut marché.')
    } finally {
      setPendingAction(null)
    }
  }

  async function decideAuthorization(decision: 'approved' | 'rejected' | 'revoked') {
    setPendingAction(decision)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const response = await clubManager.decidePlayerMarketAuthorization(playerId, decision)
      if (!response.ok) {
        setErrorMessage(readError(response.data, 'Impossible de traiter cette demande.'))
        return
      }

      setSuccessMessage(response.data.message)
      if (decision === 'revoked' && response.data.wasRemovedFromMarket) {
        setRevocationNotice({
          isOpen: true,
          playerName: `${player.firstName} ${player.lastName}`,
        })
      }
      onPlayerUpdated()
    } catch {
      setErrorMessage('Impossible de traiter cette demande.')
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`ACTIONS - ${player.firstName.toUpperCase()} ${player.lastName.toUpperCase()}`}
      >
        <div className="space-y-6 max-h-96 overflow-y-auto">
        <div>
          <h4 className="text-brand-cyan font-bold mb-3 flex items-center gap-2 uppercase text-sm">
            Transferts
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {marketStatus === 'on_market' ? (
              <ActionButton
                label="Retirer de la liste des transferts"
                onClick={() => updateMarketStatus('not_listed')}
                isLoading={pendingAction === 'not_listed'}
              />
            ) : (
              <ActionButton
                label="Ajouter à la liste des transferts"
                onClick={() => updateMarketStatus('on_market')}
                isLoading={pendingAction === 'on_market'}
              />
            )}
            {marketStatus === 'loan_listed' ? (
              <ActionButton
                label="Retirer de la liste de prêt"
                onClick={() => updateMarketStatus('not_listed')}
                isLoading={pendingAction === 'not_listed'}
              />
            ) : (
              <ActionButton
                label="Ajouter à la liste de prêt"
                onClick={() => updateMarketStatus('loan_listed')}
                isLoading={pendingAction === 'loan_listed'}
              />
            )}
            <ActionButton label="Fixer une valeur marchande" />
            <ActionButton label="Définir prix minimum accepté" />
          </div>
          {marketMessage && (
            <p className="mt-3 rounded-lg border border-brand-cyan/25 bg-brand-cyan/10 px-3 py-2 text-xs text-white/70">
              {marketMessage}
            </p>
          )}
        </div>

        <div>
          <h4 className="text-brand-purple font-bold mb-3 flex items-center gap-2 uppercase text-sm">
            Contrat
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <ActionButton
              label="Négocier contrat"
              onClick={() => openContractNegotiation('renewal', 'contract')}
              isLoading={pendingAction === 'contract'}
            />
            <ActionButton
              label="Prolonger contrat"
              onClick={() => openContractNegotiation('renewal', 'duration')}
              isLoading={pendingAction === 'duration'}
            />
            <ActionButton
              label="Libérer le joueur"
              onClick={() => openContractNegotiation('termination', 'termination')}
              isLoading={pendingAction === 'termination'}
            />
            <ActionButton
              label="Ajouter clause libératoire"
              onClick={() => openContractNegotiation('renewal', 'release-clause')}
              isLoading={pendingAction === 'release-clause'}
            />
            <ActionButton
              label="Modifier salaire"
              onClick={() => openContractNegotiation('renewal', 'salary')}
              isLoading={pendingAction === 'salary'}
            />
          </div>
        </div>

        <div>
          <h4 className="text-brand-cyan font-bold mb-3 flex items-center gap-2 uppercase text-sm">
            <Users className="h-4 w-4" />
            Agent
          </h4>
          {marketContext?.state === 'pending' && (
            <div className="mb-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
              <div className="flex items-start gap-2">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                <div className="min-w-0">
                  <p className="font-semibold text-white">Demande d’autorisation en attente</p>
                  <p className="mt-1 text-xs leading-5 text-white/65">
                    L’agent souhaite pouvoir proposer activement ce joueur à d’autres clubs.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ActionButton
                      label="Accorder l’autorisation"
                      icon={<CheckCircle2 className="h-4 w-4" />}
                      onClick={() => decideAuthorization('approved')}
                      isLoading={pendingAction === 'approved'}
                    />
                    <ActionButton
                      label="Refuser l’autorisation"
                      icon={<XCircle className="h-4 w-4" />}
                      onClick={() => decideAuthorization('rejected')}
                      isLoading={pendingAction === 'rejected'}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          {marketContext?.authorizationStatus === 'approved' && (
            <div className="mb-3 rounded-xl border border-brand-cyan/25 bg-brand-cyan/10 p-3 text-sm text-white/80">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" />
                <div className="min-w-0">
                  <p className="font-semibold text-white">Autorisation active</p>
                  <p className="mt-1 text-xs leading-5 text-white/65">
                    L’agent peut actuellement proposer ce joueur à d’autres clubs. Vous pouvez retirer cette autorisation à tout moment.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ActionButton
                      label="Retirer l’autorisation"
                      icon={<XCircle className="h-4 w-4" />}
                      onClick={() => decideAuthorization('revoked')}
                      isLoading={pendingAction === 'revoked'}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <ActionButton label="Voir l'agent" icon={<Users className="h-4 w-4" />} />
            <ActionButton label="Contacter l'agent" icon={<Mail className="h-4 w-4" />} />
            <ActionButton label="Historique des discussions" icon={<History className="h-4 w-4" />} />
            <ActionButton label="Changer d'agent" />
          </div>
        </div>

        {errorMessage && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
            {successMessage}
          </p>
        )}
        </div>
      </Modal>
      <Modal
        isOpen={revocationNotice.isOpen}
        onClose={() => setRevocationNotice({ isOpen: false, playerName: '' })}
        title="Autorisation retirée"
        className="max-w-lg"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-6 text-white/80">
            Vous avez retiré à l’agent l’autorisation de proposer <span className="font-semibold text-white">{revocationNotice.playerName}</span> à d’autres clubs.
            Comme le joueur avait déjà été placé sur le marché par l’agent, il a été automatiquement retiré de la liste du marché.
          </div>
          <p className="text-sm text-white/60">
            Le joueur n’est désormais plus visible sur le marché tant que vous ne le remettez pas vous-même en vente ou que vous n’accordez pas une nouvelle autorisation.
          </p>
          <Button
            type="button"
            className="w-full"
            onClick={() => setRevocationNotice({ isOpen: false, playerName: '' })}
          >
            Compris
          </Button>
        </div>
      </Modal>
    </>
  )
}

function ActionButton({
  label,
  icon,
  onClick,
  isLoading = false,
}: {
  label: string
  icon?: React.ReactNode
  onClick?: () => void
  isLoading?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-left text-xs text-white transition-all hover:border-brand-cyan/50 hover:bg-white/10 disabled:cursor-wait disabled:opacity-60"
    >
      {icon}
      <span>{isLoading ? 'Traitement...' : label}</span>
    </button>
  )
}

function readError(data: unknown, fallback: string): string {
  if (typeof data !== 'object' || data === null) return fallback
  if ('errorMessage' in data && typeof data.errorMessage === 'string') return data.errorMessage
  if ('message' in data && typeof data.message === 'string') return data.message

  return fallback
}

function getClubMarketMessage(player: ClubPlayer): string | null {
  const marketContext = player.marketContext

  if (marketContext?.state === 'pending') {
    return 'Une demande d’autorisation de prospection de l’agent est en attente de votre décision.'
  }

  if (player.marketStatusValue === 'on_market') {
    return 'Ce joueur est actuellement sur la liste des transferts de votre club.'
  }

  if (player.marketStatusValue === 'loan_listed') {
    return 'Ce joueur est actuellement sur la liste de prêt de votre club.'
  }

  if (player.contractStatus === 'free_agent') {
    return 'Ce joueur est libre. Vous pouvez définir sa visibilité marché directement.'
  }

  return 'Ce joueur est sous contrat dans votre effectif. Vous pouvez le placer sur le marché directement.'
}

export default PlayerActionsModal
