'use client'

import React, { useMemo, useState } from 'react'
import Image from 'next/image'
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Search,
  Shield,
} from 'lucide-react'

import Button from '@/components/ui/Button'
import { LEAGUE_CONFIG } from '@/features/league/leagueConfig'
import type { ClubOption, LeagueOption } from '@/features/club/types/createClub'

interface StepSelectClubProps {
  leagues: LeagueOption[]
  clubs: ClubOption[]
  selectedLeague: LeagueOption | null
  selectedClub: ClubOption | null
  isLoading: boolean
  onLeagueSelect: (league: LeagueOption) => void
  onLeagueBack: () => void
  onSelect: (club: ClubOption | null) => void
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function LeagueLogo({ league }: { league: LeagueOption }) {
  const config = LEAGUE_CONFIG[league.name]

  return (
    <div className="relative h-16 w-20 shrink-0">
      <Image
        src={config.logoUrl}
        alt={`Logo ${config.displayName}`}
        fill
        sizes="80px"
        className="object-contain"
      />
    </div>
  )
}

function ClubLogo({ club }: { club: ClubOption }) {
  if (club.logoUrl) {
    return (
      <div className="relative h-16 w-16">
        <Image src={club.logoUrl} alt={`Logo ${club.name}`} fill sizes="64px" className="object-contain" />
      </div>
    )
  }

  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/10">
      <Shield className="h-8 w-8 text-gray-300" aria-hidden="true" />
    </div>
  )
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-label="Chargement">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-32 animate-pulse rounded-xl border border-white/10 bg-white/5" />
      ))}
    </div>
  )
}

function StepSelectClub({
  leagues,
  clubs,
  selectedLeague,
  selectedClub,
  isLoading,
  onLeagueSelect,
  onLeagueBack,
  onSelect,
}: StepSelectClubProps) {
  const [query, setQuery] = useState('')
  const [pendingClub, setPendingClub] = useState<ClubOption | null>(selectedClub)

  const filteredLeagues = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query)
    const displayedLeagues = leagues.filter((league) => LEAGUE_CONFIG[league.name])

    if (!normalizedQuery) return displayedLeagues

    return displayedLeagues.filter((league) =>
      normalizeSearchText(LEAGUE_CONFIG[league.name].displayName).includes(normalizedQuery),
    )
  }, [leagues, query])

  const filteredClubs = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query)
    if (!normalizedQuery) return clubs

    return clubs.filter((club) =>
      normalizeSearchText(`${club.name} ${club.country}`).includes(normalizedQuery),
    )
  }, [clubs, query])

  function handleClubClick(club: ClubOption) {
    if (!club.isClaimed) {
      setPendingClub(club)
    }
  }

  function handleConfirmClub() {
    if (pendingClub) {
      onSelect(pendingClub)
    }
  }

  const results = selectedLeague ? filteredClubs : filteredLeagues

  return (
    <div className="flex flex-col gap-5">
      <div>
        {selectedLeague && (
          <button
            type="button"
            onClick={onLeagueBack}
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Changer de ligue
          </button>
        )}

        <h2 className="mb-1 text-lg font-bold uppercase text-white">
          {selectedLeague
            ? `Clubs de ${LEAGUE_CONFIG[selectedLeague.name].displayName}`
            : 'Choix de la ligue'}
        </h2>
        <p className="text-sm text-gray-300">
          {selectedLeague
            ? 'Sélectionnez votre club, puis confirmez votre choix avant de continuer.'
            : 'Commencez par sélectionner la ligue dans laquelle évolue votre club.'}
        </p>
      </div>

      <div>
        <label htmlFor="catalog-search" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">
          {selectedLeague ? 'Rechercher un club' : 'Rechercher une ligue'}
        </label>
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 transition-all focus-within:border-brand-cyan focus-within:ring-1 focus-within:ring-brand-cyan/50">
          <Search className="h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
          <input
            id="catalog-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={selectedLeague ? 'Nom du club...' : 'Nom de la ligue...'}
            className="w-full bg-transparent text-sm text-white placeholder-gray-500 outline-none"
            autoComplete="off"
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingGrid />
      ) : results.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-gray-400">
          Aucun résultat trouvé
        </div>
      ) : selectedLeague ? (
        <div className="grid max-h-[430px] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
          {filteredClubs.map((club) => {
            const isSelected = pendingClub?.id === club.id
            const isClaimed = Boolean(club.isClaimed)

            return (
              <button
                key={club.id}
                type="button"
                onClick={() => handleClubClick(club)}
                disabled={isClaimed}
                aria-pressed={isSelected}
                className={`relative flex min-h-36 flex-col items-center justify-center gap-3 rounded-xl border p-4 text-center transition-all ${
                  isClaimed
                    ? 'cursor-not-allowed border-white/10 bg-white/[0.03] opacity-55'
                    : isSelected
                      ? 'border-brand-cyan bg-brand-cyan/10 shadow-lg shadow-brand-cyan/10'
                      : 'border-white/10 bg-white/5 hover:border-brand-cyan/50 hover:bg-white/10'
                }`}
              >
                {isSelected && (
                  <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-brand-cyan" aria-hidden="true" />
                )}
                <ClubLogo club={club} />
                <div>
                  <p className="text-sm font-semibold text-white">{club.name}</p>
                  <p className="mt-1 text-xs text-gray-400">{club.country}</p>
                  {isClaimed && (
                    <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-purple">
                      <Lock className="h-3 w-3" />
                      Déjà revendiqué
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="grid max-h-[430px] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
          {filteredLeagues.map((league) => (
            <button
              key={league.name}
              type="button"
              onClick={() => onLeagueSelect(league)}
              className="flex min-h-36 items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-brand-cyan/50 hover:bg-white/10"
            >
              <LeagueLogo league={league} />
              <div className="min-w-0">
                <p className="font-semibold text-white">
                  {LEAGUE_CONFIG[league.name].displayName}
                </p>
                <p className="mt-2 text-xs font-semibold text-brand-cyan">
                  {league.clubCount} club{league.clubCount > 1 ? 's' : ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedLeague && (
        <Button
          type="button"
          onClick={handleConfirmClub}
          disabled={!pendingClub || pendingClub.id === selectedClub?.id}
          className="w-full"
          icon={<CheckCircle2 className="h-4 w-4" />}
        >
          {pendingClub?.id === selectedClub?.id ? 'Club validé' : 'Valider ce club'}
        </Button>
      )}
    </div>
  )
}

export default StepSelectClub
