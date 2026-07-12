'use client'

import React from 'react'
import { Bell, CheckCheck, Circle, Clock3, ExternalLink, Filter, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'

import Button from '@/components/ui/Button'
import { useNotifications } from '@/context/NotificationsProvider'
import {
  AppNotification,
  NotificationCategory,
  NotificationsPagination,
  formatNotificationDate,
  notificationsManager,
} from '@/features/notifications/notifications'

const FILTERS: Array<{ id: NotificationCategory; label: string }> = [
  { id: 'all', label: 'Toutes' },
  { id: 'actions', label: 'À traiter' },
  { id: 'unread', label: 'Non lues' },
  { id: 'messages', label: 'Messages' },
  { id: 'market', label: 'Marché' },
  { id: 'negotiations', label: 'Négociations' },
  { id: 'players', label: 'Joueurs' },
  { id: 'admin', label: 'Admin' },
  { id: 'account', label: 'Compte' },
]

const PAGE_SIZE = 10
const EMPTY_PAGINATION: NotificationsPagination = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
}

function NotificationsHub() {
  const router = useRouter()
  const { unreadCount, actionCounts, latestNotification, refreshSummary, markAllRead } = useNotifications()
  const [filter, setFilter] = React.useState<NotificationCategory>('all')
  const [page, setPage] = React.useState(1)
  const [notifications, setNotifications] = React.useState<AppNotification[]>([])
  const [pagination, setPagination] = React.useState<NotificationsPagination>(EMPTY_PAGINATION)
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const actionTotal = React.useMemo(
    () => Object.values(actionCounts).reduce((sum, count) => sum + count, 0),
    [actionCounts],
  )

  const loadNotifications = React.useCallback(async (nextFilter = filter, nextPage = page) => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await notificationsManager.list(nextFilter, nextPage, PAGE_SIZE)
      if (!response.ok) {
        setErrorMessage('Impossible de charger les notifications.')
        return
      }

      setNotifications(response.data.notifications)
      setPagination(response.data.pagination)
      setPage(response.data.pagination.page)
      await refreshSummary()
    } catch {
      setErrorMessage('Impossible de charger les notifications.')
    } finally {
      setIsLoading(false)
    }
  }, [filter, page, refreshSummary])

  React.useEffect(() => {
    void loadNotifications(filter, page)
  }, [filter, loadNotifications, page])

  React.useEffect(() => {
    if (!latestNotification) return

    setNotifications((current) => {
      if (filter !== 'all' && filter !== 'unread' && filter !== latestNotification.category) {
        if (filter !== 'actions' || !latestNotification.requiresAction) return current
      }

      if (current.some((notification) => notification.id === latestNotification.id)) {
        return current.map((notification) => (
          notification.id === latestNotification.id ? latestNotification : notification
        ))
      }

      if (page !== 1) return current

      return [latestNotification, ...current].slice(0, PAGE_SIZE)
    })
  }, [filter, latestNotification, page])

  function handleFilterChange(nextFilter: NotificationCategory) {
    setFilter(nextFilter)
    setPage(1)
  }

  async function handleOpen(notification: AppNotification) {
    if (!notification.isRead) {
      const response = await notificationsManager.markRead(notification.id)
      if (response.ok) {
        setNotifications((current) => current.map((item) => (
          item.id === notification.id ? response.data.notification : item
        )))
        await refreshSummary()
      }
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
  }

  async function handleMarkAllRead() {
    await markAllRead()
    setNotifications((current) => current.map((notification) => ({
      ...notification,
      isRead: true,
      readAt: notification.readAt ?? new Date().toISOString(),
    })))
  }

  return (
    <div className="auth-bg min-h-screen w-full px-4 pb-14 pt-36 md:px-8 md:pt-40">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8 flex flex-col gap-5 border-b border-white/10 pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-cyan">Centre d’attention</p>
            <h1 className="mt-2 text-4xl font-bold text-white">NOTIFICATIONS</h1>
            <p className="mt-2 max-w-2xl text-white/60">
              Retrouvez les messages, décisions, offres et actions qui demandent votre attention.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={handleMarkAllRead}
            icon={<CheckCheck className="h-4 w-4" />}
            disabled={unreadCount === 0}
          >
            Tout marquer comme lu
          </Button>
        </header>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <SummaryCard label="Non lues" value={unreadCount} tone="cyan" icon={<Bell className="h-5 w-5" />} />
          <SummaryCard label="Actions à traiter" value={actionTotal} tone="purple" icon={<Clock3 className="h-5 w-5" />} />
          <SummaryCard label="Système propre" value={unreadCount + actionTotal === 0 ? 'OK' : 'À jour'} tone="neutral" icon={<ShieldCheck className="h-5 w-5" />} />
        </div>

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
                onClick={() => handleFilterChange(item.id)}
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

        {errorMessage && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
            {errorMessage}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-white/15 bg-[#071722]/85 shadow-2xl backdrop-blur">
          {isLoading ? (
            <LoadingState />
          ) : notifications.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            <ul className="divide-y divide-white/10">
              {notifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onOpen={() => handleOpen(notification)}
                />
              ))}
            </ul>
          )}
        </section>

        {!isLoading && notifications.length > 0 && (
          <PaginationControls
            pagination={pagination}
            onPrevious={() => setPage((current) => Math.max(1, current - 1))}
            onNext={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
          />
        )}
      </div>
    </div>
  )
}

function PaginationControls({
  pagination,
  onPrevious,
  onNext,
}: {
  pagination: NotificationsPagination
  onPrevious: () => void
  onNext: () => void
}) {
  const start = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1
  const end = Math.min(pagination.total, pagination.page * pagination.limit)

  return (
    <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#071722]/75 px-4 py-4 text-sm text-white/60 shadow-xl backdrop-blur md:flex-row md:items-center md:justify-between">
      <span>
        {start}-{end} sur {pagination.total} notification{pagination.total > 1 ? 's' : ''}
      </span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onPrevious}
          disabled={!pagination.hasPreviousPage}
          className="px-4 py-2"
        >
          Précédent
        </Button>
        <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-semibold text-white/70">
          Page {pagination.page} / {pagination.totalPages}
        </span>
        <Button
          type="button"
          variant="secondary"
          onClick={onNext}
          disabled={!pagination.hasNextPage}
          className="px-4 py-2"
        >
          Suivant
        </Button>
      </div>
    </div>
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

function NotificationRow({
  notification,
  onOpen,
}: {
  notification: AppNotification
  onOpen: () => void
}) {
  const severityClass = {
    info: 'text-brand-cyan border-brand-cyan/30 bg-brand-cyan/10',
    success: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10',
    warning: 'text-amber-200 border-amber-400/30 bg-amber-400/10',
    danger: 'text-red-300 border-red-400/30 bg-red-400/10',
  }[notification.severity]

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-start gap-4 px-5 py-5 text-left transition-colors hover:bg-white/5 md:px-6"
      >
        <Circle className={`mt-1 h-3 w-3 shrink-0 ${notification.isRead ? 'fill-white/20 text-white/20' : 'fill-brand-cyan text-brand-cyan'}`} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${severityClass}`}>
              {categoryLabel(notification.category)}
            </span>
            {notification.requiresAction && !notification.resolvedAt && (
              <span className="rounded-full border border-brand-purple/30 bg-brand-purple/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-purple">
                À traiter
              </span>
            )}
            <span className="text-xs text-white/40">{formatNotificationDate(notification.createdAt)}</span>
          </div>
          <p className="mt-2 text-lg font-bold text-white">{notification.title}</p>
          {notification.body && (
            <p className="mt-1 text-sm leading-6 text-white/60">{notification.body}</p>
          )}
          {notification.actor?.name && (
            <p className="mt-2 text-xs text-white/35">Source : {notification.actor.name}</p>
          )}
        </div>
        {notification.actionUrl && <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-white/35" />}
      </button>
    </li>
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

function EmptyState({ filter }: { filter: NotificationCategory }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-16 text-center">
      <Bell className="mb-4 h-12 w-12 text-brand-cyan/70" />
      <p className="text-xl font-bold text-white">Rien à signaler</p>
      <p className="mt-2 max-w-md text-white/55">
        {filter === 'actions'
          ? 'Aucune action ne demande votre attention. Le tableau est clean.'
          : 'Les prochaines offres, messages et décisions importantes apparaîtront ici.'}
      </p>
    </div>
  )
}

function categoryLabel(category: string): string {
  return {
    messages: 'Messages',
    negotiations: 'Négociations',
    players: 'Joueurs',
    admin: 'Admin',
    account: 'Compte',
    market: 'Marché',
    system: 'Système',
  }[category] ?? category
}

export default NotificationsHub
