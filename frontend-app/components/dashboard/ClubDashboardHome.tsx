'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { ArrowRightLeft, Mail, FileClock, Dot, Goal } from 'lucide-react'
import { useRouter } from 'next/navigation'

import Button from '@/components/ui/Button'
import CircleImage from '@/components/media/CircleImage'
import { useMessagesUnread } from '@/context/MessagesUnreadProvider'
import { useNotifications } from '@/context/NotificationsProvider'
import { getTransferWindowStatus } from '@/features/dashboard/mockClubDashboard'
import { dashboardManager, type DashboardActiveDeal } from '@/features/dashboard/dashboard'
import { publicFeedManager, type PublicFeedPost } from '@/features/public-feed/publicFeed'

interface ClubDashboardHomeProps {
  initialDashboard?: {
    activeDeal: DashboardActiveDeal | null
    pendingOffersCount: number
    unreadMessagesCount: number
    pendingRenewalsCount: number
    transferWindowStatus?: {
      isOpen: boolean
      name: string
      label: string
      daysRemaining?: number
      daysUntilOpen?: number
      startDate: string
      endDate: string
    }
  } | null
  initialMarketNews?: PublicFeedPost[] | null
  initialNow?: string
}

function formatCurrentDate(date: Date): string {
  const rawLabel = date.toLocaleDateString('fr-FR', {
    timeZone: 'Europe/Paris',
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

function formatNewsDate(dateValue: string): string {
  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return 'Publié récemment'
  }

  const diffInSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))

  if (diffInSeconds < 60) {
    return "À l'instant"
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `il y a ${diffInMinutes} min`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `il y a ${diffInHours} h`
  }

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  })
}

function getNewsHeadline(post: PublicFeedPost): string {
  const rawHeadline = post.headline ?? post.title ?? 'Officialisation KickDeal'

  return rawHeadline.toUpperCase().startsWith('OFFICIEL')
    ? rawHeadline
    : `OFFICIEL : ${rawHeadline}`
}

function getNewsSummary(post: PublicFeedPost): string {
  return post.body ?? post.subtitle ?? 'Une nouvelle officialisation vient d’être publiée sur KickDeal.'
}

function getNewsAmountLabel(post: PublicFeedPost): string | null {
  if (post.amountLabel) {
    return post.amountLabel
  }

  if (typeof post.amount === 'number' && Number.isFinite(post.amount)) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: post.currency ?? 'EUR',
      maximumFractionDigits: post.amount >= 1_000_000 ? 1 : 0,
    }).format(post.amount)
  }

  return null
}

function ClubDashboardHome({ initialDashboard, initialMarketNews, initialNow }: ClubDashboardHomeProps) {
  const router = useRouter()
  const { unreadConversationIds } = useMessagesUnread()
  const { getActionCount, getUnreadCount } = useNotifications()
  const [activeNewsIndex, setActiveNewsIndex] = useState(0)
  const hasInitialDashboard = initialDashboard !== undefined
  const hasInitialMarketNews = Array.isArray(initialMarketNews)
  const [activeDeal, setActiveDeal] = useState<DashboardActiveDeal | null>(initialDashboard?.activeDeal ?? null)
  const [pendingOffersCount, setPendingOffersCount] = useState(initialDashboard?.pendingOffersCount ?? 0)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(initialDashboard?.unreadMessagesCount ?? 0)
  const [pendingRenewalsCount, setPendingRenewalsCount] = useState(initialDashboard?.pendingRenewalsCount ?? 0)
  const [marketNews, setMarketNews] = useState<PublicFeedPost[]>(hasInitialMarketNews ? initialMarketNews : [])
  const [isMarketNewsLoading, setIsMarketNewsLoading] = useState(!hasInitialMarketNews)
  const [isLoading, setIsLoading] = useState(!hasInitialDashboard)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [marketNewsError, setMarketNewsError] = useState<string | null>(null)

  const today = useMemo(() => {
    const parsedDate = initialNow ? new Date(initialNow) : new Date()

    return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate
  }, [initialNow])
  const dateLabel = useMemo(() => formatCurrentDate(today), [today])
  const fallbackTransferWindowStatus = useMemo(() => getTransferWindowStatus(today), [today])
  const [transferWindowStatus, setTransferWindowStatus] = useState(
    initialDashboard?.transferWindowStatus ?? fallbackTransferWindowStatus,
  )
  const activeNews = marketNews[activeNewsIndex] ?? null
  const activeNewsAmountLabel = activeNews ? getNewsAmountLabel(activeNews) : null
  const activeDealDateLabel = useMemo(
    () => formatEventDate(activeDeal?.eventDate ?? null),
    [activeDeal?.eventDate],
  )
  const displayedUnreadMessagesCount = Math.max(
    unreadMessagesCount,
    unreadConversationIds.size,
    getUnreadCount('/messages'),
  )
  const displayedPendingOffersCount = Math.max(
    pendingOffersCount,
    getActionCount('/market'),
    getUnreadCount('/market'),
  )

  useEffect(() => {
    if (hasInitialDashboard) {
      setIsLoading(false)
      return
    }

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
        setTransferWindowStatus(response.data.transferWindowStatus ?? fallbackTransferWindowStatus)
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
  }, [fallbackTransferWindowStatus, hasInitialDashboard])

  useEffect(() => {
    if (hasInitialMarketNews) {
      setIsMarketNewsLoading(false)
      return
    }

    let isMounted = true

    async function loadMarketNews() {
      try {
        const posts = await publicFeedManager.getImportantPosts(3)

        if (!isMounted) {
          return
        }

        setMarketNews(posts)
        setActiveNewsIndex(0)
        setMarketNewsError(null)
      } catch (error) {
        if (!isMounted) {
          return
        }

        console.error('Erreur lors du chargement du feed mercato:', error)
        setMarketNewsError('Impossible de charger les dernières infos mercato.')
      } finally {
        if (isMounted) {
          setIsMarketNewsLoading(false)
        }
      }
    }

    loadMarketNews()

    return () => {
      isMounted = false
    }
  }, [hasInitialMarketNews])

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
                {transferWindowStatus.label}
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
                label={`${displayedPendingOffersCount} offre(s)`}
                onClick={() => router.push('/market/transfers')}
              />
              <InfoRow
                icon={<Mail className="h-5 w-5" />}
                label={`${displayedUnreadMessagesCount} message(s) non lu(s)`}
                onClick={() => router.push('/messages')}
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
                  MERCATO GLOBAL
                </span>
                <span className="rounded-full border border-brand-purple/40 bg-brand-purple/15 px-3 py-1 text-base font-semibold text-white/90">
                  {activeNews ? formatNewsDate(activeNews.publishedAt) : isMarketNewsLoading ? 'Chargement' : 'À jour'}
                </span>
              </div>

              <div className="relative h-64 md:h-72 bg-[radial-gradient(circle_at_20%_10%,rgba(163,94,255,0.35),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(0,245,212,0.28),transparent_34%),linear-gradient(180deg,#15243a_0%,#09111e_100%)]">
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_25%,rgba(0,0,0,0.72)_100%)]" />
                <div className="absolute inset-x-5 bottom-5 text-center md:bottom-6">
                  {activeNews ? (
                    <>
                      <NewsClubLogos post={activeNews} />
                      {activeNewsAmountLabel && (
                        <div className="mb-3 inline-flex items-center rounded-full border border-brand-cyan/35 bg-brand-cyan/10 px-4 py-1.5 text-sm font-black uppercase tracking-wide text-brand-cyan shadow-lg shadow-brand-cyan/10">
                          Montant : {activeNewsAmountLabel}
                        </div>
                      )}
                      <h3 className="mx-auto max-w-xl text-white text-2xl md:text-[30px] font-bold leading-tight">
                        {getNewsHeadline(activeNews)}
                      </h3>
                      <p className="mx-auto mt-2 max-w-xl text-white/90 text-lg leading-snug">
                        {getNewsSummary(activeNews)}
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="mx-auto max-w-xl text-white text-2xl md:text-[30px] font-bold leading-tight">
                        {isMarketNewsLoading ? 'Chargement des infos mercato...' : 'Aucune info mercato publiée'}
                      </h3>
                      <p className="mx-auto mt-2 max-w-xl text-white/90 text-lg leading-snug">
                        {marketNewsError ?? 'Les dernières officialisations KickDeal apparaîtront ici dès publication.'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </article>

            {marketNews.length > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                {marketNews.map((news, index) => (
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
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function NewsClubLogos({ post }: { post: PublicFeedPost }) {
  const sellerTeam = post.sellerTeam
  const buyerTeam = post.buyerTeam

  if (!sellerTeam?.name && !buyerTeam?.name) {
    return null
  }

  if (!sellerTeam?.name || !buyerTeam?.name || sellerTeam.id === buyerTeam.id) {
    const team = buyerTeam?.name ? buyerTeam : sellerTeam

    return (
      <div className="mb-4 flex justify-center">
        <NewsClubLogo name={team?.name ?? 'Club'} logoUrl={team?.logoUrl} />
      </div>
    )
  }

  return (
    <div className="mb-4 flex items-center justify-center gap-3">
      <NewsClubLogo name={sellerTeam.name} logoUrl={sellerTeam.logoUrl} />
      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-cyan/30 bg-black/25 text-brand-cyan shadow-lg shadow-black/30">
        <ArrowRightLeft className="h-4 w-4" />
      </div>
      <NewsClubLogo name={buyerTeam.name} logoUrl={buyerTeam.logoUrl} />
    </div>
  )
}

function NewsClubLogo({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  const firstLetter = name.charAt(0).toUpperCase()

  if (logoUrl) {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <CircleImage
          src={logoUrl}
          alt={name}
          className="relative h-14 w-14 overflow-hidden rounded-2xl border border-white/25 bg-white/10 shadow-xl shadow-black/30"
          sizes="56px"
          imageClassName="object-contain p-2"
          fallback={
            <div className="flex h-full w-full items-center justify-center text-lg font-black text-white">
              {firstLetter}
            </div>
          }
        />
        <span className="max-w-24 truncate text-xs font-semibold text-white/75">{name}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/25 bg-white/10 text-lg font-black text-white shadow-xl shadow-black/30">
        {firstLetter}
      </div>
      <span className="max-w-24 truncate text-xs font-semibold text-white/75">{name}</span>
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
