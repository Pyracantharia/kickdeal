'use client'

import React from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import type { SentOffer, ReceivedOffer } from '@/features/market/types/transfer'
import { Check } from 'lucide-react'

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Détails de l'offre">
      <div className="flex flex-col gap-4">
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center text-white font-bold shrink-0">
              {offer.player.firstName.charAt(0)}{offer.player.lastName.charAt(0)}
            </div>
            <div>
              <p className="text-white font-semibold">
                {offer.player.firstName} {offer.player.lastName}
              </p>
              <p className="text-white/60 text-sm">
                {offer.player.position} • {offer.player.age} ans
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Statut de l'offre</h3>
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
              ? '✓ Acceptée'
              : offer.status === 'pending'
                ? '⏱ En attente'
                : '✗ Rejetée'}
          </span>
        </div>

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
              <p className="text-white italic text-sm">"{offer.customMessage}"</p>
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