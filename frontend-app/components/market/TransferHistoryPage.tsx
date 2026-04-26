'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Search } from 'lucide-react'

import CircleImage from '@/components/media/CircleImage'
import type { NegotiationTeam, OfferType, TransferHistoryItem, TransferHistoryStats } from '@/features/market/types/transfer'
import { transfersManager } from '@/features/market/transfers'

type PeriodFilter = 'today' | '7d' | '30d' | 'season'
type TypeFilter = 'all' | OfferType | 'free'

const PERIODS: Array<{ id: PeriodFilter; label: string }> = [
  { id: 'today', label: "Aujourd'hui" },
  { id: '7d', label: '7 derniers jours' },
  { id: '30d', label: '30 derniers jours' },
  { id: 'season', label: 'Saison complète' },
]

const TYPES: Array<{ id: TypeFilter; label: string }> = [
  { id: 'all', label: 'Tous' },
  { id: 'purchase', label: 'Transfert' },
  { id: 'loan', label: 'Prêt' },
  { id: 'exchange', label: 'Échange' },
  { id: 'free', label: 'Libre' },
]

const EMPTY_STATS: TransferHistoryStats = {
  totalTransfers: 0,
  totalAmount: '0 EUR',
  totalAmountValue: 0,
  freeTransfers: 0,
  paidTransfers: 0,
}

function TransferHistoryPage() {
  const [transfers, setTransfers] = useState<TransferHistoryItem[]>([])
  const [stats, setStats] = useState<TransferHistoryStats>(EMPTY_STATS)
  const [period, setPeriod] = useState<PeriodFilter>('7d')
  const [type, setType] = useState<TypeFilter>('all')
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadHistory() {
      try {
        const response = await transfersManager.getHistory()

        if (!isMounted) {
          return
        }

        if (!response.ok) {
          setErrorMessage("Impossible de charger l'historique des transferts.")
          return
        }

        setTransfers((response.data.transfers ?? []).filter((item) => item.player))
        setStats(response.data.stats ?? EMPTY_STATS)
        setErrorMessage(null)
      } catch {
        if (isMounted) {
          setErrorMessage("Impossible de charger l'historique des transferts.")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadHistory()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredTransfers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return transfers.filter((transfer) => {
      const date = new Date(transfer.date)
      const now = new Date()

      if (period === 'today' && !isSameDay(date, now)) {
        return false
      }

      if (period === '7d' && !isWithinDays(date, 7)) {
        return false
      }

      if (period === '30d' && !isWithinDays(date, 30)) {
        return false
      }

      if (type === 'free' && (transfer.amountValue ?? 0) > 0) {
        return false
      }

      if (type !== 'all' && type !== 'free' && transfer.type !== type) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      const haystack = [
        transfer.player.firstName,
        transfer.player.lastName,
        transfer.sellerTeam.name,
        transfer.buyerTeam.name,
      ].join(' ').toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [period, query, transfers, type])

  const visibleStats = useMemo(() => {
    const totalAmountValue = filteredTransfers.reduce((total, transfer) => total + (transfer.amountValue ?? 0), 0)
    const freeTransfers = filteredTransfers.filter((transfer) => (transfer.amountValue ?? 0) === 0).length

    return {
      totalTransfers: filteredTransfers.length,
      totalAmount: formatCompactMoney(totalAmountValue),
      freeTransfers,
      paidTransfers: filteredTransfers.length - freeTransfers,
    }
  }, [filteredTransfers])

  return (
    <div className="auth-bg min-h-screen w-full px-4 pb-12 pt-36 md:pt-40">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold uppercase tracking-wide text-white md:text-5xl">Historique des transferts</h1>
          <p className="mt-3 text-lg text-white/65">
            Tous les accords trouvés par votre club sur la plateforme.
          </p>
        </header>

        <section className="relative mb-10 overflow-hidden rounded-2xl border border-brand-cyan/30 bg-[#071722]/85 p-5 shadow-2xl shadow-brand-cyan/10 md:p-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-cyan" />
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <FilterGroup label="Période">
              {PERIODS.map((item) => (
                <FilterButton key={item.id} active={period === item.id} onClick={() => setPeriod(item.id)}>
                  {item.label}
                </FilterButton>
              ))}
            </FilterGroup>

            <FilterGroup label="Type de transfert">
              {TYPES.map((item) => (
                <FilterButton key={item.id} active={type === item.id} onClick={() => setType(item.id)}>
                  {item.label}
                </FilterButton>
              ))}
            </FilterGroup>
          </div>

          <label className="relative mt-5 block">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/45" />
            <input
              className="w-full rounded-xl border border-brand-cyan/30 bg-white/5 py-3 pl-12 pr-4 text-white outline-none transition placeholder:text-white/45 focus:border-brand-cyan"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un joueur ou un club..."
            />
          </label>
        </section>

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-brand-cyan/25 bg-[#071722]/85 shadow-2xl shadow-brand-cyan/10">
          <div className="grid grid-cols-[90px_minmax(220px,1.3fr)_minmax(170px,1fr)_44px_minmax(170px,1fr)_120px] gap-4 border-b border-brand-cyan/25 px-5 py-4 text-xs font-bold uppercase text-brand-cyan">
            <span>Date</span>
            <span>Joueur</span>
            <span>De</span>
            <span />
            <span>À</span>
            <span className="text-right">Montant</span>
          </div>

          {isLoading && (
            <div className="px-5 py-8 text-white/60">Chargement de l&apos;historique...</div>
          )}

          {!isLoading && filteredTransfers.length === 0 && (
            <div className="px-5 py-8 text-white/60">
              Aucun transfert ne correspond à ces filtres.
            </div>
          )}

          {!isLoading && filteredTransfers.map((transfer) => (
            <TransferRow key={transfer.id} transfer={transfer} />
          ))}
        </section>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <MetricCard label="Transferts" value={String(visibleStats.totalTransfers)} tone="cyan" />
          <MetricCard label="Montant total" value={visibleStats.totalAmount} tone="purple" />
          <MetricCard label="Libres" value={String(visibleStats.freeTransfers)} tone="cyan" />
          <MetricCard label="Payants" value={String(visibleStats.paidTransfers)} tone="purple" />
        </div>

        <p className="mt-4 text-sm text-white/45">
          Base globale actuelle : {stats.totalTransfers} accord(s), {stats.totalAmount}.
        </p>
      </div>
    </div>
  )
}

function TransferRow({ transfer }: { transfer: TransferHistoryItem }) {
  return (
    <div className="grid grid-cols-[90px_minmax(220px,1.3fr)_minmax(170px,1fr)_44px_minmax(170px,1fr)_120px] items-center gap-4 border-b border-brand-cyan/15 px-5 py-4 transition hover:bg-brand-cyan/10">
      <span className="font-semibold text-white/55">{formatDate(transfer.date)}</span>
      <div className="flex items-center gap-3">
        <PlayerAvatar transfer={transfer} />
        <div>
          <p className="font-bold uppercase leading-tight text-white">
            {transfer.player.firstName} {transfer.player.lastName}
          </p>
          <p className="mt-1 text-xs text-white/45">
            {transfer.player.position} • {transfer.type === 'loan' ? 'Prêt' : transfer.type === 'exchange' ? 'Échange' : 'Transfert'}
          </p>
        </div>
      </div>
      <TeamCell team={transfer.sellerTeam} />
      <div className="flex justify-center">
        <ArrowRight className="h-5 w-5 text-brand-cyan" />
      </div>
      <TeamCell team={transfer.buyerTeam} />
      <span className="text-right font-bold text-brand-cyan">
        {(transfer.amountValue ?? 0) === 0 ? 'Libre' : transfer.amount}
      </span>
    </div>
  )
}

function PlayerAvatar({ transfer }: { transfer: TransferHistoryItem }) {
  const player = transfer.player
  const initials = `${player.firstName.charAt(0)}${player.lastName.charAt(0)}`

  return (
    <CircleImage
      src={player.photoUrl}
      alt={`${player.firstName} ${player.lastName}`}
      className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-brand-purple/60 bg-white/10"
      sizes="48px"
      fallback={<div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-purple/20 font-bold text-white">{initials}</div>}
    />
  )
}

function TeamCell({ team }: { team: NegotiationTeam }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <CircleImage
        src={team.logoUrl}
        alt={team.name}
        className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/10"
        sizes="36px"
        imageClassName="object-contain p-1"
        fallback={<div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">{team.name.charAt(0).toUpperCase()}</div>}
      />
      <div className="min-w-0">
        <p className="truncate font-semibold text-white">{team.name}</p>
        <p className="truncate text-xs text-white/45">{team.league ?? team.country}</p>
      </div>
    </div>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-xs font-bold uppercase text-white/50">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

function FilterButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'bg-gradient-to-r from-brand-purple to-brand-cyan text-white shadow-lg shadow-brand-cyan/10'
          : 'bg-white/5 text-white/55 hover:bg-brand-cyan/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: 'cyan' | 'purple' }) {
  const valueColor = tone === 'cyan' ? 'text-brand-cyan' : 'text-brand-purple'
  const borderColor = tone === 'cyan' ? 'border-brand-cyan/35' : 'border-brand-purple/35'

  return (
    <div className={`rounded-xl border ${borderColor} bg-[#071722]/85 p-5 text-center shadow-2xl`}>
      <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
      <p className="mt-2 text-xs uppercase tracking-wide text-white/55">{label}</p>
    </div>
  )
}

function formatDate(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
  }).format(date)
}

function formatCompactMoney(value: number): string {
  if (value >= 1_000_000) {
    return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value / 1_000_000)} M€`
  }

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isWithinDays(date: Date, days: number): boolean {
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000
}

export default TransferHistoryPage