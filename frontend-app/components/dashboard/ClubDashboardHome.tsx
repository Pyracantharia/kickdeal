'use client'

import React, { useMemo, useState } from 'react'
import { ArrowRightLeft, Mail, FileClock, Dot, Goal } from 'lucide-react'

import Button from '@/components/ui/Button'
import {
  MOCK_ACTIVE_DEAL,
  MOCK_GLOBAL_TRANSFER_NEWS,
  getDaysUntilNextTransferWindow,
} from '@/features/dashboard/mockClubDashboard'

function formatCurrentDate(date: Date): string {
  const rawLabel = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1)
}

function ClubDashboardHome() {
  const [activeNewsIndex, setActiveNewsIndex] = useState(0)

  const today = useMemo(() => new Date(), [])
  const dateLabel = useMemo(() => formatCurrentDate(today), [today])
  const daysUntilNextWindow = useMemo(() => getDaysUntilNextTransferWindow(today), [today])

  const activeDeal = MOCK_ACTIVE_DEAL
  const activeNews = MOCK_GLOBAL_TRANSFER_NEWS[activeNewsIndex]

  return (
    <div className="auth-bg min-h-screen w-full pt-28 pb-10 px-4">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-10">

          <section className="rounded-2xl border border-white/10 backdrop-blur-[1px] p-5 md:p-7 shadow-2xl">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-wide text-white">
                {dateLabel}
              </h1>
              <p className="mt-2 text-white/80 text-lg">
                La prochaine fenêtre de mercato ouvre dans {daysUntilNextWindow} jour{daysUntilNextWindow > 1 ? 's' : ''}
              </p>
            </div>

            <hr className="my-6 border-white/20" />

            <div className="flex items-center gap-2 text-white/90">
              <Goal className="h-4 w-4" />
              <span className="font-semibold">{activeDeal.eventLabel}</span>
              <span className="text-white/80">{activeDeal.eventDateLabel}</span>
            </div>

            <div className="mt-4 rounded-xl border border-brand-cyan/30 p-4 md:p-5">
              <div className="flex items-center justify-between gap-3">
                <ClubBadge name={activeDeal.homeClub} />
                <ArrowRightLeft className="h-5 w-5 text-white/80 shrink-0" />
                <ClubBadge name={activeDeal.awayClub} />
              </div>

              <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-2xl font-semibold text-white">
                    Joueur : <span className="font-bold">{activeDeal.playerName}</span>
                  </p>
                  <p className="text-2xl font-semibold text-white mt-1">
                    Statut : <span className="font-bold">{activeDeal.status}</span>
                  </p>
                </div>

                <Button variant="secondary" className="md:self-start px-5 py-2 text-base">
                  Voir le deal
                </Button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <InfoRow icon={<ArrowRightLeft className="h-5 w-5" />} label={`${activeDeal.pendingOffersCount} offre(s)`} />
              <InfoRow icon={<Mail className="h-5 w-5" />} label={`${activeDeal.unreadMessagesCount} message(s) non lu(s)`} />
              <InfoRow icon={<FileClock className="h-5 w-5" />} label={`${activeDeal.pendingRenewalsCount} renouvellement(s) de contrat en attente`} />
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 backdrop-blur-[1px] p-5 md:p-7 shadow-2xl">
            <div className="text-center">
              <h2 className="text-4xl md:text-[42px] leading-none font-bold text-white">Marché des transferts</h2>
              <div className="mx-auto mt-3 h-[2px] w-28 bg-white/70" />
              <p className="mt-2 text-white/80 text-lg">
                Recherchez, achetez ou vendez des joueurs pour renforcer votre effectif.
              </p>

              <Button
                variant="secondary"
                className="mt-5 px-6 py-2.5 text-base"
              >
                Aller au marché
              </Button>
            </div>

            <hr className="my-7 border-white/20" />

            <article className="rounded-2xl border-2 border-brand-cyan/50 overflow-hidden shadow-[0_0_40px_rgba(0,245,212,0.15)]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <span className="text-red-500 text-4xl md:text-[40px] font-black tracking-tight italic leading-none">
                  {activeNews.source}
                </span>
                <span className="text-lg text-white/85">{activeNews.publishedAtLabel}</span>
              </div>

              <div className="relative h-64 md:h-72 bg-[radial-gradient(circle_at_70%_10%,rgba(255,255,255,0.25),transparent_35%),linear-gradient(180deg,#1a2434_0%,#0e1523_100%)]">
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(0,0,0,0.75)_100%)]" />
                <div className="absolute inset-x-5 bottom-4 text-center">
                  <h3 className="text-white text-2xl md:text-[30px] font-bold leading-tight">
                    {activeNews.headline}
                  </h3>
                  <p className="mt-2 text-white/90 text-lg leading-snug">{activeNews.summary}</p>
                </div>
              </div>
            </article>

            <div className="mt-4 flex items-center justify-center gap-2">
              {MOCK_GLOBAL_TRANSFER_NEWS.map((news, index) => (
                <button
                  key={news.id}
                  type="button"
                  onClick={() => setActiveNewsIndex(index)}
                  className="p-1"
                  aria-label={`Ouvrir l'actualité transfert ${index + 1}`}
                >
                  <Dot className={`h-7 w-7 ${index === activeNewsIndex ? 'text-white' : 'text-white/30'}`} />
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function ClubBadge({ name }: { name: string }) {
  const firstLetter = name.charAt(0).toUpperCase()

  return (
    <div className="flex items-center gap-3 md:gap-4 min-w-0">
      <div className="h-14 w-14 md:h-16 md:w-16 shrink-0 rounded-full border-2 border-white/40 bg-white/10 flex items-center justify-center text-white text-2xl font-bold">
        {firstLetter}
      </div>
      <span className="text-white text-2xl font-bold uppercase tracking-wide truncate">{name}</span>
    </div>
  )
}

function InfoRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="rounded-xl border border-white/20 px-4 py-3 flex items-center gap-3">
      <span className="text-white/90 shrink-0" aria-hidden="true">{icon}</span>
      <span className="text-xl font-semibold text-white">{label}</span>
    </div>
  )
}

export default ClubDashboardHome