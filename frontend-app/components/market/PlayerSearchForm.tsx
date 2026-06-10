'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Flag, Shirt, TrendingUp, MapPin, Trophy, Users } from 'lucide-react'

import Button from '@/components/ui/Button'
import PlayerSearchModal from './modals/PlayerSearchModal'
import PositionSearchModal from './modals/PositionSearchModal'
import NationalitySearchModal from './modals/NationalitySearchModal'
import TransferStatusSearchModal from './modals/TransferStatusSearchModal'
import LeagueSearchModal from './modals/LeagueSearchModal'
import ClubSearchModal from './modals/ClubSearchModal'
import CountrySearchModal from './modals/CountrySearchModal'

import type { Player } from '@/features/market/types/player'
import { buildPlayerFilters, filterPlayers, playersManager } from '@/features/players/players'

interface SearchState {
  selectedPlayer?: Player
  positionId?: string
  nationalityId?: string
  countryId?: string
  transferStatusId?: string
  ageMin?: number
  ageMax?: number
  leagueId?: string
  clubId?: string
}

function PlayerSearchForm() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchState, setSearchState] = useState<SearchState>({
    ageMin: 15,
    ageMax: 42,
  })

  const [openModal, setOpenModal] = useState<
    | 'player'
    | 'position'
    | 'nationality'
    | 'country'
    | 'transferStatus'
    | 'league'
    | 'club'
    | null
  >(null)

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

  const {
    positions,
    nationalities,
    countries,
    leagues,
    clubs,
    transferStatuses,
  } = useMemo(() => buildPlayerFilters(players), [players])

  const availableLeagues = useMemo(
    () =>
      searchState.countryId
        ? leagues.filter((league) => league.country === searchState.countryId)
        : leagues,
    [leagues, searchState.countryId],
  )

  const availableClubs = useMemo(
    () =>
      searchState.leagueId
        ? clubs.filter((club) => club.leagueId === searchState.leagueId)
        : [],
    [clubs, searchState.leagueId]
  )

  const filteredPlayers = useMemo(() => {
    return filterPlayers(players, searchState)
  }, [players, searchState])

  const selectedPosition = positions.find((position) => position.id === searchState.positionId)
  const selectedNationality = nationalities.find(
    (nationality) => nationality.id === searchState.nationalityId
  )
  const selectedCountry = countries.find((country) => country.id === searchState.countryId)
  const selectedTransferStatus = transferStatuses.find(
    (status) => status.id === searchState.transferStatusId
  )
  const selectedLeague = leagues.find((league) => league.id === searchState.leagueId)
  const selectedClub = availableClubs.find((c) => c.id === searchState.clubId)

  const handlePlayerSelect = (player: Player) => {
    if (searchState.selectedPlayer?.id === player.id) {
      setSearchState({
        ageMin: 15,
        ageMax: 42,
      })
      return
    }

    const posId = positions.find((position) => position.label === player.position)?.id
    const natId = nationalities.find((nationality) => nationality.label === player.nationality)?.id
    const statId = transferStatuses.find(
      (status) => status.label === player.transferStatus
    )?.id
    const leagId = leagues.find((league) => league.id === player.league)?.id
    const clubId = leagId
      ? clubs.find((club) => club.label === player.club && club.leagueId === leagId)?.id
      : undefined

    setSearchState({
      selectedPlayer: player,
      positionId: posId,
      nationalityId: natId,
      countryId: leagues.find((league) => league.id === leagId)?.country,
      transferStatusId: statId,
      ageMin: player.age,
      ageMax: player.age,
      leagueId: leagId,
      clubId: clubId,
    })
  }

  const handleResetFilters = () => {
    setSearchState({
      ageMin: 15,
      ageMax: 42,
    })
  }

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchState.selectedPlayer?.id) params.append('playerId', searchState.selectedPlayer.id)
    if (searchState.positionId) params.append('positionId', searchState.positionId)
    if (searchState.nationalityId) params.append('nationalityId', searchState.nationalityId)
    if (searchState.countryId) params.append('countryId', searchState.countryId)
    if (searchState.transferStatusId) params.append('transferStatusId', searchState.transferStatusId)
    if (searchState.ageMin) params.append('ageMin', searchState.ageMin.toString())
    if (searchState.ageMax) params.append('ageMax', searchState.ageMax.toString())
    if (searchState.leagueId) params.append('leagueId', searchState.leagueId)
    if (searchState.clubId) params.append('clubId', searchState.clubId)

    router.push(`/market/results?${params.toString()}`)
  }

  const handleAgeMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 15
    setSearchState((prev) => ({
      ...prev,
      ageMin: Math.min(value, prev.ageMax || 42),
    }))
  }

  const handleAgeMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 42
    setSearchState((prev) => ({
      ...prev,
      ageMax: Math.max(value, prev.ageMin || 15),
    }))
  }

  return (
    <div className="auth-bg min-h-screen w-full pt-36 md:pt-40 pb-12 px-4">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">RECHERCHE DE JOUEURS</h1>
          <div className="h-1 w-32 bg-gradient-to-r from-brand-purple to-brand-cyan rounded-full"></div>
          <p className="mt-3 text-white/70">
            {isLoading ? 'Chargement des joueurs...' : `${players.length} joueur(s) charges depuis la base.`}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <SearchCard
            title="Nom"
            icon={<User className="h-12 w-12" />}
            value={searchState.selectedPlayer ? `${searchState.selectedPlayer.firstName} ${searchState.selectedPlayer.lastName}` : 'Tout'}
            subtitle={
              searchState.selectedPlayer
                ? 'Joueur'
                : 'Tout'
            }
            onClick={() => setOpenModal('player')}
            isActive={!!searchState.selectedPlayer}
            description={searchState.selectedPlayer ? `${searchState.selectedPlayer.position} • ${searchState.selectedPlayer.age} ans` : "Consultez les derniers transferts à travers le monde"}
          />

          <SearchCard
            title="Poste"
            icon={<Shirt className="h-12 w-12" />}
            value={selectedPosition?.label || 'Tout'}
            subtitle={selectedPosition ? 'Rôle' : 'Tout'}
            onClick={() => setOpenModal('position')}
            isActive={!!selectedPosition}
            description={selectedPosition ? 'Poste sélectionné' : "Tout"}
          />

          <SearchCard
            title="Nationalité/Région"
            icon={<Flag className="h-12 w-12" />}
            value={selectedNationality?.label || 'Tout'}
            subtitle={selectedNationality ? 'Drapeau' : 'Tout'}
            onClick={() => setOpenModal('nationality')}
            isActive={!!selectedNationality}
            description={selectedNationality ? `${selectedNationality.flag} Sélectionné` : "Tout"}
          />

          <SearchCard
            title="Statut transfert"
            icon={<TrendingUp className="h-12 w-12" />}
            value={selectedTransferStatus?.label || 'Tout'}
            subtitle={selectedTransferStatus ? 'Statut' : 'Tout'}
            onClick={() => setOpenModal('transferStatus')}
            isActive={!!selectedTransferStatus}
            description={selectedTransferStatus ? 'Statut sélectionné' : "Tout"}
          />

          <AgeSearchCard
            ageMin={searchState.ageMin || 15}
            ageMax={searchState.ageMax || 42}
            onMinChange={handleAgeMinChange}
            onMaxChange={handleAgeMaxChange}
          />

          <SearchCard
            title="Pays/Région"
            icon={<MapPin className="h-12 w-12" />}
            value={selectedCountry?.label || 'Tout'}
            subtitle={selectedCountry ? selectedCountry.flag : 'Tout'}
            onClick={() => setOpenModal('country')}
            isActive={!!selectedCountry}
            description={selectedCountry ? 'Pays sélectionné' : 'Tout'}
          />

          <SearchCard
            title="Ligue"
            icon={<Trophy className="h-12 w-12" />}
            value={selectedLeague?.label || 'Tout'}
            subtitle={selectedLeague ? 'Ligue' : 'Tout'}
            onClick={() => setOpenModal('league')}
            isActive={!!selectedLeague}
            description={selectedLeague ? 'Ligue sélectionnée' : "Tout"}
          />

          <SearchCard
            title="Équipe"
            icon={<Users className="h-12 w-12" />}
            value={selectedClub?.label || 'Tout'}
            subtitle={selectedClub ? 'Club' : 'Tout'}
            onClick={() => selectedLeague && setOpenModal('club')}
            isActive={!!selectedClub}
            disabled={!selectedLeague}
            description={selectedClub ? 'Club sélectionné' : selectedLeague ? "Tout" : 'Sélectionnez une ligue d\'abord'}
          />
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <Button type="button" onClick={handleResetFilters} variant="secondary">
            Réinitialiser
          </Button>
          <Button type="button" onClick={handleSearch} disabled={isLoading || players.length === 0}>
            Rechercher
          </Button>
        </div>
      </div>

      <PlayerSearchModal
        isOpen={openModal === 'player'}
        onClose={() => setOpenModal(null)}
        players={filteredPlayers}
        onSelect={handlePlayerSelect}
      />

      <PositionSearchModal
        isOpen={openModal === 'position'}
        onClose={() => setOpenModal(null)}
        positions={positions}
        onSelect={(position) => {
          setSearchState((prev) => ({
            ...prev,
            selectedPlayer: undefined,
            positionId: prev.positionId === position.id ? undefined : position.id,
          }))
          setOpenModal(null)
        }}
        selectedPositionId={searchState.positionId}
      />

      <NationalitySearchModal
        isOpen={openModal === 'nationality'}
        onClose={() => setOpenModal(null)}
        nationalities={nationalities}
        onSelect={(nationality) => {
          setSearchState((prev) => ({
            ...prev,
            selectedPlayer: undefined,
            nationalityId: prev.nationalityId === nationality.id ? undefined : nationality.id,
          }))
          setOpenModal(null)
        }}
        selectedNationalityId={searchState.nationalityId}
      />

      <TransferStatusSearchModal
        isOpen={openModal === 'transferStatus'}
        onClose={() => setOpenModal(null)}
        statuses={transferStatuses}
        onSelect={(status) => {
          setSearchState((prev) => ({
            ...prev,
            selectedPlayer: undefined,
            transferStatusId: prev.transferStatusId === status.id ? undefined : status.id,
          }))
          setOpenModal(null)
        }}
        selectedStatusId={searchState.transferStatusId}
      />

      <LeagueSearchModal
        isOpen={openModal === 'league'}
        onClose={() => setOpenModal(null)}
        leagues={availableLeagues}
        onSelect={(league) => {
          setSearchState((prev) => ({
            ...prev,
            selectedPlayer: undefined,
            leagueId: prev.leagueId === league.id ? undefined : league.id,
            countryId: prev.leagueId === league.id ? prev.countryId : league.country,
            clubId: undefined, 
          }))
          setOpenModal(null)
        }}
        selectedLeagueId={searchState.leagueId}
      />

      <CountrySearchModal
        isOpen={openModal === 'country'}
        onClose={() => setOpenModal(null)}
        countries={countries}
        onSelect={(country) => {
          setSearchState((prev) => {
            const isDeselecting = prev.countryId === country.id

            return {
              ...prev,
              selectedPlayer: undefined,
              countryId: isDeselecting ? undefined : country.id,
              leagueId:
                !isDeselecting && selectedLeague?.country === country.id
                  ? prev.leagueId
                  : undefined,
              clubId:
                !isDeselecting && selectedLeague?.country === country.id
                  ? prev.clubId
                  : undefined,
            }
          })
          setOpenModal(null)
        }}
        selectedCountryId={searchState.countryId}
      />

      <ClubSearchModal
        isOpen={openModal === 'club'}
        onClose={() => setOpenModal(null)}
        clubs={availableClubs}
        onSelect={(club) => {
          setSearchState((prev) => ({
            ...prev,
            selectedPlayer: undefined,
            clubId: prev.clubId === club.id ? undefined : club.id,
          }))
          setOpenModal(null)
        }}
        selectedClubId={searchState.clubId}
      />
    </div>
  )
}

interface SearchCardProps {
  title: string
  icon: React.ReactNode
  value?: string
  subtitle: string
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  description: string
}

function SearchCard({
  title,
  icon,
  value,
  subtitle,
  onClick,
  isActive = false,
  disabled = false,
  description,
}: SearchCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group rounded-2xl border-2 p-6 transition-all flex flex-col items-center gap-4 text-center h-full ${
        disabled
          ? 'border-white/10 bg-white/5 opacity-50 cursor-not-allowed'
          : isActive
            ? 'border-brand-purple bg-gradient-to-b from-brand-purple/35 from-0% to-transparent to-90%'
            : 'border-white/10 bg-white/5 hover:border-brand-purple/50 hover:bg-white/10'
      }`}
    >
      <div
        className={`${
          isActive ? 'text-brand-purple' : 'text-white/70 group-hover:text-brand-purple'
        } transition-colors`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        {value && value !== 'Tout' && (
          <p className={`mt-2 text-base font-bold ${isActive ? 'text-brand-purple' : 'text-brand-cyan'} line-clamp-2`}>
            {value}
          </p>
        )}
        <p className={`mt-1 text-sm font-semibold ${isActive ? 'text-brand-purple' : 'text-white/60'}`}>
          {subtitle}
        </p>
      </div>
      <p className="text-xs text-white/50 line-clamp-2">{description}</p>
    </button>
  )
}

function AgeSearchCard({
  ageMin,
  ageMax,
  onMinChange,
  onMaxChange,
}: {
  ageMin: number
  ageMax: number
  onMinChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onMaxChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="rounded-2xl border-2 border-white/10 bg-white/5 p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-8 w-8 text-white/70" />
        <h3 className="text-lg font-bold text-white">Âge</h3>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-sm text-white/80 font-medium">MIN</label>
          <input
            type="number"
            min="15"
            max="42"
            value={ageMin}
            onChange={onMinChange}
            className="w-full mt-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white text-center focus:border-brand-purple focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm text-white/80 font-medium">MAX</label>
          <input
            type="number"
            min="15"
            max="42"
            value={ageMax}
            onChange={onMaxChange}
            className="w-full mt-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white text-center focus:border-brand-purple focus:outline-none"
          />
        </div>
      </div>
    </div>
  )
}

export default PlayerSearchForm
