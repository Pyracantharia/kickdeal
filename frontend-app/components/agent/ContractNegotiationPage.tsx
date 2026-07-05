'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRightLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Send,
  ShieldCheck,
  XCircle,
  Trash2,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

import Button from '@/components/ui/Button'
import CircleImage from '@/components/media/CircleImage'
import { useNotifications } from '@/context/NotificationsProvider'
import {
  contractsManager,
  type ContractNegotiation,
  type ContractOfferPayload,
} from '@/features/contracts/contracts'
import {
  formatCurrency,
  formatNumberInput,
  parseFormattedNumber,
} from '@/features/format/number'
import { getPositionDisplayName } from '@/features/players/position'

interface ContractNegotiationPageProps {
  negotiationId: string
}

function ContractNegotiationPage({ negotiationId }: ContractNegotiationPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshSummary } = useNotifications()
  const [negotiation, setNegotiation] = useState<ContractNegotiation | null>(null)
  const [annualSalary, setAnnualSalary] = useState('')
  const [durationMonths, setDurationMonths] = useState('48')
  const [signingBonus, setSigningBonus] = useState('')
  const [releaseClause, setReleaseClause] = useState('')
  const [terminationCompensation, setTerminationCompensation] = useState('')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionInProgress, setActionInProgress] = useState<'accept' | 'reject' | 'cancel' | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadNegotiation = useCallback(async () => {
    try {
      const response = await contractsManager.getById(negotiationId)
      if (!response.ok) {
        setErrorMessage(readError(response.data, 'Impossible de charger la négociation.'))
        return
      }

      const nextNegotiation = response.data.negotiation
      setNegotiation(nextNegotiation)

      const latestOffer = nextNegotiation.latestOffer
      if (latestOffer) {
        setAnnualSalary(latestOffer.annualSalaryValue
          ? formatNumberInput(String(latestOffer.annualSalaryValue))
          : '')
        setDurationMonths(String(latestOffer.durationMonths ?? 48))
        setSigningBonus(latestOffer.signingBonusValue
          ? formatNumberInput(String(latestOffer.signingBonusValue))
          : '')
        setReleaseClause(latestOffer.releaseClauseValue
          ? formatNumberInput(String(latestOffer.releaseClauseValue))
          : '')
        setTerminationCompensation(latestOffer.terminationCompensationValue
          ? formatNumberInput(String(latestOffer.terminationCompensationValue))
          : '')
        setEffectiveDate(latestOffer.effectiveDate ?? '')
        setValidUntil(latestOffer.validUntil ?? '')
        setNotes(latestOffer.notes ?? '')
      } else {
        setAnnualSalary(nextNegotiation.player.annualSalaryValue
          ? formatNumberInput(String(nextNegotiation.player.annualSalaryValue))
          : '')
        setReleaseClause(nextNegotiation.player.releaseClauseValue
          ? formatNumberInput(String(nextNegotiation.player.releaseClauseValue))
          : '')
        if (nextNegotiation.type === 'renewal') {
          const remainingMonths = getRemainingContractMonths(nextNegotiation.player.contractEndDate)
          setDurationMonths(String(
            searchParams.get('focus') === 'duration'
              ? Math.min(120, remainingMonths + 24)
              : remainingMonths,
          ))
        }
        if (nextNegotiation.type === 'termination') {
          setEffectiveDate(new Date().toISOString().slice(0, 10))
        }
      }
    } catch {
      setErrorMessage('Impossible de charger la négociation.')
    } finally {
      setIsLoading(false)
    }
  }, [negotiationId, searchParams])

  useEffect(() => {
    void loadNegotiation()
  }, [loadNegotiation])

  const isClosed = negotiation
    ? ['completed', 'rejected', 'expired'].includes(negotiation.status)
    : false
  const latestOffer = negotiation?.latestOffer
  const canRespondToLatest = Boolean(latestOffer && !latestOffer.isMine && latestOffer.status === 'pending' && !isClosed)
  const salaryValue = parseFormattedNumber(annualSalary) ?? 0
  const bonusValue = parseFormattedNumber(signingBonus) ?? 0
  const releaseClauseValue = parseFormattedNumber(releaseClause) ?? 0
  const terminationCompensationValue = parseFormattedNumber(terminationCompensation) ?? 0
  const weeklyValue = Math.round(salaryValue / 52)
  const isTermination = negotiation?.type === 'termination'
  const isTransfer = negotiation?.type === 'transfer'
  const canCancelNegotiation = Boolean(
    negotiation
    && negotiation.viewerRole === 'club'
    && !isClosed
    && !isTransfer
    && negotiation.history.length === 0,
  )
  const formTitle = latestOffer
    ? latestOffer.isMine
      ? 'Modifier votre proposition'
      : 'Préparer une contre-proposition'
    : negotiation?.viewerRole === 'club'
      ? isTermination
        ? 'Proposer les conditions de résiliation'
        : 'Formuler l’offre contractuelle'
      : isTermination
        ? 'Présenter les conditions de départ du joueur'
        : 'Présenter les attentes du joueur'

  const sortedHistory = useMemo(() => negotiation?.history ?? [], [negotiation?.history])
  const durationOptions = useMemo(
    () => Array.from(new Set([Number(durationMonths), 12, 24, 36, 48, 60, 72, 84, 96, 120]))
      .filter((months) => months > 0 && months <= 120)
      .sort((left, right) => left - right),
    [durationMonths],
  )
  const isSameAsLatestOwnPendingOffer = useMemo(() => {
    if (!negotiation || !latestOffer || !latestOffer.isMine || latestOffer.status !== 'pending') {
      return false
    }

    const normalizedNotes = notes.trim() || null
    const normalizedValidUntil = validUntil || null
    const normalizedEffectiveDate = effectiveDate || null

    if (isTermination) {
      return (latestOffer.terminationCompensationValue ?? 0) === terminationCompensationValue
        && (latestOffer.effectiveDate ?? null) === normalizedEffectiveDate
        && (latestOffer.validUntil ?? null) === normalizedValidUntil
        && (latestOffer.notes ?? null) === normalizedNotes
    }

    return (latestOffer.annualSalaryValue ?? 0) === salaryValue
      && (latestOffer.durationMonths ?? null) === Number(durationMonths)
      && (latestOffer.signingBonusValue ?? 0) === bonusValue
      && (latestOffer.releaseClauseValue ?? 0) === releaseClauseValue
      && (latestOffer.validUntil ?? null) === normalizedValidUntil
      && (latestOffer.notes ?? null) === normalizedNotes
  }, [
    bonusValue,
    durationMonths,
    effectiveDate,
    isTermination,
    latestOffer,
    negotiation,
    notes,
    releaseClauseValue,
    salaryValue,
    terminationCompensationValue,
    validUntil,
  ])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!negotiation || (!isTermination && salaryValue <= 0)) return

    setIsSubmitting(true)
    setErrorMessage(null)

    const payload: ContractOfferPayload = isTermination ? {
      terminationCompensation: terminationCompensationValue,
      effectiveDate: effectiveDate || undefined,
      validUntil: validUntil || undefined,
      notes: notes.trim() || undefined,
    } : {
      annualSalary: salaryValue,
      durationMonths: Number(durationMonths),
      signingBonus: bonusValue || undefined,
      releaseClause: releaseClauseValue || undefined,
      validUntil: validUntil || undefined,
      notes: notes.trim() || undefined,
    }

    try {
      const response = await contractsManager.createOffer(negotiation.id, payload)
      if (!response.ok) {
        setErrorMessage(readError(response.data, 'Impossible d’envoyer la proposition.'))
        return
      }
      await loadNegotiation()
      await refreshSummary()
    } catch {
      setErrorMessage('Impossible d’envoyer la proposition.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleOfferAction(action: 'accept' | 'reject') {
    if (!latestOffer) return

    setActionInProgress(action)
    setErrorMessage(null)

    try {
      const response = action === 'accept'
        ? await contractsManager.acceptOffer(latestOffer.id)
        : await contractsManager.rejectOffer(latestOffer.id)
      if (!response.ok) {
        setErrorMessage(readError(response.data, `Impossible de ${action === 'accept' ? 'valider' : 'refuser'} l’offre.`))
        return
      }
      setNegotiation(response.data.negotiation)
      await refreshSummary()
    } catch {
      setErrorMessage('Impossible de mettre à jour la négociation.')
    } finally {
      setActionInProgress(null)
    }
  }

  async function handleCancelNegotiation() {
    if (!negotiation || !canCancelNegotiation) return
    if (!window.confirm('Annuler cette négociation contractuelle ?')) return

    setActionInProgress('cancel')
    setErrorMessage(null)

    try {
      const response = await contractsManager.cancelNegotiation(negotiation.id)
      if (!response.ok) {
        setErrorMessage(readError(response.data, 'Impossible d’annuler la négociation.'))
        return
      }

      await refreshSummary()
      router.push('/negociations')
    } catch {
      setErrorMessage('Impossible d’annuler la négociation.')
    } finally {
      setActionInProgress(null)
    }
  }

  if (isLoading) {
    return <div className="auth-bg min-h-screen px-4 pt-40 text-center text-white/60">Chargement de la négociation...</div>
  }

  if (!negotiation) {
    return (
      <div className="auth-bg min-h-screen px-4 pt-40">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center text-red-200">
          {errorMessage ?? 'Négociation introuvable.'}
        </div>
      </div>
    )
  }

  return (
    <div className="auth-bg min-h-screen w-full px-4 pb-16 pt-36 md:px-8 md:pt-40">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-8 border-b border-white/10 pb-7">
          <button
            type="button"
            onClick={() => router.push('/negociations')}
            className="mb-4 inline-flex items-center gap-2 text-sm text-white/55 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux négociations
          </button>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-cyan">
            {negotiation.typeLabel} · {negotiation.viewerRole === 'agent' ? 'Vue agent' : 'Vue club'}
          </p>
          <h1 className="mt-2 text-3xl font-bold uppercase text-white md:text-4xl">
            {negotiation.player.firstName} {negotiation.player.lastName}
          </h1>
          {isTransfer ? (
            <p className="mt-2 flex items-center gap-2 text-white/60">
              {negotiation.sellerTeam.name}
              <ArrowRightLeft className="h-4 w-4 text-brand-cyan" />
              {negotiation.buyerTeam.name}
            </p>
          ) : (
            <p className="mt-2 text-white/60">
              Discussion entre {negotiation.buyerTeam.name} et l’agent du joueur
            </p>
          )}
        </header>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <SummaryCard
            label={isTransfer ? 'Accord entre clubs' : 'Contrat actuel'}
            value={isTransfer ? negotiation.transferAgreement.amount : formatContractDate(negotiation.player.contractEndDate)}
            icon={<ShieldCheck />}
          />
          <SummaryCard
            label="Salaire actuel"
            value={negotiation.player.weeklySalary}
            icon={<CalendarDays />}
          />
          <SummaryCard
            label="Statut"
            value={negotiation.statusLabel}
            icon={isClosed ? <CheckCircle2 /> : <Clock3 />}
          />
        </div>

        {negotiation.status === 'completed' && (
          <div className="mb-6 flex gap-3 rounded-2xl border border-brand-cyan/35 bg-brand-cyan/10 p-5">
            <CheckCircle2 className="h-6 w-6 shrink-0 text-brand-cyan" />
            <div>
              <p className="font-bold text-white">
                {isTransfer ? 'Transfert finalisé' : isTermination ? 'Résiliation finalisée' : 'Nouveau contrat signé'}
              </p>
              <p className="mt-1 text-sm text-white/65">
                {isTransfer
                  ? `Le contrat a été accepté et le joueur appartient désormais à ${negotiation.buyerTeam.name}.`
                  : isTermination
                    ? 'L’accord de départ a été accepté et le joueur est désormais libre.'
                    : `Les nouvelles conditions contractuelles avec ${negotiation.buyerTeam.name} sont désormais en vigueur.`}
              </p>
            </div>
          </div>
        )}

        {!isClosed && canRespondToLatest && (
          <div className="mb-6 flex gap-3 rounded-2xl border border-amber-300/35 bg-amber-300/10 p-5">
            <Clock3 className="h-6 w-6 shrink-0 text-amber-200" />
            <div>
              <p className="font-bold text-white">
                Proposition reçue de {latestOffer?.authorLabel.toLowerCase()}
              </p>
              <p className="mt-1 text-sm text-white/65">
                Vous pouvez l’accepter, la refuser ou envoyer une contre-proposition.
              </p>
            </div>
          </div>
        )}

        {!isClosed && !latestOffer && (
          <div className="mb-6 flex gap-3 rounded-2xl border border-brand-cyan/35 bg-brand-cyan/10 p-5">
            <Send className="h-6 w-6 shrink-0 text-brand-cyan" />
            <div>
              <p className="font-bold text-white">La discussion contractuelle est ouverte</p>
              <p className="mt-1 text-sm text-white/65">
                {negotiation.viewerRole === 'club'
                  ? `${negotiation.buyerTeam.name ?? 'Le club acheteur'} peut envoyer la première offre de salaire à l’agent.`
                  : 'Vous pouvez transmettre les attentes du joueur au club acheteur sans attendre sa première offre.'}
              </p>
            </div>
          </div>
        )}

        {canCancelNegotiation && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div>
              <p className="font-bold text-white">Négociation ouverte par erreur ?</p>
              <p className="mt-1 text-sm text-white/60">
                Tant qu’aucune proposition n’a été envoyée, le club peut annuler cette discussion.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleCancelNegotiation()}
              isLoading={actionInProgress === 'cancel'}
              disabled={Boolean(actionInProgress && actionInProgress !== 'cancel')}
              icon={<Trash2 className="h-4 w-4" />}
            >
              Annuler la négociation
            </Button>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-6">
            {latestOffer && (
              <section className="rounded-2xl border border-brand-purple/35 bg-[#071722]/88 p-6 shadow-xl">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase text-brand-purple">Dernière proposition</p>
                    <h2 className="mt-2 text-2xl font-bold text-white">
                      {isTermination ? latestOffer.terminationCompensation : `${latestOffer.annualSalary} / an`}
                    </h2>
                    <p className="mt-1 text-sm text-white/55">
                      {isTermination
                        ? `Départ prévu le ${formatDate(latestOffer.effectiveDate)}`
                        : `${latestOffer.weeklySalary} / semaine · ${latestOffer.durationMonths} mois`}
                    </p>
                  </div>
                  <OfferStatusBadge status={latestOffer.status} />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Info label="Auteur" value={latestOffer.authorLabel} />
                  <Info
                    label={isTermination ? 'Indemnité de résiliation' : 'Prime à la signature'}
                    value={isTermination ? latestOffer.terminationCompensation : latestOffer.signingBonus}
                  />
                  <Info label="Valable jusqu’au" value={formatDate(latestOffer.validUntil)} />
                </div>
                {!isTermination && (
                  <div className="mt-3">
                    <Info label="Clause libératoire" value={latestOffer.releaseClause} />
                  </div>
                )}
                {isTermination && (
                  <div className="mt-3">
                    <Info label="Date de départ" value={formatDate(latestOffer.effectiveDate)} />
                  </div>
                )}

                {latestOffer.notes && (
                  <p className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/65">
                    {latestOffer.notes}
                  </p>
                )}

                {canRespondToLatest && (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Button
                      type="button"
                      onClick={() => handleOfferAction('accept')}
                      isLoading={actionInProgress === 'accept'}
                      icon={<CheckCircle2 className="h-4 w-4" />}
                    >
                      {isTermination ? 'Accepter la résiliation' : 'Accepter et finaliser'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleOfferAction('reject')}
                      disabled={Boolean(actionInProgress)}
                      icon={<XCircle className="h-4 w-4" />}
                    >
                      Refuser cette proposition
                    </Button>
                  </div>
                )}
              </section>
            )}

            {!isClosed && (
              <form onSubmit={handleSubmit} className="rounded-2xl border border-brand-cyan/30 bg-[#071722]/88 p-6 shadow-xl">
                <h2 className="text-xl font-bold text-white">{formTitle}</h2>
                <p className="mt-1 text-sm text-white/50">
                  La contrepartie devra accepter cette proposition pour rendre l’accord effectif.
                </p>
                {isSameAsLatestOwnPendingOffer && (
                  <p className="mt-3 text-sm text-amber-200">
                    Cette proposition est identique a votre offre en attente. Modifiez-la avant de la renvoyer.
                  </p>
                )}

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  {isTermination ? (
                    <>
                      <Field label="Indemnité de résiliation">
                        <MoneyField
                          value={terminationCompensation}
                          onChange={setTerminationCompensation}
                          placeholder="0"
                          required
                        />
                      </Field>
                      <Field label="Prise d’effet">
                        <div className="flex h-12 items-center rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white/70">
                          Immédiate après acceptation
                        </div>
                      </Field>
                    </>
                  ) : (
                    <>
                      <Field label="Salaire annuel">
                        <MoneyField value={annualSalary} onChange={setAnnualSalary} placeholder="12 000 000" required />
                        <p className="mt-2 text-xs text-brand-cyan">
                          Environ {formatCurrency(weeklyValue)} par semaine
                        </p>
                      </Field>
                      <Field label="Durée du contrat">
                        <select
                          value={durationMonths}
                          onChange={(event) => setDurationMonths(event.target.value)}
                          className="h-12 w-full rounded-xl border border-white/15 bg-[#0d1a29] px-4 text-white focus:border-brand-cyan focus:outline-none"
                        >
                          {durationOptions.map((months) => (
                            <option key={months} value={months}>{months} mois</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Prime à la signature">
                        <MoneyField value={signingBonus} onChange={setSigningBonus} placeholder="2 000 000" />
                      </Field>
                      <Field label="Clause libératoire">
                        <MoneyField value={releaseClause} onChange={setReleaseClause} placeholder="100 000 000" />
                      </Field>
                    </>
                  )}
                  <Field label="Validité de l’offre">
                    <input
                      type="date"
                      value={validUntil}
                      onChange={(event) => setValidUntil(event.target.value)}
                      className="h-12 w-full rounded-xl border border-white/15 bg-[#0d1a29] px-4 text-white focus:border-brand-cyan focus:outline-none"
                    />
                  </Field>
                </div>

                <Field label="Message et conditions particulières" className="mt-5">
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={4}
                    placeholder="Rôle attendu, objectifs sportifs, avantages complémentaires..."
                    className="w-full resize-none rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-brand-cyan focus:outline-none"
                  />
                </Field>

                <Button
                  type="submit"
                  className="mt-6 w-full"
                  isLoading={isSubmitting}
                  disabled={(isTermination ? terminationCompensationValue < 0 : salaryValue <= 0) || isSameAsLatestOwnPendingOffer}
                  icon={<Send className="h-4 w-4" />}
                >
                  {isTermination ? 'Envoyer la proposition de résiliation' : 'Envoyer la proposition'}
                </Button>
              </form>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <section className="rounded-2xl border border-white/15 bg-[#071722]/90 p-6 shadow-xl">
              <div className="flex items-center gap-4">
                <PlayerAvatar negotiation={negotiation} />
                <div>
                  <h2 className="font-bold text-white">
                    {negotiation.player.firstName} {negotiation.player.lastName}
                  </h2>
                  <p className="mt-1 text-sm text-white/50">
                    {getPositionDisplayName(negotiation.player.position)} · {negotiation.player.age} ans
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                <InfoLine label="Club actuel" value={negotiation.player.currentClub} />
                <InfoLine label={isTransfer ? 'Club acheteur' : 'Club concerné'} value={negotiation.buyerTeam.name ?? '-'} accent />
                <InfoLine label="Agent" value={negotiation.agent.agencyName || negotiation.agent.name || 'Agent du joueur'} />
              </div>
            </section>

            <section className="rounded-2xl border border-white/15 bg-[#071722]/90 p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white">Historique</h2>
              <div className="mt-5 space-y-4">
                {sortedHistory.length === 0 && (
                  <p className="text-sm text-white/50">Aucune proposition contractuelle.</p>
                )}
                {sortedHistory.map((offer) => (
                  <div key={offer.id} className="border-l-2 border-brand-purple/50 pl-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{offer.authorLabel}</p>
                        <p className="mt-1 text-sm text-brand-cyan">
                          {isTermination ? offer.terminationCompensation : `${offer.annualSalary} / an`}
                        </p>
                      </div>
                      <span className="text-xs text-white/35">{formatDate(offer.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-xs text-white/45">
                      {isTermination ? formatDate(offer.effectiveDate) : `${offer.durationMonths} mois`} · {offer.status}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/15 bg-[#071722]/80 p-4">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-cyan/10 text-brand-cyan">{icon}</span>
      <div>
        <p className="text-xs uppercase tracking-wide text-white/40">{label}</p>
        <p className="mt-1 font-semibold text-white">{value}</p>
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

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-semibold text-white">{label}</span>
      {children}
    </label>
  )
}

function MoneyField({
  value,
  onChange,
  placeholder,
  required = false,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  required?: boolean
}) {
  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(formatNumberInput(event.target.value))}
        placeholder={placeholder}
        required={required}
        className="h-12 w-full rounded-xl border border-white/15 bg-white/5 px-4 pr-14 text-white placeholder:text-white/30 focus:border-brand-cyan focus:outline-none"
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/40">EUR</span>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-white/35">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  )
}

function InfoLine({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-white/45">{label}</span>
      <span className={`text-right text-sm font-semibold ${accent ? 'text-brand-cyan' : 'text-white'}`}>{value}</span>
    </div>
  )
}

function OfferStatusBadge({ status }: { status: string }) {
  const style = status === 'accepted'
    ? 'border-brand-cyan/35 bg-brand-cyan/10 text-brand-cyan'
    : status === 'pending'
      ? 'border-amber-300/35 bg-amber-300/10 text-amber-200'
      : 'border-white/15 bg-white/5 text-white/50'

  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${style}`}>{status}</span>
}

function formatDate(value?: string | null): string {
  if (!value) return '-'

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatContractDate(value?: string | null): string {
  if (!value) return 'Non renseigné'

  return new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

function getRemainingContractMonths(value?: string | null): number {
  if (!value) return 12

  const today = new Date()
  const endDate = new Date(`${value}T00:00:00`)
  const months = (endDate.getFullYear() - today.getFullYear()) * 12
    + endDate.getMonth() - today.getMonth()
    + (endDate.getDate() > today.getDate() ? 1 : 0)

  return Math.min(120, Math.max(1, months))
}

function readError(data: unknown, fallback: string): string {
  if (typeof data !== 'object' || data === null) return fallback
  if ('errorMessage' in data && typeof data.errorMessage === 'string') return data.errorMessage

  return fallback
}

export default ContractNegotiationPage
