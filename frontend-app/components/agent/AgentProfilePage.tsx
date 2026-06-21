'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  Clock3,
  FileCheck2,
  Handshake,
  Search,
  Send,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

import Button from '@/components/ui/Button'
import CircleImage from '@/components/media/CircleImage'
import { useAuth } from '@/context/AuthProvider'
import { dashboardManager, type AgentDashboardHomeData, type AgentDashboardNegotiation } from '@/features/dashboard/dashboard'
import { agentPlayersManager, type RepresentationRequest } from '@/features/agent/agentPlayers'
import type { Player } from '@/features/market/types/player'
import { playersManager } from '@/features/players/players'
import { getPositionDisplayName } from '@/features/players/position'

const EMPTY_DASHBOARD: AgentDashboardHomeData = {
  profile: null,
  stats: {
    representedPlayers: 0,
    activeNegotiations: 0,
    pendingOffers: 0,
    availablePlayers: 0,
  },
  players: [],
  negotiations: [],
}

function AgentProfilePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState<AgentDashboardHomeData>(EMPTY_DASHBOARD)
  const [players, setPlayers] = useState<Player[]>([])
  const [requests, setRequests] = useState<RepresentationRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadProfile() {
      try {
        const [dashboardResponse, playersResponse, requestsResponse] = await Promise.all([
          dashboardManager.getAgentHome(),
          playersManager.getAgentRoster(),
          agentPlayersManager.getRepresentationRequests(),
        ])

        if (!isMounted) return

        if (!dashboardResponse.ok || !playersResponse.ok || !requestsResponse.ok) {
          setErrorMessage('Impossible de charger votre profil agent pour le moment.')
          return
        }

        setDashboard(dashboardResponse.data)
        setPlayers(playersResponse.data.players ?? [])
        setRequests(requestsResponse.data.requests ?? [])
      } catch {
        if (isMounted) {
          setErrorMessage('Impossible de charger votre profil agent pour le moment.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      isMounted = false
    }
  }, [])

  const agencyName = dashboard.profile?.agencyName?.trim()
    || user?.agencyName?.trim()
    || [user?.firstName, user?.lastName].filter(Boolean).join(' ')
    || 'Mon agence'

  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === 'pending'),
    [requests],
  )

  const playersOnMarket = useMemo(
    () => players.filter((player) => {
      const status = player.transferStatus.toLocaleLowerCase('fr')
      return status.includes('marché') || status.includes('marche')
    }),
    [players],
  )

  const loanListedPlayers = useMemo(
    () => players.filter((player) => {
      const status = player.transferStatus.toLocaleLowerCase('fr')
      return status.includes('prêt') || status.includes('pret')
    }),
    [players],
  )

  const expiringPlayers = useMemo(
    () => players
      .map((player) => ({
        player,
        monthsLeft: getRemainingContractMonths(player.contractEndDate),
      }))
      .filter(({ monthsLeft }) => monthsLeft !== null && monthsLeft <= 12)
      .sort((left, right) => (left.monthsLeft ?? 999) - (right.monthsLeft ?? 999)),
    [players],
  )

  const spotlightPlayers = useMemo(
    () => [...players].slice(0, 4),
    [players],
  )

  const priorities = buildPriorities({
    pendingRequests: pendingRequests.length,
    expiringPlayers: expiringPlayers.length,
    activeNegotiations: dashboard.stats.activeNegotiations,
    playersOnMarket: playersOnMarket.length,
    representedPlayers: dashboard.stats.representedPlayers,
  })

  if (isLoading) {
    return (
      <div className="auth-bg min-h-screen w-full px-4 pb-12 pt-36 md:px-8 md:pt-40">
        <div className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-[#071722]/80 p-10 text-center text-white/60">
          Chargement du profil agent...
        </div>
      </div>
    )
  }

  return (
    <div className="auth-bg min-h-screen w-full px-4 pb-12 pt-36 md:px-8 md:pt-40">
      <div className="mx-auto w-full max-w-6xl">
        <header className="relative mb-8 overflow-hidden rounded-2xl border border-brand-cyan/25 bg-[#071722]/88 p-6 shadow-2xl shadow-brand-cyan/10 md:p-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-cyan" />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-cyan">
                Profil agent
              </p>
              <h1 className="mt-2 text-4xl font-bold text-white">{agencyName}</h1>
              <p className="mt-2 text-white/65">
                {dashboard.profile?.country
                  ? `${dashboard.profile.country} · `
                  : ''}Pilotez votre portefeuille, vos validations et vos opportunités de placement.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge
                  icon={<ShieldCheck className="h-3.5 w-3.5" />}
                  label={`${dashboard.stats.representedPlayers} joueur(s) représenté(s)`}
                  tone="cyan"
                />
                <Badge
                  icon={<Handshake className="h-3.5 w-3.5" />}
                  label={`${dashboard.stats.activeNegotiations} négociation(s) active(s)`}
                  tone="purple"
                />
                <Badge
                  icon={<Clock3 className="h-3.5 w-3.5" />}
                  label={`${pendingRequests.length} validation(s) admin en attente`}
                  tone="white"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <QuickAction
                title="Mes joueurs"
                description="Gérer le portefeuille"
                onClick={() => router.push('/mes-joueurs')}
                icon={<UsersRound className="h-4 w-4" />}
              />
              <QuickAction
                title="Rechercher un club"
                description="Lancer une prospection"
                onClick={() => router.push('/market/clubs')}
                icon={<Search className="h-4 w-4" />}
              />
              <QuickAction
                title="Ajouter un joueur"
                description="Nouvelle demande de représentation"
                onClick={() => router.push('/mes-joueurs?add=1')}
                icon={<UserPlus className="h-4 w-4" />}
              />
              <QuickAction
                title="Négociations"
                description="Voir les dossiers chauds"
                onClick={() => router.push('/negociations')}
                icon={<BriefcaseBusiness className="h-4 w-4" />}
              />
            </div>
          </div>
        </header>

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
            {errorMessage}
          </div>
        )}

        <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-6">
          <MetricCard label="Portefeuille" value={dashboard.stats.representedPlayers} icon={<UsersRound className="h-5 w-5" />} tone="cyan" />
          <MetricCard label="Négociations" value={dashboard.stats.activeNegotiations} icon={<Handshake className="h-5 w-5" />} tone="purple" />
          <MetricCard label="Offres à traiter" value={dashboard.stats.pendingOffers} icon={<Send className="h-5 w-5" />} tone="blue" />
          <MetricCard label="Sur le marché" value={playersOnMarket.length} icon={<BadgeCheck className="h-5 w-5" />} tone="emerald" />
          <MetricCard label="En prêt" value={loanListedPlayers.length} icon={<ArrowRight className="h-5 w-5" />} tone="purple" />
          <MetricCard label="À sécuriser" value={expiringPlayers.length} icon={<CalendarClock className="h-5 w-5" />} tone="amber" />
        </section>

        <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)]">
          <section className="space-y-7">
            <Panel title="Priorités de l’agence" icon={<Clock3 className="h-5 w-5 text-brand-cyan" />}>
              <div className="space-y-3">
                {priorities.map((priority) => (
                  <button
                    key={priority.title}
                    type="button"
                    onClick={priority.onClick ? () => router.push(priority.onClick) : undefined}
                    className={`w-full rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-colors ${
                      priority.onClick ? 'hover:border-brand-cyan/35 hover:bg-white/[0.07]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-white">{priority.title}</p>
                        <p className="mt-1 text-sm text-white/60">{priority.description}</p>
                      </div>
                      <span className="rounded-full border border-brand-cyan/25 bg-brand-cyan/10 px-2.5 py-1 text-xs font-bold text-brand-cyan">
                        {priority.value}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title="Joueurs à mettre en avant" icon={<UsersRound className="h-5 w-5 text-brand-cyan" />}>
              {spotlightPlayers.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {spotlightPlayers.map((player) => (
                    <PlayerSpotlightCard
                      key={player.id}
                      player={player}
                      onOpen={() => router.push(`/market/player/${player.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyMessage message="Aucun joueur représenté pour le moment." />
              )}
            </Panel>

            <Panel title="Négociations récentes" icon={<Handshake className="h-5 w-5 text-brand-purple" />}>
              {dashboard.negotiations.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.negotiations.map((negotiation) => (
                    <NegotiationSummaryCard
                      key={negotiation.id}
                      negotiation={negotiation}
                      onOpen={() => router.push(`/negociations/${negotiation.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyMessage message="Aucune négociation récente à afficher." />
              )}
            </Panel>
          </section>

          <aside className="space-y-7">
            <Panel title="Demandes de représentation" icon={<FileCheck2 className="h-5 w-5 text-brand-cyan" />}>
              {pendingRequests.length > 0 ? (
                <div className="space-y-3">
                  {pendingRequests.slice(0, 5).map((request) => (
                    <div key={request.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="font-semibold text-white">
                        {request.player.firstName} {request.player.lastName}
                      </p>
                      <p className="mt-1 text-sm text-white/55">
                        Envoyée le {formatDateTime(request.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyMessage message="Aucune demande de représentation en attente." />
              )}
            </Panel>

            <Panel title="Contrats à surveiller" icon={<CalendarClock className="h-5 w-5 text-brand-purple" />}>
              {expiringPlayers.length > 0 ? (
                <div className="space-y-3">
                  {expiringPlayers.slice(0, 5).map(({ player, monthsLeft }) => (
                    <div key={player.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">
                            {player.firstName} {player.lastName}
                          </p>
                          <p className="mt-1 text-sm text-white/55">
                            {player.club} · {getPositionDisplayName(player.position)}
                          </p>
                        </div>
                        <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-xs font-bold text-amber-200">
                          {monthsLeft} mois
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyMessage message="Aucun contrat n’arrive à échéance dans les 12 prochains mois." />
              )}
            </Panel>
          </aside>
        </div>
      </div>
    </div>
  )
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-white/15 bg-[#071722]/85 p-5 shadow-xl">
      <div className="mb-4 flex items-center gap-3">
        {icon}
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function MetricCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: number
  icon: React.ReactNode
  tone: 'cyan' | 'purple' | 'blue' | 'emerald' | 'amber'
}) {
  const tones = {
    cyan: 'border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan',
    purple: 'border-brand-purple/30 bg-brand-purple/10 text-brand-purple',
    blue: 'border-blue-400/30 bg-blue-400/10 text-blue-300',
    emerald: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
    amber: 'border-amber-300/30 bg-amber-300/10 text-amber-200',
  }

  return (
    <article className="rounded-2xl border border-white/15 bg-[#071722]/80 p-4 shadow-xl">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${tones[tone]}`}>
        {icon}
      </div>
      <p className="mt-4 text-3xl font-bold text-white">{value}</p>
      <p className="mt-1 text-sm text-white/60">{label}</p>
    </article>
  )
}

function QuickAction({
  title,
  description,
  onClick,
  icon,
}: {
  title: string
  description: string
  onClick: () => void
  icon: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-white/15 bg-white/5 p-4 text-left transition-colors hover:border-brand-cyan/35 hover:bg-white/[0.08]"
    >
      <span className="flex items-center gap-2 text-sm font-semibold text-white">
        {icon}
        {title}
      </span>
      <span className="mt-1.5 block text-xs leading-5 text-white/50">{description}</span>
    </button>
  )
}

function Badge({
  icon,
  label,
  tone,
}: {
  icon: React.ReactNode
  label: string
  tone: 'cyan' | 'purple' | 'white'
}) {
  const tones = {
    cyan: 'border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan',
    purple: 'border-brand-purple/30 bg-brand-purple/10 text-brand-purple',
    white: 'border-white/15 bg-white/5 text-white/75',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone]}`}>
      {icon}
      {label}
    </span>
  )
}

function PlayerSpotlightCard({
  player,
  onOpen,
}: {
  player: Player
  onOpen: () => void
}) {
  return (
    <article className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-3">
        <PlayerAvatar player={player} />
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">
            {player.firstName} {player.lastName}
          </p>
          <p className="mt-1 text-sm text-white/55">
            {getPositionDisplayName(player.position)} · {player.club}
          </p>
          <p className="mt-1 text-sm font-semibold text-brand-cyan">
            {player.marketValue ?? '-'}
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="secondary"
        className="mt-4 w-full"
        onClick={onOpen}
        icon={<ArrowRight className="h-4 w-4" />}
      >
        Voir le dossier
      </Button>
    </article>
  )
}

function NegotiationSummaryCard({
  negotiation,
  onOpen,
}: {
  negotiation: AgentDashboardNegotiation
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-colors hover:border-brand-cyan/35 hover:bg-white/[0.08]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-white">
            {negotiation.player ? `${negotiation.player.firstName} ${negotiation.player.lastName}` : 'Joueur inconnu'}
          </p>
          <p className="mt-1 text-sm text-white/55">
            {negotiation.club.name} · {negotiation.status.label}
          </p>
        </div>
        <span className="text-xs text-white/35">{formatDateTime(negotiation.updatedAt)}</span>
      </div>
      {negotiation.latestOffer && (
        <p className="mt-3 text-sm font-semibold text-brand-cyan">
          {negotiation.latestOffer.displayAmount ?? negotiation.latestOffer.annualSalary}
        </p>
      )}
    </button>
  )
}

function PlayerAvatar({ player }: { player: Pick<Player, 'firstName' | 'lastName' | 'photoUrl'> }) {
  const fallback = (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan font-bold text-white">
      {player.firstName.charAt(0)}{player.lastName.charAt(0)}
    </div>
  )

  if (!player.photoUrl) return fallback

  return (
    <CircleImage
      src={player.photoUrl}
      alt={`${player.firstName} ${player.lastName}`}
      className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/20"
      sizes="48px"
      fallback={fallback}
    />
  )
}

function EmptyMessage({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/55">
      {message}
    </div>
  )
}

function getRemainingContractMonths(value?: string | null): number | null {
  if (!value) return null

  const today = new Date()
  const endDate = new Date(`${value}T00:00:00`)
  const months = (endDate.getFullYear() - today.getFullYear()) * 12
    + endDate.getMonth() - today.getMonth()
    + (endDate.getDate() > today.getDate() ? 1 : 0)

  return Math.max(0, months)
}

function formatDateTime(value?: string | null): string {
  if (!value) return 'Récemment'

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function buildPriorities({
  pendingRequests,
  expiringPlayers,
  activeNegotiations,
  playersOnMarket,
  representedPlayers,
}: {
  pendingRequests: number
  expiringPlayers: number
  activeNegotiations: number
  playersOnMarket: number
  representedPlayers: number
}) {
  const priorities = [
    {
      title: 'Validations administratives',
      description: 'Suivez les demandes de représentation encore en attente de vérification.',
      value: pendingRequests,
      onClick: pendingRequests > 0 ? '/mes-joueurs' : undefined,
    },
    {
      title: 'Contrats à anticiper',
      description: 'Sécurisez les joueurs qui arrivent bientôt en fin de contrat.',
      value: expiringPlayers,
      onClick: expiringPlayers > 0 ? '/mes-joueurs' : undefined,
    },
    {
      title: 'Discussions contractuelles',
      description: 'Gardez un oeil sur les négociations en cours avec les clubs.',
      value: activeNegotiations,
      onClick: activeNegotiations > 0 ? '/negociations' : undefined,
    },
    {
      title: 'Joueurs à exposer',
      description: 'Mesurez la part de votre portefeuille déjà visible sur le marché.',
      value: representedPlayers > 0 ? `${playersOnMarket}/${representedPlayers}` : '0/0',
      onClick: representedPlayers > 0 ? '/mes-joueurs' : undefined,
    },
  ]

  return priorities
}

export default AgentProfilePage
