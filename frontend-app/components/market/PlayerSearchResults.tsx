'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import Button from '@/components/ui/Button'
import CircleImage from '@/components/media/CircleImage'
import type { Player } from '@/features/market/types/player'
import { filterPlayers, playersManager } from '@/features/players/players'

function PlayerSearchResults() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const playerId = searchParams.get('playerId')
  const positionId = searchParams.get('positionId')
  const nationalityId = searchParams.get('nationalityId')
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
        transferStatusId,
        ageMin,
        ageMax,
        leagueId,
        clubId,
      }),
    [players, playerId, positionId, nationalityId, transferStatusId, ageMin, ageMax, leagueId, clubId],
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
      className="w-full text-left rounded-2xl border-2 border-white/20 bg-gradient-to-r from-brand-cyan/10 to-transparent p-6 hover:border-brand-cyan/50 transition-all cursor-pointer group"
    >
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <PlayerAvatar player={player} className="h-14 w-14 text-lg" />
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {player.firstName.toUpperCase()}
                  </h3>
                  <p className="text-white/70 text-sm">{player.lastName.toUpperCase()}</p>
                </div>
              </div>
              <div className="flex gap-4 mt-3 text-sm ml-14">
                <div>
                  <p className="text-white/60 text-xs">Position</p>
                  <p className="text-brand-cyan font-semibold">{player.position}</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs">Nationalité</p>
                  <p className="text-white font-semibold">{player.nationality}</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs">Âge</p>
                  <p className="text-white font-semibold">{player.age} ans</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <ClubLogo player={player} className="mx-auto mb-3 h-16 w-16" />
          <p className="text-white font-bold text-lg mb-1">{player.club}</p>
          <p className="text-brand-cyan text-sm">{player.league}</p>
          <p className="text-white/60 text-xs mt-2">Statut: {player.transferStatus}</p>
        </div>
      </div>
    </button>
  )
}

function PlayerAvatar({ player, className }: { player: Player; className: string }) {
  if (player.photoUrl) {
    return <CircleImage
      src={player.photoUrl}
      alt={`${player.firstName} ${player.lastName}`}
      className={`relative overflow-hidden rounded-full border-2 border-white/20 shrink-0 ${className}`}
      sizes="64px"
      fallback={
        <div className={`rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center text-white font-bold shrink-0 ${className}`}>
          {player.firstName.charAt(0)}{player.lastName.charAt(0)}
        </div>
      }
    />
  }

  return (
    <div className={`rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center text-white font-bold shrink-0 ${className}`}>
      {player.firstName.charAt(0)}{player.lastName.charAt(0)}
    </div>
  )
}

function ClubLogo({ player, className }: { player: Player; className: string }) {
  if (player.clubLogoUrl) {
    return <CircleImage
      src={player.clubLogoUrl}
      alt={player.club}
      className={`relative overflow-hidden rounded-full border-2 border-brand-cyan/50 ${className}`}
      sizes="64px"
      imageClassName="object-contain p-2"
      fallback={
        <div className={`rounded-full bg-white/10 border-2 border-brand-cyan/50 flex items-center justify-center text-white font-bold ${className}`}>
          {player.club.charAt(0).toUpperCase()}
        </div>
      }
    />
  }

  return (
    <div className={`rounded-full bg-white/10 border-2 border-brand-cyan/50 flex items-center justify-center text-white font-bold ${className}`}>
      {player.club.charAt(0).toUpperCase()}
    </div>
  )
}

export default PlayerSearchResults