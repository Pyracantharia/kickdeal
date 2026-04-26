'use client'

import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'

import CircleImage from '@/components/media/CircleImage'
import type { Player } from '@/features/market/types/player'
import type { ReceivedOffer, SentOffer } from '@/features/market/types/transfer'

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      {message}
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border-2 border-white/20 bg-white/5 p-6 text-white/70">
      {message}
    </div>
  )
}

export function OfferDirection({ offer }: { offer: SentOffer | ReceivedOffer }) {
  const isSelling = offer.viewerRole === 'seller'
  const counterpartyClub = isSelling ? offer.fromClub : offer.toClub
  const label = isSelling ? 'Vente' : 'Achat'
  const detail = isSelling ? `à ${counterpartyClub}` : `auprès de ${counterpartyClub}`
  const Icon = isSelling ? ArrowUpRight : ArrowDownLeft

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
          isSelling
            ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300'
            : 'border-brand-purple/60 bg-brand-purple/15 text-brand-purple'
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="text-sm font-medium text-white/85">{detail}</span>
    </div>
  )
}

export function PlayerAvatar({ player }: { player: Player }) {
  const fallback = (
    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center text-white font-bold text-lg shrink-0">
      {player.firstName.charAt(0)}{player.lastName.charAt(0)}
    </div>
  )

  if (player.photoUrl) {
    return (
      <CircleImage
        src={player.photoUrl}
        alt={`${player.firstName} ${player.lastName}`}
        className="relative h-14 w-14 overflow-hidden rounded-full border border-white/20 shrink-0"
        sizes="56px"
        fallback={fallback}
      />
    )
  }

  return fallback
}

export function ClubLogo({ player }: { player: Player }) {
  const fallback = (
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-purple/20 to-brand-cyan/20 flex items-center justify-center text-white text-3xl border-2 border-white/20 shrink-0">
      {player.club.charAt(0).toUpperCase()}
    </div>
  )

  if (player.clubLogoUrl) {
    return (
      <CircleImage
        src={player.clubLogoUrl}
        alt={player.club}
        className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-white/20 shrink-0"
        sizes="64px"
        imageClassName="object-contain p-1.5"
        fallback={fallback}
      />
    )
  }

  return fallback
}