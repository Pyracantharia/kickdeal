'use client'

import React, { useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import Button from '@/components/ui/Button'
import {
  MOCK_PLAYERS,
  MOCK_POSITIONS,
  MOCK_NATIONALITIES,
  MOCK_LEAGUES,
  MOCK_CLUBS,
  MOCK_TRANSFER_STATUS,
} from '@/features/market/mockPlayers'
import type { Player } from '@/features/market/types/player'

function getClubLogo(clubName: string): string {
  const club = MOCK_CLUBS.find((c) => c.label === clubName)
  return club?.logo || '⚽'
}

function PlayerSearchResults() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const playerId = searchParams.get('playerId')
  const positionId = searchParams.get('positionId')
  const nationalityId = searchParams.get('nationalityId')
  const transferStatusId = searchParams.get('transferStatusId')
  const ageMin = searchParams.get('ageMin') ? parseInt(searchParams.get('ageMin')!) : undefined
  const ageMax = searchParams.get('ageMax') ? parseInt(searchParams.get('ageMax')!) : undefined
  const leagueId = searchParams.get('leagueId')
  const clubId = searchParams.get('clubId')

  const filteredPlayers = useMemo(() => {
    return MOCK_PLAYERS.filter((player) => {
      if (playerId) {
        return player.id === playerId
      }

      if (positionId) {
        const selectedPosition = MOCK_POSITIONS.find((p) => p.id === positionId)
        if (selectedPosition && player.position !== selectedPosition.label) {
          return false
        }
      }

      if (nationalityId) {
        const selectedNationality = MOCK_NATIONALITIES.find(
          (n) => n.id === nationalityId
        )
        if (selectedNationality && player.nationality !== selectedNationality.label) {
          return false
        }
      }

      if (transferStatusId) {
        const selectedStatus = MOCK_TRANSFER_STATUS.find(
          (s) => s.id === transferStatusId
        )
        if (selectedStatus && player.transferStatus !== selectedStatus.label) {
          return false
        }
      }

      if (ageMin !== undefined && ageMax !== undefined) {
        if (player.age < ageMin || player.age > ageMax) {
          return false
        }
      }

      if (leagueId) {
        const selectedLeague = MOCK_LEAGUES.find((l) => l.id === leagueId)
        if (selectedLeague && player.league !== selectedLeague.label) {
          return false
        }
      }

      if (clubId) {
        const selectedClub = MOCK_CLUBS.find((c) => c.id === clubId)
        if (selectedClub && player.club !== selectedClub.label) {
          return false
        }
      }

      return true
    })
  }, [playerId, positionId, nationalityId, transferStatusId, ageMin, ageMax, leagueId, clubId])

  const handleNewSearch = () => {
    router.push('/market/search')
  }

  return (
    <div className="auth-bg min-h-screen w-full pt-36 md:pt-40 pb-12 px-4">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">RÉSULTATS RECHERCHE</h1>
            <p className="text-white/60">{filteredPlayers.length} résultat(s)</p>
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

        {filteredPlayers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60 text-lg mb-4">Aucun joueur trouvé avec ces critères</p>
            <Button type="button" onClick={handleNewSearch}>
              Retour à la recherche
            </Button>
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
  const clubLogo = getClubLogo(player.club)

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
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {player.firstName.charAt(0)}{player.lastName.charAt(0)}
                </div>
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
          <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-brand-cyan/50 flex items-center justify-center text-5xl mb-3 mx-auto">
            {clubLogo}
          </div>
          <p className="text-white font-bold text-lg mb-1">{player.club}</p>
          <p className="text-brand-cyan text-sm">{player.league}</p>
          <p className="text-white/60 text-xs mt-2">Statut: {player.transferStatus}</p>
        </div>
      </div>
    </button>
  )
}

export default PlayerSearchResults