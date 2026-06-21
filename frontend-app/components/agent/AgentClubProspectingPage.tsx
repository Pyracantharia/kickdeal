'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BadgeEuro,
  Building2,
  CheckCircle2,
  Filter,
  Search,
  Send,
  ShieldAlert,
  Target,
  UsersRound,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

import Button from '@/components/ui/Button'
import CircleImage from '@/components/media/CircleImage'
import ClubProposalModal from '@/components/agent/ClubProposalModal'
import {
  agentPlayersManager,
  type ClubProspectingResponse,
  type ProspectClub,
} from '@/features/agent/agentPlayers'
import type { Player } from '@/features/market/types/player'
import { getLeagueDisplayName } from '@/features/league/leagueConfig'
import { getPositionDisplayName } from '@/features/players/position'

interface AgentClubProspectingPageProps {
  playerId: string
}

function AgentClubProspectingPage({ playerId }: AgentClubProspectingPageProps) {
  const router = useRouter()
  const [data, setData] = useState<ClubProspectingResponse | null>(null)
  const [selectedClub, setSelectedClub] = useState<ProspectClub | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [leagueFilter, setLeagueFilter] = useState('')
  const [financialFilter, setFinancialFilter] = useState('')
  const [contactFilter, setContactFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false)

  const loadProspects = useCallback(async () => {
    setErrorMessage(null)

    try {
      const response = await agentPlayersManager.getClubProspects(playerId)
      if (!response.ok) {
        setErrorMessage(readError(response.data, 'Impossible de charger les clubs.'))
        return
      }

      setData(response.data)
      setSelectedClub((current) => (
        response.data.clubs.find((club) => club.id === current?.id)
        ?? response.data.clubs[0]
        ?? null
      ))
    } catch {
      setErrorMessage('Impossible de charger les clubs.')
    } finally {
      setIsLoading(false)
    }
  }, [playerId])

  useEffect(() => {
    void loadProspects()
  }, [loadProspects])

  const countries = useMemo(
    () => uniqueSorted(data?.clubs.map((club) => club.country) ?? []),
    [data?.clubs],
  )
  const leagues = useMemo(
    () => uniqueSorted(
      (data?.clubs ?? [])
        .filter((club) => !countryFilter || club.country === countryFilter)
        .map((club) => club.league),
    ),
    [data?.clubs, countryFilter],
  )

  const filteredClubs = useMemo(() => {
    if (!data) return []
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('fr')

    return data.clubs.filter((club) => {
      const matchesSearch = !normalizedSearch
        || club.name.toLocaleLowerCase('fr').includes(normalizedSearch)
      const matchesCountry = !countryFilter || club.country === countryFilter
      const matchesLeague = !leagueFilter || club.league === leagueFilter
      const matchesFinancial = !financialFilter || club.financialFit === financialFilter
      const status = club.contact?.status ?? 'not_contacted'
      const matchesContact = !contactFilter || status === contactFilter

      return matchesSearch && matchesCountry && matchesLeague && matchesFinancial && matchesContact
    })
  }, [data, searchTerm, countryFilter, leagueFilter, financialFilter, contactFilter])

  useEffect(() => {
    if (selectedClub && filteredClubs.some((club) => club.id === selectedClub.id)) return
    setSelectedClub(filteredClubs[0] ?? null)
  }, [filteredClubs, selectedClub])

  function handleProposalSubmitted() {
    setSuccessMessage(`La proposition à ${selectedClub?.name ?? 'ce club'} a bien été enregistrée.`)
    void loadProspects()
  }

  if (isLoading) {
    return (
      <div className="auth-bg min-h-screen px-4 pb-12 pt-40 text-center text-white/60">
        Chargement de la prospection...
      </div>
    )
  }

  if (!data) {
    return (
      <div className="auth-bg min-h-screen px-4 pb-12 pt-40">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center text-red-200">
          {errorMessage ?? 'Joueur introuvable.'}
        </div>
      </div>
    )
  }

  const contactedCount = data.clubs.filter((club) => club.contact).length
  const highCompatibilityCount = data.clubs.filter((club) => club.compatibilityScore >= 82).length

  return (
    <div className="auth-bg min-h-screen w-full px-4 pb-14 pt-36 md:px-8 md:pt-40">
      <div className="mx-auto w-full max-w-[1500px]">
        <header className="mb-7 flex flex-col gap-5 border-b border-white/10 pb-7 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <button
              type="button"
              onClick={() => router.push('/mes-joueurs')}
              className="mb-4 inline-flex items-center gap-2 text-sm text-white/55 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à Mes joueurs
            </button>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-cyan">Prospection agent</p>
            <h1 className="mt-2 text-3xl font-bold uppercase text-white md:text-4xl">
              Trouver un club pour {data.player.firstName} {data.player.lastName}
            </h1>
            <p className="mt-2 text-white/60">
              Comparez les projets sportifs et préparez une prise de contact ciblée.
            </p>
          </div>
          <PlayerSummary player={data.player} />
        </header>

        {!data.eligibility.canContact && (
          <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-amber-400/35 bg-amber-400/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-amber-300" />
              <div>
                <p className="font-bold text-white">Autorisation de prospection requise</p>
                <p className="mt-1 text-sm leading-6 text-white/65">{data.eligibility.reason}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push(`/mes-joueurs?playerId=${data.player.id}&manage=1`)}
            >
              {data.eligibility.actionLabel ?? 'Gérer l’autorisation'}
            </Button>
          </div>
        )}

        {data.eligibility.canContact && (
          <div className="mb-6 flex gap-3 rounded-xl border border-brand-cyan/30 bg-brand-cyan/10 px-4 py-3 text-sm text-white/75">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-cyan" />
            {data.eligibility.reason}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-brand-cyan/30 bg-brand-cyan/10 px-4 py-3 text-sm text-brand-cyan">
            <span>{successMessage}</span>
            <button type="button" onClick={() => setSuccessMessage(null)} className="text-white/55 hover:text-white">
              Fermer
            </button>
          </div>
        )}

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <StatCard icon={<Building2 />} value={data.clubs.length} label="Clubs analysés" />
          <StatCard icon={<Target />} value={highCompatibilityCount} label="Compatibilités fortes" />
          <StatCard icon={<Send />} value={contactedCount} label="Clubs contactés" />
        </div>

        <section className="mb-6 rounded-2xl border border-white/15 bg-[#071722]/80 p-4 shadow-xl backdrop-blur">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase text-white">
            <Filter className="h-4 w-4 text-brand-cyan" />
            Affiner les clubs
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Rechercher un club..."
                className="h-11 w-full rounded-xl border border-white/15 bg-white/5 pl-10 pr-3 text-sm text-white placeholder:text-white/35 focus:border-brand-cyan focus:outline-none"
              />
            </div>
            <FilterSelect
              value={countryFilter}
              onChange={(value) => {
                setCountryFilter(value)
                setLeagueFilter('')
              }}
              placeholder="Tous les pays"
              options={countries.map((country) => ({ value: country, label: country }))}
            />
            <FilterSelect
              value={leagueFilter}
              onChange={setLeagueFilter}
              placeholder="Tous les championnats"
              options={leagues.map((league) => ({ value: league, label: getLeagueDisplayName(league) }))}
            />
            <FilterSelect
              value={financialFilter}
              onChange={setFinancialFilter}
              placeholder="Toute capacité financière"
              options={['Très favorable', 'Compatible', 'À négocier', 'Budget contraint'].map((value) => ({ value, label: value }))}
            />
            <FilterSelect
              value={contactFilter}
              onChange={setContactFilter}
              placeholder="Tous les contacts"
              options={[
                { value: 'not_contacted', label: 'Non contactés' },
                { value: 'proposal_sent', label: 'Proposition envoyée' },
                { value: 'interested', label: 'Intéressés' },
                { value: 'discussion_open', label: 'Discussion ouverte' },
                { value: 'rejected', label: 'Refusés' },
              ]}
            />
          </div>
        </section>

        <div className="flex flex-col items-start gap-6 xl:flex-row">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-white/55">{filteredClubs.length} club(s) correspondant aux critères</p>
              <p className="text-xs text-white/40">Classement par compatibilité</p>
            </div>
            <div className="space-y-3">
              {filteredClubs.map((club) => (
                <ClubResultCard
                  key={club.id}
                  club={club}
                  isSelected={club.id === selectedClub?.id}
                  onSelect={() => setSelectedClub(club)}
                />
              ))}
              {filteredClubs.length === 0 && (
                <div className="rounded-2xl border border-white/15 bg-[#071722]/80 px-6 py-14 text-center text-white/55">
                  Aucun club ne correspond à ces filtres.
                </div>
              )}
            </div>
          </div>

          {selectedClub && (
            <ClubProspectDetails
              club={selectedClub}
              canContact={data.eligibility.canContact}
              onPropose={() => setIsProposalModalOpen(true)}
            />
          )}
        </div>
      </div>

      <ClubProposalModal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        player={data.player}
        club={selectedClub}
        suggestedMessage={data.suggestedMessage}
        canContact={data.eligibility.canContact}
        blockedReason={data.eligibility.reason}
        onSubmitted={handleProposalSubmitted}
      />
    </div>
  )
}

function PlayerSummary({ player }: { player: Player }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-brand-cyan/25 bg-[#071722]/85 px-5 py-4">
      <PlayerAvatar player={player} />
      <div>
        <p className="font-bold text-white">{player.firstName} {player.lastName}</p>
        <p className="mt-1 text-sm text-white/55">{getPositionDisplayName(player.position)} · {player.age} ans · {player.club}</p>
        <p className="mt-1 text-xs font-semibold text-brand-cyan">{player.marketValue ?? 'Valeur non renseignée'}</p>
      </div>
    </div>
  )
}

function ClubResultCard({
  club,
  isSelected,
  onSelect,
}: {
  club: ProspectClub
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl border p-5 text-left shadow-lg transition-all ${
        isSelected
          ? 'border-brand-cyan/60 bg-brand-cyan/10'
          : 'border-white/15 bg-[#071722]/80 hover:border-brand-cyan/35 hover:bg-white/5'
      }`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <ClubLogo club={club} />
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-white">{club.name}</h2>
            <p className="mt-1 truncate text-sm text-white/55">
              {getLeagueDisplayName(club.league)} · {club.country}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ContactBadge status={club.contact?.status} />
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/60">
                {club.clubLevel}
              </span>
            </div>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Budget estimé" value={club.transferBudget} />
          <Metric label="Besoin sportif" value={club.sportingNeed} />
          <Metric label="Potentiel" value={club.interestPotential} accent />
          <div className="flex items-center justify-end">
            <ScoreBadge score={club.compatibilityScore} />
          </div>
        </div>
      </div>
    </button>
  )
}

function ClubProspectDetails({
  club,
  canContact,
  onPropose,
}: {
  club: ProspectClub
  canContact: boolean
  onPropose: () => void
}) {
  return (
    <aside className="sticky top-28 w-full shrink-0 xl:w-[360px]">
      <div className="overflow-hidden rounded-2xl border border-brand-purple/35 bg-[#071722]/95 shadow-2xl">
        <div className="bg-gradient-to-br from-brand-purple/25 via-brand-cyan/10 to-transparent p-6">
          <div className="flex items-center gap-4">
            <ClubLogo club={club} />
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-white">{club.name}</h2>
              <p className="mt-1 text-sm text-white/55">{getLeagueDisplayName(club.league)}</p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between">
            <ContactBadge status={club.contact?.status} />
            <ScoreBadge score={club.compatibilityScore} />
          </div>
        </div>

        <div className="space-y-6 p-6">
          <section>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase text-brand-cyan">
              <BadgeEuro className="h-4 w-4" />
              Compatibilité financière
            </h3>
            <Detail label="Budget estimé" value={club.transferBudget} />
            <Detail label="Capacité" value={club.financialFit} accent />
          </section>

          <div className="h-px bg-white/10" />

          <section>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase text-brand-purple">
              <UsersRound className="h-4 w-4" />
              Compatibilité sportive
            </h3>
            <Detail label="Joueurs au même poste" value={club.positionCount.toString()} />
            <Detail label="Besoin estimé" value={club.sportingNeed} accent />
            <Detail label="Niveau du projet" value={club.clubLevel} />
            <Detail label="Intérêt potentiel" value={club.interestPotential} accent />
          </section>

          {club.contact && (
            <>
              <div className="h-px bg-white/10" />
              <section>
                <h3 className="mb-3 text-sm font-bold uppercase text-brand-cyan">Dernier contact</h3>
                <p className="line-clamp-4 whitespace-pre-line text-sm leading-6 text-white/55">
                  {club.contact.message}
                </p>
                <p className="mt-3 text-xs text-white/35">
                  Envoyé le {formatDate(club.contact.createdAt)}
                </p>
              </section>
            </>
          )}

          <Button
            type="button"
            className="w-full"
            onClick={onPropose}
            disabled={!canContact && !club.contact}
            icon={club.contact ? <CheckCircle2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          >
            {club.contact ? 'Voir la proposition' : 'Proposer le joueur'}
          </Button>
        </div>
      </div>
    </aside>
  )
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/15 bg-[#071722]/80 p-4">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-cyan/10 text-brand-cyan">
        {icon}
      </span>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-white/50">{label}</p>
      </div>
    </div>
  )
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  options: Array<{ value: string; label: string }>
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 rounded-xl border border-white/15 bg-[#0d1a29] px-3 text-sm text-white focus:border-brand-cyan focus:outline-none"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  )
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 82
    ? 'border-brand-cyan/40 bg-brand-cyan/15 text-brand-cyan'
    : score >= 68
      ? 'border-brand-purple/40 bg-brand-purple/15 text-brand-purple'
      : 'border-white/20 bg-white/5 text-white/65'

  return (
    <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border-2 ${color}`}>
      <span className="text-base font-bold">{score}%</span>
      <span className="text-[8px] uppercase">match</span>
    </div>
  )
}

function ContactBadge({ status }: { status?: ClubProspectStatus }) {
  const config = {
    proposal_sent: { label: 'Proposition envoyée', className: 'border-brand-purple/35 bg-brand-purple/10 text-brand-purple' },
    interested: { label: 'Intéressé', className: 'border-brand-cyan/35 bg-brand-cyan/10 text-brand-cyan' },
    discussion_open: { label: 'Discussion ouverte', className: 'border-amber-300/35 bg-amber-300/10 text-amber-200' },
    rejected: { label: 'Refusé', className: 'border-red-400/35 bg-red-400/10 text-red-300' },
  } as const
  const current = status ? config[status] : null

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
      current?.className ?? 'border-white/15 bg-white/5 text-white/50'
    }`}>
      {current?.label ?? 'Non contacté'}
    </span>
  )
}

function Metric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-white/35">{label}</p>
      <p className={`mt-1 text-xs font-semibold ${accent ? 'text-brand-cyan' : 'text-white/75'}`}>{value}</p>
    </div>
  )
}

function Detail({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-4 last:mb-0">
      <span className="text-sm text-white/50">{label}</span>
      <span className={`text-right text-sm font-semibold ${accent ? 'text-brand-cyan' : 'text-white'}`}>{value}</span>
    </div>
  )
}

function PlayerAvatar({ player }: { player: Player }) {
  const fallback = (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan font-bold text-white">
      {player.firstName.charAt(0)}{player.lastName.charAt(0)}
    </div>
  )

  if (!player.photoUrl) return fallback

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

function ClubLogo({ club }: { club: ProspectClub }) {
  const fallback = (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-xl font-bold text-white">
      {club.name.charAt(0)}
    </div>
  )

  if (!club.logoUrl) return fallback

  return (
    <CircleImage
      src={club.logoUrl}
      alt={club.name}
      className="relative h-16 w-16 shrink-0 overflow-hidden"
      sizes="64px"
      imageClassName="object-contain p-1"
      fallback={fallback}
    />
  )
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, 'fr'))
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function readError(data: unknown, fallback: string): string {
  if (typeof data !== 'object' || data === null) return fallback
  if ('errorMessage' in data && typeof data.errorMessage === 'string') return data.errorMessage

  return fallback
}

export default AgentClubProspectingPage
