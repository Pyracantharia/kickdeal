'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ChevronRight } from 'lucide-react'

import Button from '@/components/ui/Button'
import CircleImage from '@/components/media/CircleImage'
import { CountryFlag } from '@/components/media/CountryFlag'
import type { Player } from '@/features/market/types/player'
import { filterPlayers, playersManager } from '@/features/players/players'
import { getLeagueDisplayName } from '@/features/league/leagueConfig'
import { getPositionDisplayName } from '@/features/players/position'

function PlayerSearchResults() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const playerId = searchParams.get('playerId')
  const positionId = searchParams.get('positionId')
  const nationalityId = searchParams.get('nationalityId')
  const countryId = searchParams.get('countryId')
  const transferStatusId = searchParams.get('transferStatusId')
  const ageMin = searchParams.get('ageMin') ? parseInt(searchParams.get('ageMin')!) : undefined
  const ageMax = searchParams.get('ageMax') ? parseInt(searchParams.get('ageMax')!) : undefined
  const leagueId = searchParams.get('leagueId')
  const clubId = searchParams.get('clubId')

  useEffect(() => {
    let isMounted = true

    async function loadPlayers() {
      try {
        const response = await playersManager.getAll()

        if (!isMounted || !response.ok) {
          return
        }

        setPlayers(response.data.players ?? [])
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadPlayers()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredPlayers = useMemo(
    () =>
      filterPlayers(players, {
        playerId,
        positionId,
        nationalityId,
        countryId,
        transferStatusId,
        ageMin,
        ageMax,
        leagueId,
        clubId,
      }),
    [players, playerId, positionId, nationalityId, countryId, transferStatusId, ageMin, ageMax, leagueId, clubId],
  )

  const handleNewSearch = () => {
    router.push('/market/search')
  }

  return (
    <div className="auth-bg min-h-screen w-full pt-36 md:pt-40 pb-12 px-4">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">RÉSULTATS RECHERCHE</h1>
            <p className="text-white/60">
              {isLoading ? 'Chargement des joueurs...' : `${filteredPlayers.length} résultat(s)`}
            </p>
          </div>
          <Button
            type="button"
            onClick={handleNewSearch}
            variant="secondary"
            icon={<ArrowLeft className="h-4 w-4" />}
          >
            Nouvelle recherche
          </Button>
        </div>

        {!isLoading && filteredPlayers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60 text-lg mb-4">Aucun joueur trouvé avec ces critères</p>
            <Button type="button" onClick={handleNewSearch}>
              Retour à la recherche
            </Button>
          </div>
        ) : isLoading ? (
          <div className="py-12 text-center text-white/60">
            Chargement des joueurs...
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPlayers.map((player) => (
              <PlayerResultCard key={player.id} player={player} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface PlayerResultCardProps {
  player: Player
}

function PlayerResultCard({ player }: PlayerResultCardProps) {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/market/player/${player.id}`)
  }

  return (
    <button
      onClick={handleClick}
      className="group w-full cursor-pointer rounded-2xl border-2 border-white/25 bg-[#071722]/85 bg-gradient-to-r from-brand-cyan/20 to-[#071722]/85 p-5 text-left shadow-[0_18px_50px_rgba(0,0,0,0.22)] transition-all hover:border-brand-cyan/60 hover:from-brand-cyan/25 md:p-6"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-4">
            <PlayerAvatar player={player} />
            <div className="min-w-0">
              <h3 className="text-xl font-bold uppercase text-white">
                {player.firstName} {player.lastName}
              </h3>
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-white/70">
                <span>{getPositionDisplayName(player.position)} • {player.age} ans •</span>
                <CountryFlag country={player.nationality} className="h-3.5 w-5" />
                <span>{player.nationality}</span>
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-brand-cyan/45 bg-brand-cyan/10 px-3 py-1 text-xs font-semibold text-brand-cyan">
                  {player.transferStatus}
                </span>
                {player.marketValue && (
                  <span className="rounded-full border border-brand-purple/45 bg-brand-purple/10 px-3 py-1 text-xs font-semibold text-white/85">
                    {player.marketValue}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_64px] items-center gap-4 border-t border-white/10 pt-4 md:w-[360px] md:grid-cols-[minmax(0,1fr)_64px_20px] md:border-t-0 md:pt-0">
          <div className="min-w-0 text-left md:text-right">
            <p className="truncate text-lg font-bold text-white">{player.club}</p>
            <p className="truncate text-sm text-brand-cyan">
              {getLeagueDisplayName(player.league)}
            </p>
            <p className="mt-1 inline-flex items-center justify-end gap-1.5 text-xs text-white/55">
              <CountryFlag country={player.country} className="h-3.5 w-5" />
              {player.country}
            </p>
          </div>
          <ClubLogo player={player} />
          <ChevronRight className="hidden h-5 w-5 shrink-0 text-brand-cyan opacity-0 transition-opacity group-hover:opacity-100 md:block" />
        </div>
      </div>
    </button>
  )
}

function PlayerAvatar({ player }: { player: Player }) {
  const fallback = (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan text-lg font-bold text-white">
      {player.firstName.charAt(0)}{player.lastName.charAt(0)}
    </div>
  )

  if (player.photoUrl) {
    return (
      <CircleImage
        src={player.photoUrl}
        alt={`${player.firstName} ${player.lastName}`}
        className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white/20"
        sizes="56px"
        fallback={fallback}
      />
    )
  }

  return fallback
}

function ClubLogo({ player }: { player: Player }) {
  const fallback = (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-white/20 bg-gradient-to-br from-brand-purple/20 to-brand-cyan/20 text-3xl text-white">
      {player.club.charAt(0).toUpperCase()}
    </div>
  )

  if (player.clubLogoUrl) {
    return (
      <CircleImage
        src={player.clubLogoUrl}
        alt={player.club}
        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-white/20"
        sizes="64px"
        imageClassName="object-contain p-1.5"
        fallback={fallback}
      />
    )
  }

  return fallback
}

export default PlayerSearchResults
