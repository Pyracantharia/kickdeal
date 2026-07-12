'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock3,
  ShieldAlert,
  Store,
  UserPlus,
  UserRoundX,
  UsersRound,
  Workflow,
  Rss,
  CreditCard,
  History,
  Database,
  Bell,
  LifeBuoy,
} from 'lucide-react'
import { adminManager, type AdminDashboardData } from '@/features/admin/admin'
import { useAdminNotificationsSummary } from '@/features/admin/adminNotifications'

const quickActions = [
  { title: 'Gestion utilisateurs', meta: 'Comptes', href: '/admin/users', icon: UsersRound, accent: 'border-brand-cyan/25 text-brand-cyan', iconBox: 'border-brand-cyan/30 bg-brand-cyan/10', links: [] },
  { title: 'Gestion des clubs', meta: 'Clubs', href: '/admin/clubs', icon: Building2, alertId: 'club_requests', accent: 'border-emerald-400/25 text-emerald-300', iconBox: 'border-emerald-400/30 bg-emerald-400/10', links: [{ label: 'Demandes de création', href: '/admin/club-requests' }] },
  { title: 'Gestion des agents', meta: 'Agents & joueurs', href: '/admin/agents', icon: ClipboardList, alertId: 'player_agent_requests', accent: 'border-brand-purple/25 text-brand-purple', iconBox: 'border-brand-purple/30 bg-brand-purple/10', links: [{ label: 'Demandes et passations', href: '/admin/player-agent-requests' }] },
  { title: 'Gestion du marché', meta: 'Marché & transferts', href: '/admin/market', icon: Store, accent: 'border-amber-400/25 text-amber-300', iconBox: 'border-amber-400/30 bg-amber-400/10', links: [] },
  { title: 'Gestion des négociations', meta: 'Contrats & accords', href: '/admin/negotiations', icon: Workflow, accent: 'border-blue-400/25 text-blue-300', iconBox: 'border-blue-400/30 bg-blue-400/10', links: [] },
  { title: 'Gestion du feed public', meta: 'Application mobile', href: '/admin/public-feed', icon: Rss, accent: 'border-pink-400/25 text-pink-300', iconBox: 'border-pink-400/30 bg-pink-400/10', links: [] },
  { title: 'Gestion des abonnements', meta: 'Plans & paiements', href: '/admin/subscriptions', icon: CreditCard, accent: 'border-teal-400/25 text-teal-300', iconBox: 'border-teal-400/30 bg-teal-400/10', links: [] },
  { title: 'Audit & historique', meta: 'Traçabilité admin', href: '/admin/audit', icon: History, accent: 'border-slate-400/25 text-slate-300', iconBox: 'border-slate-400/30 bg-slate-400/10', links: [] },
  { title: 'Données de référence', meta: 'Paramètres métier', href: '/admin/reference-data', icon: Database, accent: 'border-indigo-400/25 text-indigo-300', iconBox: 'border-indigo-400/30 bg-indigo-400/10', links: [{ label: 'Gestion des clubs', href: '/admin/clubs' }] },
  { title: 'Notifications admin', meta: 'À traiter', href: '/admin/notifications', icon: Bell, alertId: 'all', accent: 'border-brand-cyan/25 text-brand-cyan', iconBox: 'border-brand-cyan/30 bg-brand-cyan/10', links: [] },
  { title: 'Assistance utilisateur', meta: 'Centre d’aide', href: '/admin/support', icon: LifeBuoy, accent: 'border-cyan-300/25 text-cyan-200', iconBox: 'border-cyan-300/30 bg-cyan-300/10', links: [] },
  { title: 'Signalements', meta: 'Modération', href: '/admin/message-reports', icon: ShieldAlert, alertId: 'message_reports', accent: 'border-red-500/25 text-red-300', iconBox: 'border-red-500/30 bg-red-500/10', links: [] },
]

const EMPTY_DATA: AdminDashboardData = {
  stats: { totalUsers: 0, newUsersLast30Days: 0, pendingValidations: 0, currentlyBannedUsers: 0 },
  alerts: [],
  generatedAt: '',
}

export default function AdminDashboardHome() {
  const [dashboard, setDashboard] = useState<AdminDashboardData>(EMPTY_DATA)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const adminNotifications = useAdminNotificationsSummary()

  useEffect(() => {
    let active = true
    async function loadDashboard() {
      try {
        const response = await adminManager.getDashboard()
        if (!active) return
        if (!response.ok) {
          setError('Impossible de charger les données du tableau de bord.')
          return
        }
        setDashboard(response.data)
      } catch {
        if (active) setError('Impossible de charger les données du tableau de bord.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadDashboard()
    return () => { active = false }
  }, [])

  const stats = [
    { label: 'Utilisateurs', value: dashboard.stats.totalUsers, detail: 'comptes au total', icon: UsersRound, tone: 'text-brand-cyan bg-brand-cyan/10 border-brand-cyan/25' },
    { label: 'Nouveaux comptes', value: dashboard.stats.newUsersLast30Days, detail: 'sur les 30 derniers jours', icon: UserPlus, tone: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/25' },
    { label: 'Validations', value: dashboard.stats.pendingValidations, detail: 'demandes en attente', icon: Clock3, tone: 'text-amber-300 bg-amber-400/10 border-amber-400/25' },
    { label: 'Comptes bannis', value: dashboard.stats.currentlyBannedUsers, detail: 'suspensions en cours', icon: UserRoundX, tone: 'text-red-300 bg-red-400/10 border-red-400/25' },
  ]
  const alertCounts = adminNotifications.unreadCounts

  return (
    <div className="auth-bg min-h-screen w-full px-4 pb-10 pt-28">
      <main className="mx-auto w-full max-w-6xl">
        <div className="mb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-brand-cyan">Vue d’ensemble</p>
          <h1 className="text-3xl font-bold uppercase tracking-wide text-white md:text-4xl">Administration</h1>
          <div className="mt-3 h-1 w-32 rounded-full bg-linear-to-r from-brand-cyan to-brand-purple" />
        </div>

        {error && <div role="alert" className="mb-6 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}

        <section aria-labelledby="stats-title" className="mb-6">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 id="stats-title" className="text-xl font-bold text-white">Indicateurs clés</h2>
              <p className="mt-1 text-sm text-gray-400">Données actualisées depuis la plateforme</p>
            </div>
            {dashboard.generatedAt && <time className="hidden text-xs text-gray-500 sm:block" dateTime={dashboard.generatedAt}>Mis à jour à {formatTime(dashboard.generatedAt)}</time>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(({ label, value, detail, icon: Icon, tone }) => (
              <article key={label} className="rounded-2xl border border-white/10 bg-[#071722]/85 p-5 shadow-xl shadow-black/15">
                <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl border ${tone}`}><Icon className="h-5 w-5" /></div>
                <p className="text-sm font-medium text-gray-400">{label}</p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-white">{loading ? <span className="inline-block h-9 w-14 animate-pulse rounded bg-white/10" /> : value.toLocaleString('fr-FR')}</p>
                <p className="mt-2 text-xs text-gray-500">{detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="alerts-title" className="mb-6 rounded-2xl border border-white/10 bg-[#071722]/85 p-5 shadow-2xl shadow-black/20 md:p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/10 text-amber-300"><AlertTriangle className="h-5 w-5" /></div>
            <div><h2 id="alerts-title" className="text-xl font-bold text-white">À traiter</h2><p className="text-sm text-gray-400">Files d’attente nécessitant une action</p></div>
          </div>
          {loading ? (
            <div className="h-20 animate-pulse rounded-xl bg-white/5" />
          ) : dashboard.alerts.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/8 px-4 py-4 text-emerald-200"><CheckCircle2 className="h-5 w-5 shrink-0" /><p className="text-sm font-medium">Aucune demande ni aucun signalement en attente.</p></div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-3">
              {dashboard.alerts.map((alert) => (
                <Link key={alert.id} href={alert.href} className={`group rounded-xl border p-4 transition hover:-translate-y-0.5 ${alertStyle(alert.severity)}`}>
                  <div className="flex items-start justify-between gap-3"><p className="font-semibold text-white">{alert.title}</p><span className="rounded-full bg-black/20 px-2.5 py-1 text-sm font-bold tabular-nums">{alert.count}</span></div>
                  <p className="mt-3 text-xs opacity-80">Plus ancienne : {formatAge(alert.ageInDays, alert.oldestCreatedAt)}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">Examiner <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="actions-title" className="rounded-2xl border border-white/10 bg-[#071722]/85 p-5 shadow-2xl shadow-black/20 md:p-7">
          <h2 id="actions-title" className="mb-5 text-xl font-bold text-white">Actions rapides</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => { const Icon = action.icon; const count = action.alertId ? alertCounts[action.alertId] ?? 0 : 0; return (
              <article key={action.href} className={`group relative rounded-xl border bg-[#0A1B2B]/70 p-5 shadow-xl transition-all hover:-translate-y-0.5 hover:bg-[#0D2134] ${action.accent}`}>
                {count > 0 && <NotificationBadge count={count} />}
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-lg border ${action.iconBox}`}><Icon className="h-6 w-6" /></div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-500">{action.meta}</p><h3 className="text-lg font-bold text-white">{action.title}</h3>
                <Link href={action.href} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-white group-hover:text-brand-cyan">Ouvrir <ArrowRight className="h-4 w-4" /></Link>
                {action.links.map((link) => <Link key={link.href} href={link.href} className="mt-3 block border-t border-white/10 pt-3 text-xs font-semibold text-gray-400 hover:text-white">{link.label}</Link>)}
              </article>
            ) })}
          </div>
        </section>
      </main>
    </div>
  )
}

function NotificationBadge({ count }: { count: number }) {
  return (
    <span className="absolute right-4 top-4 flex min-h-6 min-w-6 items-center justify-center rounded-full bg-sky-400 px-2 text-xs font-black tabular-nums text-[#07111d] ring-2 ring-[#071722]">
      {count > 99 ? '99+' : count}
    </span>
  )
}

function alertStyle(severity: 'info' | 'warning' | 'critical') {
  if (severity === 'critical') return 'border-red-400/35 bg-red-400/10 text-red-200'
  if (severity === 'warning') return 'border-amber-400/35 bg-amber-400/10 text-amber-200'
  return 'border-brand-cyan/25 bg-brand-cyan/8 text-brand-cyan'
}

function formatAge(days: number, date?: string | null) {
  if (!date) return 'date indisponible'
  if (days === 0) return "aujourd’hui"
  if (days === 1) return 'hier'
  return `il y a ${days} jours`
}

function formatTime(date: string) {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' }).format(new Date(date))
}
