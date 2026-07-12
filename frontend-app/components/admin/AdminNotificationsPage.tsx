'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Bell, Building2, CheckCheck, CheckCircle2, Circle, ClipboardList, Filter, LifeBuoy, RefreshCw, ShieldAlert } from 'lucide-react'

import Button from '@/components/ui/Button'
import { adminManager, type AdminDashboardAlert } from '@/features/admin/admin'
import {
  getReadAdminNotificationIds,
  loadAdminNotificationItems,
  markAdminNotificationRead,
  markAdminNotificationsRead,
  type AdminNotificationFilter,
  type AdminNotificationKind,
  type AdminNotificationItem,
} from '@/features/admin/adminNotifications'
import { useMessagesUnread } from '@/context/MessagesUnreadProvider'

const FILTERS: Array<{ id: AdminNotificationFilter; label: string }> = [
  { id: 'all', label: 'Toutes' },
  { id: 'unread', label: 'Non lues' },
  { id: 'club_requests', label: 'Clubs' },
  { id: 'player_agent_requests', label: 'Agents' },
  { id: 'message_reports', label: 'Signalements' },
  { id: 'support_messages', label: 'Assistance' },
]

const alertMeta: Record<AdminNotificationKind, { label: string; href: string; icon: typeof Building2; tone: string }> = {
  club_requests: {
    label: 'Demandes club',
    href: '/admin/club-requests',
    icon: Building2,
    tone: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  },
  player_agent_requests: {
    label: 'Demandes agent',
    href: '/admin/player-agent-requests',
    icon: ClipboardList,
    tone: 'border-brand-purple/30 bg-brand-purple/10 text-purple-200',
  },
  message_reports: {
    label: 'Signalements',
    href: '/admin/message-reports',
    icon: ShieldAlert,
    tone: 'border-red-400/30 bg-red-400/10 text-red-200',
  },
  support_messages: {
    label: 'Assistance',
    href: '/admin/support',
    icon: LifeBuoy,
    tone: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100',
  },
}

export default function AdminNotificationsPage() {
  const router = useRouter()
  const { unreadConversationIds, markConversationRead } = useMessagesUnread()
  const [alerts, setAlerts] = useState<AdminDashboardAlert[]>([])
  const [items, setItems] = useState<AdminNotificationItem[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(() => getReadAdminNotificationIds())
  const [filter, setFilter] = useState<AdminNotificationFilter>('all')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setErrorMessage(null)

    try {
      const [dashboardResponse, nextItems] = await Promise.all([
        adminManager.getDashboard(),
        loadAdminNotificationItems(80),
      ])

      if (!dashboardResponse.ok) {
        setErrorMessage('Impossible de charger les notifications admin.')
        return
      }

      setAlerts(dashboardResponse.data.alerts)
      setItems(nextItems)
      setReadIds(getReadAdminNotificationIds())
    } catch {
      setErrorMessage('Impossible de charger les notifications admin.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const unreadItems = useMemo(() => items.filter((item) => item.kind !== 'support_messages' && !readIds.has(item.id)), [items, readIds])
  const unreadSupportItems = useMemo(
    () => items.filter((item) => item.kind === 'support_messages' && item.sourceId && unreadConversationIds.has(item.sourceId)),
    [items, unreadConversationIds],
  )
  const unreadCount = unreadItems.length + unreadSupportItems.length
  const displayedItems = useMemo(() => {
    if (filter === 'unread') {
      return [...unreadItems, ...unreadSupportItems]
        .sort((left, right) => new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime())
    }
    if (filter === 'all') return items
    return items.filter((item) => item.kind === filter)
  }, [filter, items, unreadItems, unreadSupportItems])
  const totalCount = alerts.reduce((sum, alert) => sum + alert.count, 0)

  function markOneRead(item: AdminNotificationItem) {
    if (!readIds.has(item.id)) {
      markAdminNotificationRead(item.id)
      setReadIds(getReadAdminNotificationIds())
    }
    if (item.kind === 'support_messages' && item.sourceId) {
      markConversationRead(item.sourceId)
    }

    router.push(item.href)
  }

  function markAllRead() {
    markAdminNotificationsRead(items.map((item) => item.id))
    items.forEach((item) => {
      if (item.kind === 'support_messages' && item.sourceId) {
        markConversationRead(item.sourceId)
      }
    })
    setReadIds(getReadAdminNotificationIds())
  }

  return (
    <div className="auth-bg min-h-screen w-full px-4 pb-14 pt-36 md:px-8 md:pt-40">
      <main className="mx-auto w-full max-w-6xl">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-gray-300 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Retour administration
        </Link>

        <header className="mb-8 flex flex-col gap-5 border-b border-white/10 pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-cyan">Centre d’attention admin</p>
            <h1 className="mt-2 text-4xl font-bold text-white">NOTIFICATIONS</h1>
            <p className="mt-2 max-w-2xl text-white/60">
              Retrouvez les nouvelles demandes, passations et signalements qui demandent une décision administrateur.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={markAllRead}
              icon={<CheckCheck className="h-4 w-4" />}
              disabled={unreadCount === 0}
            >
              Tout marquer comme lu
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void load()}
              icon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
              disabled={loading}
            >
              Actualiser
            </Button>
          </div>
        </header>

        {errorMessage && <div className="mb-5 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{errorMessage}</div>}

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <SummaryCard label="Non lues" value={unreadCount} tone="cyan" icon={<Bell className="h-5 w-5" />} />
          <SummaryCard label="Actions à traiter" value={totalCount} tone="purple" icon={<CheckCircle2 className="h-5 w-5" />} />
          <SummaryCard label="État admin" value={totalCount === 0 ? 'OK' : 'À jour'} tone="neutral" icon={<ShieldAlert className="h-5 w-5" />} />
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          {alerts.length === 0 && !loading ? (
            <div className="md:col-span-3 flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/8 p-5 text-emerald-200">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-semibold">Aucune notification admin en attente.</p>
            </div>
          ) : loading ? (
            Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-white/5" />)
          ) : (
            alerts.map((alert) => <AlertSummary key={alert.id} alert={alert} />)
          )}
        </section>

        <div className="mb-6 rounded-2xl border border-white/10 bg-[#071722]/80 p-3 shadow-xl backdrop-blur">
          <div className="mb-3 flex items-center gap-2 px-2 text-sm font-bold uppercase text-white/60">
            <Filter className="h-4 w-4 text-brand-cyan" />
            Filtres
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  filter === item.id
                    ? 'bg-brand-cyan text-[#071722]'
                    : 'border border-white/15 bg-white/5 text-white/65 hover:border-brand-cyan/50 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-white/15 bg-[#071722]/85 shadow-2xl backdrop-blur">
          {loading ? (
            <LoadingState />
          ) : displayedItems.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            <ul className="divide-y divide-white/10">
              {displayedItems.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  isRead={readIds.has(item.id)}
                  onOpen={() => markOneRead(item)}
                />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}

function AlertSummary({ alert }: { alert: AdminDashboardAlert }) {
  const meta = alertMeta[alert.id]
  const Icon = meta.icon

  return (
    <Link href={alert.href} className={`group rounded-2xl border p-5 transition hover:-translate-y-0.5 ${meta.tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-current/20 bg-black/15">
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded-full bg-black/25 px-3 py-1 text-sm font-black tabular-nums">{alert.count}</span>
      </div>
      <h2 className="mt-5 text-lg font-bold text-white">{meta.label}</h2>
      <p className="mt-2 text-sm opacity-80">Plus ancienne : {formatAge(alert.ageInDays, alert.oldestCreatedAt)}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-white">
        Ouvrir <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </span>
    </Link>
  )
}

function NotificationRow({ item, isRead, onOpen }: { item: AdminNotificationItem; isRead: boolean; onOpen: () => void }) {
  const meta = alertMeta[item.kind]
  const Icon = meta.icon

  return (
    <li>
      <button type="button" onClick={onOpen} className="group flex w-full items-start gap-4 px-5 py-5 text-left transition-colors hover:bg-white/5 md:px-6">
        <Circle className={`mt-1 h-3 w-3 shrink-0 ${isRead ? 'fill-white/20 text-white/20' : 'fill-brand-cyan text-brand-cyan'}`} />
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${meta.tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-cyan">{meta.label}</span>
            {!isRead && (
              <span className="rounded-full border border-sky-400/35 bg-sky-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-sky-300">
                Nouveau
              </span>
            )}
            <span className="text-xs text-white/40">{formatDate(item.createdAt)}</span>
          </div>
          <p className="mt-2 text-lg font-bold text-white">{item.title}</p>
          <p className="mt-1 text-sm leading-6 text-white/60">{item.body}</p>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-white/35 transition group-hover:translate-x-1 group-hover:text-brand-cyan" />
      </button>
    </li>
  )
}

function SummaryCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string
  value: number | string
  tone: 'cyan' | 'purple' | 'neutral'
  icon: React.ReactNode
}) {
  const toneClass = tone === 'cyan'
    ? 'border-brand-cyan/25 bg-brand-cyan/10 text-brand-cyan'
    : tone === 'purple'
      ? 'border-brand-purple/25 bg-brand-purple/10 text-brand-purple'
      : 'border-white/10 bg-white/5 text-white/70'

  return (
    <div className={`rounded-2xl border p-5 ${toneClass}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-[0.16em]">{label}</span>
        {icon}
      </div>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="space-y-4 p-6">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="h-20 animate-pulse rounded-xl bg-white/5" />
      ))}
    </div>
  )
}

function EmptyState({ filter }: { filter: AdminNotificationFilter }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-16 text-center">
      <Bell className="mb-4 h-12 w-12 text-brand-cyan/70" />
      <p className="text-xl font-bold text-white">Rien à signaler</p>
      <p className="mt-2 max-w-md text-white/55">
        {filter === 'unread'
          ? 'Toutes les notifications admin visibles ont été lues.'
          : 'Les prochaines demandes et signalements apparaîtront ici.'}
      </p>
    </div>
  )
}

function formatDate(value?: string | null) {
  if (!value) return 'date indisponible'

  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatAge(days: number, date?: string | null) {
  if (!date) return 'date indisponible'
  if (days === 0) return "aujourd’hui"
  if (days === 1) return 'hier'
  return `il y a ${days} jours`
}
