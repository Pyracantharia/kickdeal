'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BadgeEuro, Dumbbell, Footprints, Ruler, Shield, UserRound } from 'lucide-react'

import Button from '@/components/ui/Button'
import CircleImage from '@/components/media/CircleImage'
import type { Player } from '@/features/market/types/player'
import { buildPlayerFilters, playersManager } from '@/features/players/players'
import { transfersManager } from '@/features/market/transfers'
import { getLeagueDisplayName } from '@/features/league/leagueConfig'

interface PlayerDetailsProps {
  playerId: string
}

function PlayerDetails({ playerId }: PlayerDetailsProps) {
  const router = useRouter()
  const [player, setPlayer] = useState<Player | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingToList, setIsAddingToList] = useState(false)
  const [addToListError, setAddToListError] = useState<string | null>(null)
  const [addToListSuccess, setAddToListSuccess] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadPlayer() {
      try {
        const response = await playersManager.getById(playerId)

        if (!isMounted || !response.ok) {
          return
        }

        setPlayer(response.data)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadPlayer()

    return () => {
      isMounted = false
    }
  }, [playerId])

  const { nationalities } = useMemo(
    () => buildPlayerFilters(player ? [player] : []),
    [player],
  )

  if (isLoading) {
    return (
      <div className="auth-bg min-h-screen w-full pt-36 md:pt-40 pb-12 px-4 flex items-center justify-center">
        <p className="text-white/60 text-lg">Chargement du joueur...</p>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="auth-bg min-h-screen w-full pt-36 md:pt-40 pb-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 text-lg mb-4">Joueur non trouvé</p>
          <Button type="button" onClick={() => router.back()}>
            Retour
          </Button>
        </div>
      </div>
    )
  }

  const nationality = nationalities.find((item) => item.label === player.nationality)

  const handleAddToList = async (showListAfterAdd = false) => {
    setIsAddingToList(true)
    setAddToListError(null)
    setAddToListSuccess(null)

    try {
      const response = await transfersManager.addPlayerToList(player.id)

      if (!response.ok) {
        const errorData = response.data as { errorMessage?: unknown }

        setAddToListError(
          typeof errorData.errorMessage === 'string'
            ? errorData.errorMessage
            : "Impossible d'ajouter ce joueur a la liste.",
        )
        return
      }

      setPlayer(response.data.listing.player)
      setAddToListSuccess('Joueur ajoute a votre liste de transferts.')

      if (showListAfterAdd) {
        router.push('/market/transfers')
      }
    } catch {
      setAddToListError("Impossible d'ajouter ce joueur a la liste.")
    } finally {
      setIsAddingToList(false)
    }
  }

  return (
    <div className="auth-bg min-h-screen w-full pt-36 md:pt-40 pb-12 px-4">
      <div className="mx-auto w-full max-w-5xl">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-brand-cyan hover:text-brand-cyan/80 transition-colors text-sm font-semibold mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux résultats
        </button>

        <section className="relative mb-8 overflow-hidden rounded-2xl border-2 border-brand-cyan/35 bg-[#071722]/85 bg-gradient-to-br from-brand-cyan/18 via-[#071722]/90 to-brand-purple/18 p-6 shadow-2xl shadow-brand-cyan/10 md:p-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-cyan" />
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <PlayerPortrait player={player} />
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-brand-cyan/45 bg-brand-cyan/10 px-3 py-1 text-xs font-semibold text-brand-cyan">
                    {player.position}
                  </span>
                  <span className="rounded-full border border-brand-purple/45 bg-brand-purple/10 px-3 py-1 text-xs font-semibold text-white/85">
                    {player.transferStatus}
                  </span>
                </div>
                <h1 className="text-4xl font-bold uppercase text-white md:text-5xl">
                  {player.firstName} {player.lastName}
                </h1>
                <p className="mt-2 text-lg text-white/65">
                  {nationality?.flag ? `${nationality.flag} ` : ''}
                  {player.nationality} • {player.age} ans • {getLeagueDisplayName(player.league)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_72px] items-center gap-4 md:w-[360px]">
              <div className="min-w-0 text-left md:text-right">
                <p className="truncate text-2xl font-bold text-white">{player.club}</p>
                <p className="text-brand-cyan">{player.country}</p>
              </div>
              <ClubLogo player={player} size="lg" />
            </div>
          </div>
        </section>

        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-2xl border border-brand-cyan/25 bg-[#071722]/85 p-6 shadow-2xl shadow-brand-cyan/10">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
              <UserRound className="h-5 w-5 text-brand-cyan" />
              Profil joueur
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <DetailMetric icon={<Ruler className="h-5 w-5" />} label="Taille" value={`${player.height ?? '-'} cm`} tone="cyan" />
              <DetailMetric icon={<Dumbbell className="h-5 w-5" />} label="Poids" value={`${player.weight ?? '-'} kg`} tone="purple" />
              <DetailMetric icon={<Footprints className="h-5 w-5" />} label="Pied fort" value={player.foot ?? '-'} tone="cyan" />
              <DetailMetric icon={<Shield className="h-5 w-5" />} label="Statut" value={player.transferStatus} tone="purple" />
            </div>
          </section>

          <section className="rounded-2xl border border-brand-purple/30 bg-[#071722]/85 p-6 shadow-2xl shadow-brand-purple/10">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
              <BadgeEuro className="h-5 w-5 text-brand-purple" />
              Finances
            </h2>
            <div className="space-y-3">
              <FinanceRow label="Valeur marché" value={player.marketValue ?? '-'} highlight />
              <FinanceRow label="Salaire hebdo." value={player.weeklySalary ?? '-'} highlight />
              <FinanceRow label="Clause de libération" value={player.releaseClause ?? 'Aucun(e)'} />
            </div>
          </section>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            type="button"
            className="flex-1"
            isLoading={isAddingToList}
            onClick={() => handleAddToList(true)}
          >
            Recruter
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            isLoading={isAddingToList}
            onClick={() => handleAddToList(false)}
          >
            Ajouter a la liste
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            isLoading={isAddingToList}
            onClick={() => handleAddToList(true)}
          >
            Ajouter a la liste et afficher
          </Button>
        </div>
        {addToListError && (
          <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {addToListError}
          </p>
        )}
        {addToListSuccess && (
          <p className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {addToListSuccess}
          </p>
        )}
      </div>
    </div>
  )
}

function PlayerPortrait({ player }: { player: Player }) {
  const fallback = (
    <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-brand-purple bg-gradient-to-br from-brand-purple to-brand-cyan text-5xl font-bold text-white">
      {player.firstName.charAt(0)}{player.lastName.charAt(0)}
    </div>
  )

  if (player.photoUrl) {
    return (
      <CircleImage
        src={player.photoUrl}
        alt={`${player.firstName} ${player.lastName}`}
        className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full border-4 border-brand-purple shadow-[0_0_34px_rgba(166,92,255,0.24)]"
        sizes="128px"
        fallback={fallback}
      />
    )
  }

  return fallback
}

function ClubLogo({ player, size = 'md' }: { player: Player; size?: 'md' | 'lg' }) {
  const dimension = size === 'lg' ? 'h-[72px] w-[72px]' : 'h-12 w-12'
  const fallback = (
    <div className={`flex ${dimension} shrink-0 items-center justify-center rounded-full border-2 border-white/20 bg-gradient-to-br from-brand-purple/20 to-brand-cyan/20 text-2xl text-white`}>
      {player.club.charAt(0).toUpperCase()}
    </div>
  )

  if (player.clubLogoUrl) {
    return (
      <CircleImage
        src={player.clubLogoUrl}
        alt={player.club}
        className={`relative ${dimension} shrink-0 overflow-hidden rounded-full border-2 border-white/20`}
        sizes={size === 'lg' ? '72px' : '48px'}
        imageClassName="object-contain p-1.5"
        fallback={fallback}
      />
    )
  }

  return fallback
}

function DetailMetric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: 'cyan' | 'purple' }) {
  const color = tone === 'cyan' ? 'text-brand-cyan border-brand-cyan/30 bg-brand-cyan/10' : 'text-brand-purple border-brand-purple/30 bg-brand-purple/10'

  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <div className="mb-3">{icon}</div>
      <p className="text-xs text-white/60">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
    </div>
  )
}

function FinanceRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-white/75">{label}</p>
      <p className={`font-bold ${highlight ? 'text-brand-cyan' : 'text-white'}`}>{value}</p>
    </div>
  )
}

export default PlayerDetails
