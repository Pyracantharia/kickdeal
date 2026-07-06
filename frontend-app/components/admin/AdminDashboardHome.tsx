import Link from 'next/link'
import React from 'react'
import { Building2, ClipboardList, ShieldAlert, UsersRound } from 'lucide-react'

const quickActions = [
  {
    title: 'Gestion utilisateurs',
    meta: 'Comptes',
    href: '/admin/users',
    icon: UsersRound,
    accent: 'border-brand-cyan/25 text-brand-cyan shadow-brand-cyan/10',
    iconBox: 'border-brand-cyan/30 bg-brand-cyan/10',
  },
  {
    title: 'Demandes de club',
    meta: 'Clubs',
    href: '/admin/club-requests',
    icon: Building2,
    accent: 'border-emerald-400/25 text-emerald-300 shadow-emerald-400/10',
    iconBox: 'border-emerald-400/30 bg-emerald-400/10',
  },
  {
    title: 'Demandes agents',
    meta: 'Joueurs',
    href: '/admin/player-agent-requests',
    icon: ClipboardList,
    accent: 'border-brand-purple/25 text-brand-purple shadow-brand-purple/10',
    iconBox: 'border-brand-purple/30 bg-brand-purple/10',
  },
  {
    title: 'Signalements',
    meta: 'Modération',
    href: '/admin/message-reports',
    icon: ShieldAlert,
    accent: 'border-red-500/25 text-red-300 shadow-red-500/10',
    iconBox: 'border-red-500/30 bg-red-500/10',
  },
]

function AdminDashboardHome() {
  return (
    <div className="auth-bg min-h-screen w-full px-4 pb-10 pt-28">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold uppercase tracking-wide text-white md:text-4xl">Administration</h1>
          <div className="mt-2 h-1 w-32 rounded-full bg-linear-to-r from-brand-cyan to-brand-purple"></div>
        </div>

        <section className="rounded-2xl border border-white/10 bg-[#071722]/85 p-5 shadow-2xl shadow-black/20 md:p-7">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Actions rapides</h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon

              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`group rounded-xl border bg-[#0A1B2B]/70 p-5 shadow-xl transition-all hover:-translate-y-0.5 hover:bg-[#0D2134] ${action.accent}`}
                >
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-lg border ${action.iconBox}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-500">{action.meta}</p>
                  <h3 className="text-lg font-bold text-white">{action.title}</h3>
                  <span className="mt-5 inline-flex text-sm font-semibold text-white transition-colors group-hover:text-brand-cyan">
                    Ouvrir
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

export default AdminDashboardHome
