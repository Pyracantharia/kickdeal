'use client'

import React from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowRightLeft,
  History,
  MessageSquare,
  Radar,
  Search,
  Sparkles,
  Users,
} from 'lucide-react'

import { useAuth } from '@/context/AuthProvider'
import { useMessagesUnread } from '@/context/MessagesUnreadProvider'
import { useNotifications } from '@/context/NotificationsProvider'

interface MarketAction {
  id: string
  eyebrow: string
  title: string
  description: string
  href: string
  cta: string
  icon: React.ReactNode
  tone: 'cyan' | 'purple'
}

const CLUB_ACTIONS: MarketAction[] = [
  {
    id: 'transfers-home',
    eyebrow: 'Salle des offres',
    title: 'Piloter les négociations',
    description: 'Suivez vos offres reçues, vos propositions envoyées et les discussions qui peuvent faire bouger votre effectif.',
    href: '/market/transfers',
    cta: 'Ouvrir le marché',
    icon: <ArrowRightLeft className="h-6 w-6" />,
    tone: 'cyan',
  },
  {
    id: 'search-players',
    eyebrow: 'Scouting',
    title: 'Trouver le bon joueur',
    description: 'Cherchez par poste, championnat, statut transfert ou profil sportif pour préparer votre prochaine approche.',
    href: '/market/search',
    cta: 'Rechercher',
    icon: <Search className="h-6 w-6" />,
    tone: 'purple',
  },
  {
    id: 'transfer-history',
    eyebrow: 'Archives',
    title: 'Relire les accords',
    description: 'Retrouvez les transferts acceptés, les montants négociés et les deals finalisés par votre club.',
    href: '/market/transfers/history',
    cta: 'Voir l’historique',
    icon: <History className="h-6 w-6" />,
    tone: 'purple',
  },
  {
    id: 'messaging',
    eyebrow: 'Relations clubs',
    title: 'Reprendre les échanges',
    description: 'Accédez à vos conversations pour avancer vite quand une opportunité devient chaude.',
    href: '/messages',
    cta: 'Messagerie',
    icon: <MessageSquare className="h-6 w-6" />,
    tone: 'cyan',
  },
]

const AGENT_ACTIONS: MarketAction[] = [
  {
    id: 'search-clubs',
    eyebrow: 'Prospection',
    title: 'Trouver un club',
    description: 'Sélectionnez un joueur représenté et identifiez les clubs les plus crédibles pour une approche.',
    href: '/market/clubs',
    cta: 'Explorer les clubs',
    icon: <Radar className="h-6 w-6" />,
    tone: 'cyan',
  },
  {
    id: 'search-players-agent',
    eyebrow: 'Portefeuille',
    title: 'Ajouter un joueur',
    description: 'Recherchez des talents et lancez une demande pour enrichir votre portefeuille agent.',
    href: '/mes-joueurs?add=1',
    cta: 'Rechercher un joueur',
    icon: <Users className="h-6 w-6" />,
    tone: 'purple',
  },
]

function MarketHub() {
  const { user } = useAuth()
  const { hasUnreadMessages } = useMessagesUnread()
  const { getActionCount, getUnreadCount } = useNotifications()
  const isAgent = Boolean(user?.roles.includes('ROLE_AGENT'))
  const actions = isAgent ? AGENT_ACTIONS : CLUB_ACTIONS
  const primaryAction = actions[0]
  const secondaryActions = actions.slice(1)
  const hasMarketAttention = getActionCount('/market') > 0 || getUnreadCount('/market') > 0
  const hasMessagesAttention = hasUnreadMessages || getUnreadCount('/messages') > 0

  return (
    <div className="auth-bg min-h-screen w-full px-4 pb-16 pt-32 md:px-8 md:pt-36">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8 border-b border-white/10 pb-7">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-brand-cyan">
            {isAgent ? 'Prospection agent' : 'War room mercato'}
          </p>
          <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-black uppercase leading-none text-white md:text-6xl">
                Marché des transferts
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-white/62">
                {isAgent
                  ? 'Préparez les opportunités, trouvez les bons clubs et développez votre portefeuille avec une vue claire.'
                  : 'Cherchez, ciblez, négociez et suivez les accords depuis un cockpit pensé pour les décisions rapides.'}
              </p>
            </div>

            <div className="rounded-2xl border border-brand-cyan/25 bg-brand-cyan/10 p-4 shadow-[0_0_34px_rgba(0,245,212,0.10)]">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-cyan/40 bg-brand-cyan/15 text-brand-cyan">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-cyan">Priorité</p>
                  <p className="text-lg font-bold text-white">
                    {isAgent ? 'Créer une piste crédible' : 'Traiter les offres chaudes'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className={`grid items-start gap-6 ${
          isAgent
            ? 'lg:grid-cols-[minmax(0,1fr)_430px]'
            : 'lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]'
        }`}>
          <PrimaryMarketPanel action={primaryAction} isAgent={isAgent} hasAttention={hasMarketAttention} />

          <div className="grid gap-4 self-start">
            {secondaryActions.map((action) => (
              <MarketActionCard
                key={action.id}
                action={action}
                hasAttention={action.id === 'messaging' && hasMessagesAttention}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function PrimaryMarketPanel({
  action,
  isAgent,
  hasAttention,
}: {
  action: MarketAction
  isAgent: boolean
  hasAttention: boolean
}) {
  return (
    <Link
      href={action.href}
      className="group relative overflow-hidden rounded-[28px] border border-brand-cyan/45 bg-[#071722]/88 p-6 shadow-2xl shadow-brand-cyan/10 transition-all hover:-translate-y-1 hover:border-brand-cyan md:p-8"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-cyan" />
      <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-brand-cyan/20 blur-3xl transition-transform group-hover:scale-125" />
      <div className="pointer-events-none absolute -bottom-28 left-8 h-72 w-72 rounded-full bg-brand-purple/20 blur-3xl" />

      <div className="relative z-10 flex min-h-[430px] flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-brand-cyan">
              {action.icon}
              {action.eyebrow}
            </div>
            {hasAttention && <AttentionDot label="Action marché à traiter" />}
          </div>

          <h2 className="mt-7 max-w-2xl text-4xl font-black uppercase leading-[0.95] text-white md:text-6xl">
            {action.title}
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-white/68">
            {action.description}
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Metric label={isAgent ? 'Pistes' : 'Offres reçues'} value={isAgent ? 'Clubs' : 'Live'} />
          <Metric label={isAgent ? 'Ciblage' : 'Décision'} value={isAgent ? 'Smart' : 'Rapide'} />
          <Metric label={isAgent ? 'Action' : 'Suivi'} value={isAgent ? 'Agent' : 'Deal'} />
        </div>

        <div className="mt-7 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
          <span className="font-bold text-white">{action.cta}</span>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-cyan text-[#06131c] transition-transform group-hover:translate-x-1">
            <ArrowRight className="h-5 w-5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

function MarketActionCard({ action, hasAttention = false }: { action: MarketAction; hasAttention?: boolean }) {
  const isCyan = action.tone === 'cyan'

  return (
    <Link
      href={action.href}
      className={`group relative overflow-hidden rounded-3xl border bg-[#071722]/82 p-5 shadow-xl transition-all hover:-translate-y-0.5 ${
        isCyan
          ? 'border-brand-cyan/28 hover:border-brand-cyan/70 hover:shadow-brand-cyan/10'
          : 'border-brand-purple/32 hover:border-brand-purple/75 hover:shadow-brand-purple/10'
      }`}
    >
      <div className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-2xl ${
        isCyan ? 'bg-brand-cyan/16' : 'bg-brand-purple/18'
      }`} />

      {hasAttention && (
        <div className="absolute right-5 top-5 z-20">
          <AttentionDot label="Nouveau message" />
        </div>
      )}

      <div className="relative z-10 flex items-start gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${
          isCyan
            ? 'border-brand-cyan/40 bg-brand-cyan/12 text-brand-cyan'
            : 'border-brand-purple/45 bg-brand-purple/14 text-brand-purple'
        }`}>
          {action.icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className={`text-xs font-bold uppercase tracking-[0.18em] ${
            isCyan ? 'text-brand-cyan' : 'text-brand-purple'
          }`}>
            {action.eyebrow}
          </p>
          <h3 className="mt-1 text-2xl font-bold text-white">{action.title}</h3>
          <p className="mt-2 text-sm leading-6 text-white/58">{action.description}</p>

          <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white transition-colors group-hover:text-brand-cyan">
            {action.cta}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  )
}

function AttentionDot({ label }: { label: string }) {
  return (
    <span className="relative inline-flex h-3.5 w-3.5" aria-label={label} title={label}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-45" />
      <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-sky-400 ring-2 ring-[#07111d]" />
    </span>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/40">{label}</p>
      <p className="mt-1 text-2xl font-black uppercase text-white">{value}</p>
    </div>
  )
}

export default MarketHub
