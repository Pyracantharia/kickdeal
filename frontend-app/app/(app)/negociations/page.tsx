'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, BriefcaseBusiness, CheckCircle2, ChevronDown, ChevronUp, Clock3 } from 'lucide-react'
import { useRouter } from 'next/navigation'

import Button from '@/components/ui/Button'
import CircleImage from '@/components/media/CircleImage'
import {
  contractsManager,
  type ContractNegotiation,
  type ContractViewerRole,
} from '@/features/contracts/contracts'

type NegotiationFilter = 'all' | 'active' | 'closed'

function NegotiationsPage() {
  const router = useRouter()
  const [viewerRole, setViewerRole] = useState<ContractViewerRole | null>(null)
  const [negotiations, setNegotiations] = useState<ContractNegotiation[]>([])
  const [expandedPlayers, setExpandedPlayers] = useState<Record<string, boolean>>({})
  const [selectedFilter, setSelectedFilter] = useState<NegotiationFilter>('active')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    contractsManager.getMine()
      .then((response) => {
        if (!isMounted) return
        if (!response.ok) {
          setErrorMessage('Impossible de charger les négociations.')
          return
        }

        setViewerRole(response.data.viewerRole)
        setNegotiations(response.data.negotiations ?? [])
      })
      .catch(() => {
        if (isMounted) setErrorMessage('Impossible de charger les négociations.')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const groupedNegotiations = useMemo(() => {
    const groups = new Map<string, {
      key: string
      negotiations: ContractNegotiation[]
    }>()

    for (const negotiation of negotiations) {
      const key = negotiation.player.id || negotiation.id
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
      activeCount: group.negotiations.filter((negotiation) => !isClosedNegotiation(negotiation)).length,
    }))
  }, [negotiations])

  const filteredGroups = useMemo(
    () => groupedNegotiations.filter((group) => group.negotiations.some((negotiation) => matchesFilter(negotiation, selectedFilter))),
    [groupedNegotiations, selectedFilter],
  )

  const activeCount = negotiations.filter((negotiation) => !isClosedNegotiation(negotiation)).length
  const closedCount = negotiations.length - activeCount
  const filterOptions: Array<{ key: NegotiationFilter; label: string; count: number }> = [
    { key: 'active', label: 'En cours', count: activeCount },
    { key: 'closed', label: 'Terminées', count: closedCount },
    { key: 'all', label: 'Toutes', count: negotiations.length },
  ]

  function togglePlayerGroup(playerKey: string) {
    setExpandedPlayers((current) => ({
      ...current,
      [playerKey]: !current[playerKey],
    }))
  }

  return (
    <div className="auth-bg min-h-screen w-full px-4 pb-12 pt-36 md:px-8 md:pt-40">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8 border-b border-white/10 pb-7">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-cyan">
            {viewerRole === 'agent' ? 'Portefeuille agent' : 'Espace club'}
          </p>
          <h1 className="mt-2 text-4xl font-bold text-white">NÉGOCIATIONS CONTRACTUELLES</h1>
          <p className="mt-2 text-white/60">
            {isLoading
              ? 'Chargement...'
              : `${activeCount} négociation(s) active(s) entre club et agent.`}
          </p>
        </header>

        {!isLoading && negotiations.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-3">
            {filterOptions.map((option) => {
              const isSelected = option.key === selectedFilter

              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setSelectedFilter(option.key)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    isSelected
                      ? 'border-brand-cyan/40 bg-brand-cyan/12 text-brand-cyan'
                      : 'border-white/10 bg-white/5 text-white/65 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {option.label} · {option.count}
                </button>
              )
            })}
          </div>
        )}

        {errorMessage && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
            {errorMessage}
          </div>
        )}

        {!isLoading && negotiations.length === 0 ? (
          <div className="rounded-2xl border border-brand-cyan/25 bg-[#071722]/80 p-10 text-center">
            <BriefcaseBusiness className="mx-auto h-11 w-11 text-brand-cyan" />
            <h2 className="mt-4 text-xl font-bold text-white">Aucune négociation contractuelle</h2>
            <p className="mt-2 text-white/55">
              Elles apparaîtront ici après un accord financier entre les deux clubs.
            </p>
          </div>
        ) : !isLoading && filteredGroups.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#071722]/80 p-10 text-center">
            <h2 className="text-xl font-bold text-white">Aucun résultat pour ce filtre</h2>
            <p className="mt-2 text-white/55">
              Changez de filtre pour voir les autres négociations de votre portefeuille.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGroups.map((group) => (
              <article
                key={group.key}
                className="rounded-2xl border border-white/15 bg-[#071722]/85 p-5 shadow-xl transition-colors hover:border-brand-cyan/40 md:p-6"
              >
                <NegotiationRow
                  negotiation={group.primaryNegotiation}
                  onOpen={() => router.push(`/negociations/${group.primaryNegotiation.id}`)}
                />

                {group.otherNegotiations.length > 0 && (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <button
                      type="button"
                      onClick={() => togglePlayerGroup(group.key)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition-colors hover:border-brand-cyan/30 hover:bg-white/[0.05]"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {group.otherNegotiations.length} autre(s) négociation(s) pour ce joueur
                        </p>
                        <p className="mt-1 text-xs text-white/50">
                          {group.activeCount} active(s) au total dans ce groupe
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
                            className="rounded-xl border border-white/10 bg-black/10 p-4"
                          >
                            <NegotiationRow
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
        )}
      </div>
    </div>
  )
}

function PlayerAvatar({ negotiation }: { negotiation: ContractNegotiation }) {
  const player = negotiation.player
  const fallback = (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan font-bold text-white">
      {player.firstName.charAt(0)}{player.lastName.charAt(0)}
    </div>
  )

  if (!player.photoUrl) return fallback

  return (
    <CircleImage
      src={player.photoUrl}
      alt={`${player.firstName} ${player.lastName}`}
      className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white/20"
      sizes="56px"
      fallback={fallback}
    />
  )
}

function NegotiationRow({
  negotiation,
  onOpen,
  compact = false,
}: {
  negotiation: ContractNegotiation
  onOpen: () => void
  compact?: boolean
}) {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <PlayerAvatar negotiation={negotiation} />
        <div className="min-w-0">
          <h2 className={`truncate font-bold text-white ${compact ? 'text-lg' : 'text-xl'}`}>
            {negotiation.player.firstName} {negotiation.player.lastName}
          </h2>
          <p className="mt-1 text-sm text-white/55">
            {negotiation.type === 'transfer'
              ? `${negotiation.sellerTeam.name} → ${negotiation.buyerTeam.name}`
              : `${negotiation.typeLabel} · ${negotiation.buyerTeam.name}`}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge negotiation={negotiation} />
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/60">
              {negotiation.type === 'transfer'
                ? `Accord clubs : ${negotiation.transferAgreement.amount}`
                : negotiation.typeLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="md:text-right">
        <p className="text-sm text-white/45">
          {negotiation.latestOffer
            ? negotiation.latestOffer.isMine
              ? 'Votre dernière proposition'
              : 'Proposition reçue'
            : 'Première proposition'}
        </p>
        <p className="mt-1 font-semibold text-brand-cyan">
          {negotiation.latestOffer
            ? negotiation.type === 'termination'
              ? negotiation.latestOffer.terminationCompensation
              : negotiation.latestOffer.annualSalary
            : 'À formuler'}
        </p>
        {negotiation.latestOffer && (
          <p className={`mt-1 text-xs ${
            !negotiation.latestOffer.isMine && negotiation.latestOffer.status === 'pending'
              ? 'font-semibold text-amber-200'
              : 'text-white/45'
          }`}>
            {negotiation.type === 'termination'
              ? `Départ : ${formatDate(negotiation.latestOffer.effectiveDate)}`
              : `${negotiation.latestOffer.durationMonths} mois`} · {negotiation.latestOffer.authorLabel}
            {!negotiation.latestOffer.isMine && negotiation.latestOffer.status === 'pending'
              ? ' · réponse attendue'
              : ''}
          </p>
        )}
      </div>

      <Button
        type="button"
        variant="secondary"
        onClick={onOpen}
        icon={<ArrowRight className="h-4 w-4" />}
      >
        Ouvrir
      </Button>
    </div>
  )
}

function StatusBadge({ negotiation }: { negotiation: ContractNegotiation }) {
  const isCompleted = negotiation.status === 'completed'
  const isClosed = isClosedNegotiation(negotiation)
  const Icon = isCompleted ? CheckCircle2 : Clock3

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
      isCompleted
        ? 'border-brand-cyan/35 bg-brand-cyan/10 text-brand-cyan'
        : isClosed
          ? 'border-white/20 bg-white/5 text-white/60'
          : 'border-brand-purple/35 bg-brand-purple/10 text-brand-purple'
    }`}>
      <Icon className="h-3.5 w-3.5" />
      {negotiation.statusLabel}
    </span>
  )
}

function isClosedNegotiation(negotiation: ContractNegotiation): boolean {
  return ['completed', 'rejected', 'expired'].includes(negotiation.status)
}

function matchesFilter(negotiation: ContractNegotiation, filter: NegotiationFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'active') return !isClosedNegotiation(negotiation)

  return isClosedNegotiation(negotiation)
}

function formatDate(value?: string | null): string {
  if (!value) return 'à définir'

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

export default NegotiationsPage
