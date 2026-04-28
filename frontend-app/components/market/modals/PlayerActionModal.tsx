'use client'

import React, { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import CircleImage from '@/components/media/CircleImage'
import type { Player } from '@/features/market/types/player'
import type { TransferOfferPayload, OfferType } from '@/features/market/types/transfer'
import type { ClubPlayer } from '@/features/club/types/roster'
import { playersManager } from '@/features/players/players'
import { formatNumberInput, parseFormattedNumber, parseOptionalNumber } from '@/features/format/number'

interface PlayerActionModalProps {
  isOpen: boolean
  onClose: () => void
  player: Player
  listingId?: string
  perspective?: 'buyer' | 'seller'
  exchangeTeamId?: string | null
  isSubmitting?: boolean
  errorMessage?: string | null
  onSubmitOffer: (payload: TransferOfferPayload) => void
}

function PlayerActionModal({
  isOpen,
  onClose,
  player,
  listingId,
  perspective = 'buyer',
  exchangeTeamId,
  isSubmitting = false,
  errorMessage,
  onSubmitOffer,
}: PlayerActionModalProps) {
  const [type, setType] = useState<OfferType>('purchase')
  const [amount, setAmount] = useState('')
  const [durationMonths, setDurationMonths] = useState('')
  const [paymentInstallments, setPaymentInstallments] = useState('1')
  const [performanceBonus, setPerformanceBonus] = useState('')
  const [resalePercentage, setResalePercentage] = useState('')
  const [exchangePlayerId, setExchangePlayerId] = useState('')
  const [roster, setRoster] = useState<ClubPlayer[]>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadRoster() {
      if (type !== 'exchange') {
        setExchangePlayerId('')
        setRoster([])
        return
      }

      setExchangePlayerId('')

      const response = exchangeTeamId
        ? await playersManager.getTeamRoster(exchangeTeamId)
        : await playersManager.getClubRoster()

      if (isMounted && response.ok) {
        setRoster(response.data.players ?? [])
      }
    }

    loadRoster()

    return () => {
      isMounted = false
    }
  }, [exchangeTeamId, type])

  const submitOffer = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    onSubmitOffer({
      listingId,
      type,
      amount: parseFormattedNumber(amount) ?? 0,
      durationMonths: type === 'loan' ? parseOptionalNumber(durationMonths) : undefined,
      paymentInstallments: type === 'loan' ? undefined : parseOptionalNumber(paymentInstallments),
      performanceBonus: type === 'loan' ? undefined : parseFormattedNumber(performanceBonus),
      resalePercentage: type === 'loan' ? undefined : parseOptionalNumber(resalePercentage),
      exchangePlayerId: exchangePlayerId || undefined,
      message: message || undefined,
    })
  }

  const purchaseLabel = perspective === 'seller' ? 'Vente' : 'Achat'
  const amountLabel = type === 'loan'
    ? 'Indemnité de prêt (€)'
    : perspective === 'seller'
      ? 'Montant demandé (€)'
      : 'Montant proposé (€)'
  const exchangeLabel = perspective === 'seller'
    ? 'Joueur demandé en échange'
    : 'Joueur proposé en échange'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Actions pour ${player.firstName} ${player.lastName}`}>
      <form className="flex flex-col gap-4" onSubmit={submitOffer}>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {player.photoUrl ? (
                <CircleImage
                  src={player.photoUrl}
                  alt={`${player.firstName} ${player.lastName}`}
                  className="relative h-12 w-12 overflow-hidden rounded-full border border-white/20"
                  sizes="48px"
                  fallback={
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan text-sm font-bold text-white">
                      {player.firstName.charAt(0)}{player.lastName.charAt(0)}
                    </div>
                  }
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan text-sm font-bold text-white">
                  {player.firstName.charAt(0)}{player.lastName.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-white font-semibold">
                  {player.firstName} {player.lastName}
                </p>
                <p className="text-white/60 text-sm">
                  {player.position} • {player.age} ans • {player.club}
                </p>
              </div>
            </div>
            {player.clubLogoUrl ? (
              <CircleImage
                src={player.clubLogoUrl}
                alt={player.club}
                className="relative h-10 w-10 overflow-hidden rounded-full"
                sizes="40px"
                imageClassName="object-contain p-1"
                fallback={<div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">{player.club.charAt(0).toUpperCase()}</div>}
              />
            ) : (
              <p className="text-brand-cyan text-lg">{player.club.charAt(0).toUpperCase()}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <ChoiceButton label={purchaseLabel} active={type === 'purchase'} onClick={() => setType('purchase')} />
          <ChoiceButton label="Prêt" active={type === 'loan'} onClick={() => setType('loan')} />
          <ChoiceButton label="Échange" active={type === 'exchange'} onClick={() => setType('exchange')} />
        </div>

        <Input
          label={amountLabel}
          inputMode="numeric"
          value={amount}
          onChange={(event) => setAmount(formatNumberInput(event.target.value))}
          placeholder="25 000 000"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {type === 'loan' && (
            <Input
              label="Durée du prêt (mois)"
              type="number"
              min="1"
              value={durationMonths}
              onChange={(event) => setDurationMonths(event.target.value)}
              placeholder="12"
            />
          )}
          {type !== 'loan' && (
            <Input
              label="Paiement en"
              type="number"
              min="1"
              value={paymentInstallments}
              onChange={(event) => setPaymentInstallments(event.target.value)}
            />
          )}
        </div>

        {type !== 'loan' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Bonus (€)"
              inputMode="numeric"
              value={performanceBonus}
              onChange={(event) => setPerformanceBonus(formatNumberInput(event.target.value))}
              placeholder="5 000 000"
            />
            <Input
              label="Revente (%)"
              type="number"
              min="0"
              max="100"
              value={resalePercentage}
              onChange={(event) => setResalePercentage(event.target.value)}
            />
          </div>
        )}

        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-200">
          Message au club
          <textarea
            className="min-h-20 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Expliquez votre projet sportif, le rôle du joueur, ou les conditions proposées."
          />
        </label>

        {type === 'exchange' && (
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-200">
            {exchangeLabel}
            <select
              className="rounded-lg border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white outline-none transition-all focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50"
              value={exchangePlayerId}
              onChange={(event) => setExchangePlayerId(event.target.value)}
              required
            >
              <option value="">Sélectionner un joueur</option>
              {roster.map((rosterPlayer) => (
                <option key={rosterPlayer.id} value={rosterPlayer.id}>
                  {rosterPlayer.firstName} {rosterPlayer.lastName} - {rosterPlayer.position}
                </option>
              ))}
            </select>
          </label>
        )}

        {errorMessage && (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {errorMessage}
          </p>
        )}

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Envoyer l&apos;offre
        </Button>
      </form>
    </Modal>
  )
}

function ChoiceButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
        active
          ? 'border-brand-cyan bg-brand-cyan/20 text-white'
          : 'border-white/10 bg-white/5 text-white/70 hover:border-brand-cyan/50'
      }`}
    >
      {label}
    </button>
  )
}

export default PlayerActionModal