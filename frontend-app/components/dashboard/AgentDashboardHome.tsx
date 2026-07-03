'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  FileClock,
  Handshake,
  Mail,
  Search,
  UserRoundCheck,
  UsersRound,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

import Button from '@/components/ui/Button'
import CircleImage from '@/components/media/CircleImage'
import { useAuth } from '@/context/AuthProvider'
import {
  dashboardManager,
  type AgentDashboardHomeData,
  type AgentDashboardNegotiation,
  type AgentDashboardPlayer,
} from '@/features/dashboard/dashboard'
import {
  formatMessageDate,
  getOtherParticipant,
  messagesManager,
  type DirectConversation,
} from '@/features/messages/messages'
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

function formatCurrentDate(date: Date): string {
  const label = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return label.charAt(0).toUpperCase() + label.slice(1)
}

function formatRelativeDate(value?: string | null): string {
  if (!value) return 'Mise à jour récente'

  const timestamp = new Date(value).getTime()
  const difference = Date.now() - timestamp
  const hours = Math.max(0, Math.floor(difference / 3_600_000))

  if (hours < 1) return 'Mis à jour il y a moins d’une heure'
  if (hours < 24) return `Mis à jour il y a ${hours} h`

  const days = Math.floor(hours / 24)
  return `Mis à jour il y a ${days} jour${days > 1 ? 's' : ''}`
}

function AgentDashboardHome() {
  const router = useRouter()
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState<AgentDashboardHomeData>(EMPTY_DASHBOARD)
  const [recentConversations, setRecentConversations] = useState<DirectConversation[]>([])
  const [expandedPlayers, setExpandedPlayers] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const dateLabel = useMemo(() => formatCurrentDate(new Date()), [])
  const groupedNegotiations = useMemo(() => {
    const groups = new Map<string, {
      key: string
      negotiations: AgentDashboardNegotiation[]
    }>()

    for (const negotiation of dashboard.negotiations) {
      const key = negotiation.player?.id ?? negotiation.id
      const existing = groups.get(key)

      if (existing) {
        existing.negotiations.push(negotiation)
      } else {
        groups.set(key, {
          key,
          negotiations: [negotiation],
        })
      }
    }

    return Array.from(groups.values()).map((group) => ({
      ...group,
      primaryNegotiation: group.negotiations[0],
      otherNegotiations: group.negotiations.slice(1),
    }))
  }, [dashboard.negotiations])

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      try {
        const [dashboardResponse, conversationsResponse] = await Promise.all([
          dashboardManager.getAgentHome(),
          messagesManager.getConversations(),
        ])

        if (!isMounted) return

        if (!dashboardResponse.ok) {
          setErrorMessage('Impossible de charger votre espace agent pour le moment.')
          return
        }

        setDashboard(dashboardResponse.data)
        setRecentConversations(
          conversationsResponse.ok
            ? conversationsResponse.data.conversations
              .filter((conversation) => conversation.lastMessage)
              .slice(0, 4)
            : [],
        )
      } catch {
        if (isMounted) {
          setErrorMessage('Impossible de charger votre espace agent pour le moment.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  function togglePlayerGroup(playerKey: string) {
    setExpandedPlayers((current) => ({
      ...current,
      [playerKey]: !current[playerKey],
    }))
  }

  const agentName = dashboard.profile?.agencyName?.trim()
    || [user?.firstName, user?.lastName].filter(Boolean).join(' ')
    || 'Agent'

  return (
    <div className="auth-bg min-h-screen w-full px-4 pb-12 pt-28">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-7 flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-cyan">
              Espace agent
            </p>
            <h1 className="mt-2 text-3xl font-bold uppercase tracking-wide text-white md:text-4xl">
              Bonjour {agentName}
            </h1>
            <p className="mt-2 text-white/70">
              {dateLabel} · Pilotez vos joueurs et leurs opportunités depuis un seul espace.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            icon={<Search className="h-4 w-4" />}
            onClick={() => router.push('/market')}
          >
            Explorer le marché
          </Button>
        </header>

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={<Handshake className="h-5 w-5" />}
            label="Négociations actives"
            value={dashboard.stats.activeNegotiations}
            tone="purple"
          />
          <MetricCard
            icon={<UsersRound className="h-5 w-5" />}
            label="Joueurs représentés"
            value={dashboard.stats.representedPlayers}
            tone="cyan"
          />
          <MetricCard
            icon={<Mail className="h-5 w-5" />}
            label="Offres en attente"
            value={dashboard.stats.pendingOffers}
            tone="blue"
          />
          <MetricCard
            icon={<UserRoundCheck className="h-5 w-5" />}
            label="Joueurs disponibles"
            value={dashboard.stats.availablePlayers}
            tone="emerald"
          />
        </section>

        <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]">
          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Handshake className="h-6 w-6 text-brand-cyan" />
                <h2 className="text-2xl font-bold text-white">Négociations en cours</h2>
              </div>
              <button
                type="button"
                onClick={() => router.push('/negociations')}
                className="text-sm font-semibold text-brand-cyan transition-colors hover:text-white"
              >
                Tout afficher
              </button>
            </div>

            {isLoading ? (
              <LoadingCards count={3} />
            ) : groupedNegotiations.length > 0 ? (
              <div className="space-y-4">
                {groupedNegotiations.map((group) => (
                  <article
                    key={group.key}
                    className="relative overflow-hidden rounded-2xl border border-white/25 bg-[#071722] p-5 shadow-xl transition-colors hover:border-brand-cyan/55"
                  >
                    <NegotiationCard
                      negotiation={group.primaryNegotiation}
                      onOpen={() => router.push(`/negociations/${group.primaryNegotiation.id}`)}
                    />

                    {group.otherNegotiations.length > 0 && (
                      <div className="mt-4 border-t border-white/10 pt-4">
                        <button
                          type="button"
                          onClick={() => togglePlayerGroup(group.key)}
                          className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/15 bg-[#0a1e2b] px-4 py-3 text-left transition-colors hover:border-brand-cyan/40 hover:bg-[#0d2738]"
                        >
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {group.otherNegotiations.length} autre(s) négociation(s) pour ce joueur
                            </p>
                            <p className="mt-1 text-xs text-white/50">
                              {group.negotiations.length} négociation(s) au total
                            </p>
                          </div>
                          {expandedPlayers[group.key]
                            ? <ChevronUp className="h-4 w-4 text-white/70" />
                            : <ChevronDown className="h-4 w-4 text-white/70" />}
                        </button>

                        {expandedPlayers[group.key] && (
                          <div className="mt-3 space-y-3">
                            {group.otherNegotiations.map((negotiation) => (
                              <div
                                key={negotiation.id}
                                className="rounded-xl border border-white/15 bg-[#06111c] p-4"
                              >
                                <NegotiationCard
                                  negotiation={negotiation}
                                  compact
                                  onOpen={() => router.push(`/negociations/${negotiation.id}`)}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyPanel
                icon={<BriefcaseBusiness className="h-7 w-7" />}
                title="Aucune négociation active"
                description="Les discussions contractuelles de vos joueurs apparaîtront ici dès qu’un club initiera une démarche."
                actionLabel="Voir les opportunités"
                onAction={() => router.push('/market')}
              />
            )}

            <section className="mt-7">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-6 w-6 text-brand-cyan" />
                  <h2 className="text-2xl font-bold text-white">Messages récents</h2>
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/messages')}
                  className="text-sm font-semibold text-brand-cyan transition-colors hover:text-white"
                >
                  Ouvrir la messagerie
                </button>
              </div>

              {isLoading ? (
                <LoadingCards count={2} compact />
              ) : recentConversations.length > 0 ? (
                <div className="space-y-3">
                  {recentConversations.map((conversation) => (
                    <RecentMessageCard
                      key={conversation.id}
                      conversation={conversation}
                      currentUserId={user?.id}
                      onOpen={() => router.push(`/messages?conversation=${conversation.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyPanel
                  icon={<Mail className="h-7 w-7" />}
                  title="Aucun message récent"
                  description="Vos derniers échanges avec les clubs apparaîtront ici dès qu’une conversation sera active."
                  actionLabel="Accéder aux messages"
                  onAction={() => router.push('/messages')}
                />
              )}
            </section>
          </section>

          <aside className="space-y-6">
            <section className="relative overflow-hidden rounded-2xl border border-brand-cyan/30 bg-[#071722] p-5 shadow-2xl shadow-brand-cyan/10">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-cyan to-brand-purple" />
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UsersRound className="h-5 w-5 text-brand-cyan" />
                  <h2 className="text-xl font-bold text-white">Mes joueurs</h2>
                </div>
                <span className="rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-2.5 py-1 text-xs font-bold text-brand-cyan">
                  {dashboard.stats.representedPlayers}
                </span>
              </div>

              {isLoading ? (
                <LoadingCards count={2} compact />
              ) : dashboard.players.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.players.map((player) => (
                    <PlayerSummary
                      key={player.id}
                      player={player}
                      onClick={() => router.push(`/market/player/${player.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-white/15 bg-[#0a1e2b] p-4 text-sm leading-relaxed text-white/75">
                  Aucun joueur n’est encore rattaché à votre profil agent.
                </p>
              )}

              <Button
                type="button"
                variant="secondary"
                className="mt-4 w-full"
                icon={<ArrowRight className="h-4 w-4" />}
                onClick={() => router.push('/mes-joueurs')}
              >
                Gérer mes joueurs
              </Button>
            </section>

            <section className="relative overflow-hidden rounded-2xl border border-brand-purple/35 bg-[#071722] p-5 shadow-2xl shadow-brand-purple/10">
              <CalendarClock className="h-7 w-7 text-brand-purple" />
              <h2 className="mt-3 text-xl font-bold text-white">Priorités du jour</h2>
              <div className="mt-4 space-y-3">
                <PriorityRow
                  label="Offres à examiner"
                  value={dashboard.stats.pendingOffers}
                  onClick={() => router.push('/negociations')}
                />
                <PriorityRow
                  label="Contrats en discussion"
                  value={dashboard.stats.activeNegotiations}
                  onClick={() => router.push('/negociations')}
                />
                <PriorityRow
                  label="Joueurs à valoriser"
                  value={Math.max(
                    0,
                    dashboard.stats.representedPlayers - dashboard.stats.availablePlayers,
                  )}
                  onClick={() => router.push('/mes-joueurs')}
                />
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number
  tone: 'purple' | 'cyan' | 'blue' | 'emerald'
}) {
  const tones = {
    purple: 'border-brand-purple/35 bg-brand-purple/15 text-brand-purple',
    cyan: 'border-brand-cyan/35 bg-brand-cyan/15 text-brand-cyan',
    blue: 'border-blue-400/35 bg-blue-400/15 text-blue-300',
    emerald: 'border-emerald-400/35 bg-emerald-400/15 text-emerald-300',
  }

  return (
    <article className="rounded-2xl border border-white/20 bg-[#071722] p-5 shadow-xl">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${tones[tone]}`}>
        {icon}
      </div>
      <p className="mt-4 text-3xl font-bold text-white">{value}</p>
      <p className="mt-1 text-sm text-white/60">{label}</p>
    </article>
  )
}

function NegotiationCard({
  negotiation,
  onOpen,
  compact = false,
}: {
  negotiation: AgentDashboardNegotiation
  onOpen: () => void
  compact?: boolean
}) {
  const player = negotiation.player
  const isUrgent = negotiation.status.value === 'counter_offer'

  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          {player ? <PlayerAvatar player={player} size="lg" /> : null}
          <div className="min-w-0">
            <p className={`truncate font-bold text-white ${compact ? 'text-lg' : 'text-xl'}`}>
              {player ? `${player.firstName} ${player.lastName}` : 'Joueur inconnu'}
            </p>
            <p className="mt-1 text-sm text-white/60">
              {getPositionDisplayName(player?.position)} · {player?.club ?? 'Sans club'}
            </p>
            <span className="mt-3 inline-flex rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-1 text-xs font-semibold text-brand-cyan">
              {negotiation.typeLabel ? `${negotiation.typeLabel} · ` : ''}{negotiation.status.label}
            </span>
          </div>
        </div>

        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${
          isUrgent
            ? 'border-amber-400/40 bg-amber-400/10 text-amber-300'
            : 'border-brand-purple/40 bg-brand-purple/10 text-white/80'
        }`}>
          {isUrgent ? 'Action requise' : 'En cours'}
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-4 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <ClubMark name={negotiation.club.name} logoUrl={negotiation.club.logoUrl} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">{negotiation.club.name}</p>
            <p className="text-xs text-white/55">
              {negotiation.latestOffer
                ? `${negotiation.latestOffer.displayAmount ?? `${negotiation.latestOffer.annualSalary} / an`} · ${negotiation.latestOffer.statusLabel}`
                : 'Aucune offre formelle reçue'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <span className="inline-flex items-center gap-1.5 text-xs text-white/45">
            <FileClock className="h-4 w-4" />
            {formatRelativeDate(negotiation.updatedAt)}
          </span>
          <Button type="button" variant="secondary" className="px-4 py-2" onClick={onOpen}>
            Consulter
          </Button>
        </div>
      </div>
    </div>
  )
}

function PlayerSummary({
  player,
  onClick,
}: {
  player: AgentDashboardPlayer
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-white/15 bg-[#0a1e2b] p-3 text-left transition-colors hover:border-brand-cyan/45 hover:bg-[#0d2738]"
    >
      <PlayerAvatar player={player} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-white">
          {player.firstName} {player.lastName}
        </p>
        <p className="truncate text-xs text-white/55">{getPositionDisplayName(player.position)} · {player.club}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/65">
            {player.marketValue}
          </span>
          <span className="rounded-full bg-brand-cyan/10 px-2 py-0.5 text-[11px] text-brand-cyan">
            {player.marketStatus}
          </span>
        </div>
      </div>
    </button>
  )
}

function RecentMessageCard({
  conversation,
  currentUserId,
  onOpen,
}: {
  conversation: DirectConversation
  currentUserId?: string
  onOpen: () => void
}) {
  const participant = currentUserId
    ? getOtherParticipant(conversation, currentUserId)
    : conversation.otherParticipant
  const lastMessage = conversation.lastMessage
  const displayName = participant
    ? [participant.firstName, participant.lastName].filter(Boolean).join(' ') || participant.email
    : 'Conversation KickDeal'
  const contextLabel = participant?.clubName ?? participant?.agencyName ?? participant?.email ?? 'Interlocuteur'
  const senderLabel = lastMessage?.sender?.id === currentUserId
    ? 'Vous'
    : [lastMessage?.sender?.firstName, lastMessage?.sender?.lastName].filter(Boolean).join(' ') || 'Message'

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-4 rounded-2xl border border-white/20 bg-[#071722] p-4 text-left shadow-xl transition-colors hover:border-brand-cyan/55 hover:bg-[#0a1e2b]"
    >
      <MessageAvatar participant={participant} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-white">{displayName}</p>
            <p className="truncate text-xs font-semibold text-brand-cyan/80">{contextLabel}</p>
          </div>
          <span className="shrink-0 text-xs font-semibold text-white/40">
            {formatMessageDate(lastMessage?.createdAt ?? conversation.updatedAt)}
          </span>
        </div>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/65">
          <span className="font-semibold text-white/85">{senderLabel} : </span>
          {lastMessage?.content ?? 'Aucun message pour le moment.'}
        </p>
      </div>
      <ArrowRight className="hidden h-4 w-4 shrink-0 text-white/35 transition-colors group-hover:text-brand-cyan sm:block" />
    </button>
  )
}

function MessageAvatar({ participant }: { participant: DirectConversation['otherParticipant'] }) {
  const label = participant?.clubName ?? participant?.agencyName ?? participant?.firstName ?? 'K'
  const logoUrl = participant?.clubLogoUrl

  if (logoUrl) {
    return (
      <CircleImage
        src={logoUrl}
        alt={label}
        className="relative h-12 w-12 shrink-0"
        sizes="48px"
        imageClassName="object-contain"
        fallback={null}
      />
    )
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan text-sm font-bold text-white">
      {label.charAt(0).toUpperCase()}
    </div>
  )
}

function PlayerAvatar({
  player,
  size = 'md',
}: {
  player: AgentDashboardPlayer
  size?: 'md' | 'lg'
}) {
  const dimensions = size === 'lg' ? 'h-16 w-16' : 'h-12 w-12'
  const initials = `${player.firstName.charAt(0)}${player.lastName.charAt(0)}`
  const fallback = (
    <div className={`flex ${dimensions} shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan font-bold text-white`}>
      {initials}
    </div>
  )

  if (!player.photoUrl) return fallback

  return (
    <CircleImage
      src={player.photoUrl}
      alt={`${player.firstName} ${player.lastName}`}
      className={`relative ${dimensions} shrink-0 overflow-hidden rounded-full border-2 border-brand-purple/70`}
      sizes={size === 'lg' ? '64px' : '48px'}
      fallback={fallback}
    />
  )
}

function ClubMark({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  if (!logoUrl) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 font-bold text-white">
        {name.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <CircleImage
      src={logoUrl}
      alt={name}
      className="relative h-10 w-10 shrink-0"
      sizes="40px"
      imageClassName="object-contain"
      fallback={null}
    />
  )
}

function PriorityRow({
  label,
  value,
  onClick,
}: {
  label: string
  value: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl border border-white/15 bg-[#0a1e2b] px-4 py-3 text-left transition-colors hover:border-brand-purple/45 hover:bg-[#0d2738]"
    >
      <span className="text-sm text-white/70">{label}</span>
      <span className="text-lg font-bold text-white">{value}</span>
    </button>
  )
}

function EmptyPanel({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <div className="rounded-2xl border border-brand-cyan/30 bg-[#071722] p-8 text-center shadow-xl">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan">
        {icon}
      </div>
      <h3 className="mt-4 text-xl font-bold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-white/60">{description}</p>
      <Button type="button" variant="secondary" className="mt-5" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  )
}

function LoadingCards({ count, compact = false }: { count: number; compact?: boolean }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`${compact ? 'h-20' : 'h-40'} animate-pulse rounded-xl border border-white/15 bg-[#071722]`}
        />
      ))}
    </div>
  )
}

export default AgentDashboardHome
