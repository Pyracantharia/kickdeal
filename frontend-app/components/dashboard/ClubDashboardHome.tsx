'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { ArrowRightLeft, Mail, FileClock, Dot, Goal } from 'lucide-react'
import { useRouter } from 'next/navigation'

import Button from '@/components/ui/Button'
import CircleImage from '@/components/media/CircleImage'
import {
  MOCK_GLOBAL_TRANSFER_NEWS,
  getDaysUntilNextTransferWindow,
} from '@/features/dashboard/mockClubDashboard'
import { dashboardManager, type DashboardActiveDeal } from '@/features/dashboard/dashboard'

function formatCurrentDate(date: Date): string {
  const rawLabel = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1)
}

function formatEventDate(dateValue: string | null): string {
  if (!dateValue) {
    return 'Date indisponible'
  }

  const date = new Date(dateValue)

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ClubDashboardHome() {
  const router = useRouter()
  const [activeNewsIndex, setActiveNewsIndex] = useState(0)
  const [activeDeal, setActiveDeal] = useState<DashboardActiveDeal | null>(null)
  const [pendingOffersCount, setPendingOffersCount] = useState(0)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const [pendingRenewalsCount, setPendingRenewalsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const today = useMemo(() => new Date(), [])
  const dateLabel = useMemo(() => formatCurrentDate(today), [today])
  const daysUntilNextWindow = useMemo(() => getDaysUntilNextTransferWindow(today), [today])
  const activeNews = MOCK_GLOBAL_TRANSFER_NEWS[activeNewsIndex]
  const activeDealDateLabel = useMemo(
    () => formatEventDate(activeDeal?.eventDate ?? null),
    [activeDeal?.eventDate],
  )

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      try {
        const response = await dashboardManager.getHome()

        if (!isMounted) {
          return
        }

        if (!response.ok) {
          setErrorMessage('Impossible de charger le tableau de bord pour le moment.')
          return
        }

        setActiveDeal(response.data.activeDeal)
        setPendingOffersCount(response.data.pendingOffersCount ?? 0)
        setUnreadMessagesCount(response.data.unreadMessagesCount ?? 0)
        setPendingRenewalsCount(response.data.pendingRenewalsCount ?? 0)
        setErrorMessage(null)
      } catch (error) {
        if (!isMounted) {
          return
        }

        console.error('Erreur lors du chargement du dashboard:', error)
        setErrorMessage('Impossible de charger le tableau de bord pour le moment.')
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

  return (
    <div className="auth-bg min-h-screen w-full pt-28 pb-10 px-4">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-10">

          <section className="relative overflow-hidden rounded-2xl border border-brand-cyan/25 bg-[#071722]/80 p-5 shadow-2xl shadow-brand-cyan/10 md:p-7">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-cyan" />

            <div>
              <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-wide text-white">
                {dateLabel}
              </h1>
              <p className="mt-2 text-white/80 text-lg">
                La prochaine fenêtre de mercato ouvre dans {daysUntilNextWindow} jour{daysUntilNextWindow > 1 ? 's' : ''}
              </p>
            </div>

            <hr className="my-6 border-brand-cyan/25" />

            {activeDeal ? (
              <>
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-cyan/35 bg-brand-cyan/10 px-3 py-1.5 text-white/90">
                  <Goal className="h-4 w-4 text-brand-cyan" />
                  <span className="font-semibold">{activeDeal.eventLabel}</span>
                  <span className="text-white/80">{activeDealDateLabel}</span>
                </div>

                <div className="relative mt-4 overflow-hidden rounded-xl border border-brand-cyan/45 bg-gradient-to-br from-brand-cyan/16 via-[#0b1d2b]/92 to-brand-purple/18 p-4 shadow-[0_0_36px_rgba(0,245,212,0.14)] md:p-5">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-cyan to-transparent" />
                  <div className="flex items-center justify-between gap-3">
                    <ClubBadge name={activeDeal.homeClub ?? 'Club inconnu'} logoUrl={activeDeal.homeClubLogoUrl} />
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-purple/50 bg-brand-purple/20">
                      <ArrowRightLeft className="h-5 w-5 text-white" />
                    </div>
                    <ClubBadge name={activeDeal.awayClub ?? 'Club inconnu'} logoUrl={activeDeal.awayClubLogoUrl} />
                  </div>

                  <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-2xl font-semibold text-white">
                        Joueur : <span className="font-bold">{activeDeal.playerName || 'Inconnu'}</span>
                      </p>
                      <p className="text-2xl font-semibold text-white mt-1">
                        Statut : <span className="font-bold">{activeDeal.status.label}</span>
                      </p>
                    </div>

                    <Button
                      variant="secondary"
                      className="border-brand-cyan/40 bg-brand-cyan/10 px-5 py-2 text-base text-white hover:bg-brand-cyan/20 md:self-start"
                      onClick={() => router.push('/market/transfers')}
                    >
                      Voir le deal
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-brand-purple/30 bg-brand-purple/10 px-4 py-6 text-center">
                <p className="text-xl font-semibold text-white">
                  {isLoading ? 'Chargement du deal en cours...' : 'Aucun deal en cours pour le moment.'}
                </p>
                <p className="mt-2 text-white/75">
                  {errorMessage ?? 'Les prochaines discussions apparaîtront ici dès qu’une négociation impliquera votre club.'}
                </p>
              </div>
            )}

            <div className="mt-4 space-y-3">
              <InfoRow
                icon={<ArrowRightLeft className="h-5 w-5" />}
                label={`${pendingOffersCount} offre(s)`}
                onClick={() => router.push('/market/transfers')}
              />
              <InfoRow
                icon={<Mail className="h-5 w-5" />}
                label={`${unreadMessagesCount} message(s) non lu(s)`}
                onClick={() => router.push('/notifications')}
              />
              <InfoRow
                icon={<FileClock className="h-5 w-5" />}
                label={`${pendingRenewalsCount} négociation(s) contractuelle(s) en cours`}
                onClick={() => router.push('/negociations')}
              />
            </div>
          </section>

          <section className="relative overflow-hidden rounded-2xl border border-brand-purple/30 bg-[#071722]/82 p-5 shadow-2xl shadow-brand-purple/10 md:p-7">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-purple via-brand-cyan to-brand-purple" />

            <div className="text-center">
              <h2 className="text-4xl md:text-[42px] leading-none font-bold text-white">Marché des transferts</h2>
              <div className="mx-auto mt-3 h-[3px] w-32 rounded-full bg-gradient-to-r from-brand-purple via-brand-cyan to-brand-purple" />
              <p className="mt-2 text-white/80 text-lg">
                Recherchez, achetez ou vendez des joueurs pour renforcer votre effectif.
              </p>

              <Button
                variant="secondary"
                className="mt-5 border-brand-purple/50 bg-brand-purple/15 px-6 py-2.5 text-base text-white hover:bg-brand-purple/25"
                onClick={() => router.push('/market')}
              >
                Aller au marché
              </Button>
            </div>

            <hr className="my-7 border-brand-purple/25" />

            <article className="overflow-hidden rounded-2xl border-2 border-brand-cyan/60 bg-[#07111f]/90 shadow-[0_0_44px_rgba(0,245,212,0.18)]">
              <div className="flex items-center justify-between border-b border-brand-cyan/20 bg-gradient-to-r from-brand-purple/18 to-brand-cyan/12 px-4 py-3">
                <span className="text-brand-cyan text-4xl md:text-[40px] font-black tracking-tight italic leading-none">
                  {activeNews.source}
                </span>
                <span className="rounded-full border border-brand-purple/40 bg-brand-purple/15 px-3 py-1 text-base font-semibold text-white/90">
                  {activeNews.publishedAtLabel}
                </span>
              </div>

              <div className="relative h-64 md:h-72 bg-[radial-gradient(circle_at_20%_10%,rgba(163,94,255,0.35),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(0,245,212,0.28),transparent_34%),linear-gradient(180deg,#15243a_0%,#09111e_100%)]">
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_25%,rgba(0,0,0,0.72)_100%)]" />
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
                  <Dot className={`h-7 w-7 ${index === activeNewsIndex ? 'text-brand-cyan' : 'text-white/30'}`} />
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function ClubBadge({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  const firstLetter = name.charAt(0).toUpperCase()

  return (
    <div className="flex items-center gap-3 md:gap-4 min-w-0">
      {logoUrl ? (
        <CircleImage
          src={logoUrl}
          alt={name}
          className="relative h-14 w-14 md:h-16 md:w-16 shrink-0 overflow-hidden rounded-full border-2 border-white/40 bg-white/10"
          sizes="64px"
          imageClassName="object-contain p-2"
          fallback={
            <div className="h-full w-full flex items-center justify-center text-white text-2xl font-bold">
              {firstLetter}
            </div>
          }
        />
      ) : (
        <div className="h-14 w-14 md:h-16 md:w-16 shrink-0 rounded-full border-2 border-white/40 bg-white/10 flex items-center justify-center text-white text-2xl font-bold">
          {firstLetter}
        </div>
      )}
      <span className="text-white text-2xl font-bold uppercase tracking-wide truncate">{name}</span>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 flex items-center gap-3 transition hover:border-brand-cyan/45 hover:bg-brand-cyan/10"
    >
      <span className="text-brand-cyan shrink-0" aria-hidden="true">{icon}</span>
      <span className="text-left text-xl font-semibold text-white">{label}</span>
    </button>
  )
}

export default ClubDashboardHome
