'use client'

import React from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import type { SentOffer, ReceivedOffer } from '@/features/market/types/transfer'
import { ArrowDownLeft, ArrowUpRight, Check, Clock3 } from 'lucide-react'
import CircleImage from '@/components/media/CircleImage'
import { getPositionDisplayName } from '@/features/players/position'

interface OfferDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  offer: SentOffer | ReceivedOffer
  type: 'sent' | 'received'
  onSubmitNewOffer?: () => void
  onAccept?: () => void
  onNegotiate?: () => void
  onReject?: () => void
}

function OfferDetailsModal({
  isOpen,
  onClose,
  offer,
  type,
  onSubmitNewOffer,
  onAccept,
  onNegotiate,
  onReject,
}: OfferDetailsModalProps) {
  const isSent = type === 'sent'
  const isSelling = offer.viewerRole === 'seller'
  const counterpartyClub = isSelling ? offer.fromClub : offer.toClub
  const directionLabel = isSelling ? 'Vente' : 'Achat'
  const directionDetail = isSelling ? `à ${counterpartyClub}` : `auprès de ${counterpartyClub}`
  const DirectionIcon = isSelling ? ArrowUpRight : ArrowDownLeft
  const contractResolution = offer.contractResolution
  const isPendingContractAgreement = offer.negociationStatus === 'pending_agent' && Boolean(contractResolution)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Détails de l'offre">
      <div className="flex flex-col gap-4">
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-3">
            {offer.player.photoUrl ? (
              <CircleImage
                src={offer.player.photoUrl}
                alt={`${offer.player.firstName} ${offer.player.lastName}`}
                className="relative h-12 w-12 overflow-hidden rounded-full border border-white/20 shrink-0"
                sizes="48px"
                fallback={
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center text-white font-bold shrink-0">
                    {offer.player.firstName.charAt(0)}{offer.player.lastName.charAt(0)}
                  </div>
                }
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center text-white font-bold shrink-0">
                {offer.player.firstName.charAt(0)}{offer.player.lastName.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-white font-semibold">
                {offer.player.firstName} {offer.player.lastName}
              </p>
              <p className="text-white/60 text-sm">
                {getPositionDisplayName(offer.player.position)} • {offer.player.age} ans
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Nature de l&apos;offre</h3>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
              isSelling
                ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300'
                : 'border-brand-purple/60 bg-brand-purple/15 text-brand-purple'
            }`}
          >
            <DirectionIcon className="h-3.5 w-3.5" />
            {directionLabel}
          </span>
        </div>

        <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
          <span className="text-white/80 text-sm">{isSelling ? 'Vous vendez' : 'Vous achetez'}</span>
          <span className="text-white font-semibold">{directionDetail}</span>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Statut de l&apos;offre</h3>
          <span
            className={`px-4 py-1 rounded-full font-semibold text-xs ${
              offer.status === 'accepted'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                : offer.status === 'pending'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                  : 'bg-red-500/20 text-red-400 border border-red-500/50'
            }`}
          >
            {offer.status === 'accepted'
              ? 'Accord trouvé'
              : offer.status === 'pending'
                ? '⏱ En attente'
                : '✗ Rejetée'}
          </span>
        </div>

        {isPendingContractAgreement && contractResolution && (
          <div className="rounded-xl border border-amber-300/35 bg-amber-300/10 p-4">
            <div className="flex gap-3">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" />
              <div>
                <p className="font-semibold text-white">Transfert pas encore finalisé</p>
                <p className="mt-1 text-sm text-white/65">
                  {contractResolution.viewerRole === 'buyer'
                    ? contractResolution.playerHasAgent
                      ? `Le joueur ne rejoindra ${contractResolution.buyerTeamName ?? 'votre club'} qu’après un accord contractuel avec son agent.`
                      : 'Le joueur ne rejoindra votre club qu’après résolution du contrat joueur.'
                    : contractResolution.playerHasAgent
                      ? `Le joueur restera dans votre effectif jusqu’à ce que ${contractResolution.buyerTeamName ?? 'le club acheteur'} conclue un accord contractuel avec son agent.`
                      : `Le joueur restera dans votre effectif jusqu’à la résolution du contrat joueur avec ${contractResolution.buyerTeamName ?? 'le club acheteur'}.`}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
            <span className="text-white/80">Montant du transfert</span>
            <span className="text-brand-cyan font-bold text-lg">{offer.amount}</span>
          </div>

          {offer.paymentStructure && (
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-white/80 text-sm mb-1">Structure de paiement</p>
              <p className="text-white font-semibold">{offer.paymentStructure}</p>
              {offer.paymentPerInstallment && (
                <p className="text-white/60 text-xs mt-1">{offer.paymentPerInstallment}</p>
              )}
            </div>
          )}

          {offer.performanceBonus && (
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm mb-1">Bonus de performance</p>
                  <p className="text-brand-cyan font-bold">{offer.performanceBonus}</p>
                </div>
                <span className="px-2 py-1 rounded bg-brand-purple/40 text-brand-purple text-xs font-semibold border border-brand-purple/50">
                  Bonus
                </span>
              </div>
              {offer.performanceBonusCondition && (
                <p className="text-white/60 text-xs mt-2">Condition : {offer.performanceBonusCondition}</p>
              )}
            </div>
          )}

          {offer.resalePercentage && (
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
              <span className="text-white/80">Clause de revente</span>
              <span className="text-brand-cyan font-bold text-lg">{offer.resalePercentage}</span>
            </div>
          )}

          {offer.advancedOptions && offer.advancedOptions.length > 0 && (
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-white/80 text-sm mb-2">Options avancées</p>
              <div className="space-y-2">
                {offer.advancedOptions.map((option, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-brand-cyan" />
                    <span className="text-white text-sm">{option}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {offer.customMessage && (
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-white/80 text-sm mb-2">Message personnalisé</p>
              <p className="text-white italic text-sm">&quot;{offer.customMessage}&quot;</p>
            </div>
          )}

          {!isSent && (
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
              <span className="text-white/80 text-sm">Club émetteur</span>
              <span className="text-white font-semibold">{(offer as ReceivedOffer).fromClub}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          {isSent && offer.status === 'rejected' && onSubmitNewOffer && (
            <Button type="button" onClick={onSubmitNewOffer} className="w-full">
              Soumettre une nouvelle offre
            </Button>
          )}

          {!isSent && offer.status === 'pending' && (
            <>
              {onAccept && (
                <Button type="button" onClick={onAccept} className="w-full">
                  Accepter
                </Button>
              )}
              {onNegotiate && (
                <Button type="button" onClick={onNegotiate} variant="secondary" className="w-full">
                  Négocier
                </Button>
              )}
              {onReject && (
                <Button type="button" onClick={onReject} variant="ghost" className="w-full text-red-400">
                  Rejeter
                </Button>
              )}
            </>
          )}

          <Button type="button" onClick={onClose} variant="ghost" className="w-full text-white/60 mt-2">
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default OfferDetailsModal
