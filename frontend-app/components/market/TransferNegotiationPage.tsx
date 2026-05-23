'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRightLeft, ChevronUp, Send } from 'lucide-react'

import Button from '@/components/ui/Button'
import {
  ChoiceButton,
  FieldLabel,
  MoneyInput,
  PlayerSummary,
  SummaryLine,
  TeamLogo,
  TextInput,
  ToggleRow,
} from '@/components/market/negotiation/TransferNegotiationParts'
import type { ClubPlayer } from '@/features/club/types/roster'
import { formatCurrency, formatNumberInput, parseFormattedNumber, parseOptionalNumber } from '@/features/format/number'
import { transfersManager } from '@/features/market/transfers'
import type { OfferType, TransferNegotiationContext, TransferOfferPayload } from '@/features/market/types/transfer'
import { playersManager } from '@/features/players/players'
import { subscriptionManager, type SubscriptionSummary } from '@/features/subscription/subscription'

type PaymentMode = 'single' | 'installments'

function TransferNegotiationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const listingId = searchParams.get('listingId') ?? undefined
  const offerId = searchParams.get('offerId') ?? undefined

  const [context, setContext] = useState<TransferNegotiationContext | null>(null)
  const [roster, setRoster] = useState<ClubPlayer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null)

  const [type, setType] = useState<OfferType>('purchase')
  const [amount, setAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('single')
  const [paymentInstallments, setPaymentInstallments] = useState('2')
  const [durationMonths, setDurationMonths] = useState('12')
  const [hasBonus, setHasBonus] = useState(false)
  const [performanceBonus, setPerformanceBonus] = useState('')
  const [performanceBonusCondition, setPerformanceBonusCondition] = useState('')
  const [hasResale, setHasResale] = useState(false)
  const [resalePercentage, setResalePercentage] = useState('')
  const [exchangePlayerId, setExchangePlayerId] = useState('')
  const [buyBackPriority, setBuyBackPriority] = useState(false)
  const [futureTransferPriority, setFutureTransferPriority] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadContext() {
      if (!listingId && !offerId) {
        setErrorMessage('Aucune négociation sélectionnée.')
        setIsLoading(false)
        return
      }

      try {
        const [response, subscriptionResponse] = await Promise.all([
          transfersManager.getNegotiationContext({ listingId, offerId }),
          subscriptionManager.getCurrent(),
        ])

        if (!isMounted) {
          return
        }

        if (!response.ok) {
          const errorData = response.data as { errorMessage?: unknown }
          setErrorMessage(typeof errorData.errorMessage === 'string' ? errorData.errorMessage : 'Impossible de charger la négociation.')
          return
        }

        const nextContext = response.data.context
        const latestOffer = nextContext.latestOffer

        setContext(nextContext)
        if (subscriptionResponse.ok) {
          setSubscription(subscriptionResponse.data.subscription)
        }
        setType(latestOffer?.type ?? 'purchase')
        setAmount(latestOffer?.amountValue ? formatNumberInput(String(latestOffer.amountValue)) : '')
        setHasBonus(Boolean(latestOffer?.performanceBonusValue))
        setPerformanceBonus(latestOffer?.performanceBonusValue ? formatNumberInput(String(latestOffer.performanceBonusValue)) : '')
        setPerformanceBonusCondition(latestOffer?.performanceBonusCondition ?? '')
        setHasResale(Boolean(latestOffer?.resalePercentageValue))
        setResalePercentage(latestOffer?.resalePercentageValue ? String(latestOffer.resalePercentageValue) : '')
        setBuyBackPriority(Boolean(latestOffer?.buyBackPriority))
        setFutureTransferPriority(Boolean(latestOffer?.futureTransferPriority))
        setDurationMonths(latestOffer?.duration ? String(latestOffer.duration) : '12')
      } catch {
        if (isMounted) {
          setErrorMessage('Impossible de charger la négociation.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadContext()

    return () => {
      isMounted = false
    }
  }, [listingId, offerId])

  useEffect(() => {
    let isMounted = true

    async function loadExchangeRoster() {
      if (type !== 'exchange' || !context?.exchangeTeamId) {
        setRoster([])
        setExchangePlayerId('')
        return
      }

      const response = await playersManager.getTeamRoster(context.exchangeTeamId)

      if (isMounted && response.ok) {
        setRoster(response.data.players ?? [])
      }
    }

    loadExchangeRoster()

    return () => {
      isMounted = false
    }
  }, [context?.exchangeTeamId, type])

  const amountValue = parseFormattedNumber(amount) ?? 0
  const bonusValue = hasBonus ? (parseFormattedNumber(performanceBonus) ?? 0) : 0
  const totalValue = amountValue + bonusValue
  const isSeller = context?.viewerRole === 'seller'
  const counterparty = isSeller ? context?.buyerTeam : context?.sellerTeam
  const operationLabel = type === 'loan' ? 'Prêt' : type === 'exchange' ? 'Échange' : isSeller ? 'Vente' : 'Transfert définitif'
  const canShowAdvancedTransferTerms = type !== 'loan'

  const history = useMemo(() => context?.history ?? [], [context?.history])

  const submitOffer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!context) {
      return
    }

    if (subscription && !subscription.canCreateOffer) {
      setErrorMessage('Vous avez atteint la limite du plan gratuit.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    const payload: TransferOfferPayload = {
      listingId: context.listingId,
      type,
      amount: amountValue,
      durationMonths: type === 'loan' ? parseOptionalNumber(durationMonths) : undefined,
      paymentInstallments: type !== 'loan' && paymentMode === 'installments' ? parseOptionalNumber(paymentInstallments) : undefined,
      performanceBonus: canShowAdvancedTransferTerms && hasBonus ? bonusValue : undefined,
      performanceBonusCondition: canShowAdvancedTransferTerms && hasBonus ? performanceBonusCondition || undefined : undefined,
      resalePercentage: canShowAdvancedTransferTerms && hasResale ? parseOptionalNumber(resalePercentage) : undefined,
      exchangePlayerId: type === 'exchange' ? exchangePlayerId || undefined : undefined,
      buyBackPriority: canShowAdvancedTransferTerms ? buyBackPriority : false,
      futureTransferPriority: canShowAdvancedTransferTerms ? futureTransferPriority : false,
      message: message || undefined,
    }

    try {
      const response = offerId
        ? await transfersManager.counterOffer(offerId, payload)
        : await transfersManager.createOffer(payload)

      if (!response.ok) {
        const errorData = response.data as { errorMessage?: unknown }
        setErrorMessage(typeof errorData.errorMessage === 'string' ? errorData.errorMessage : "Impossible d'envoyer l'offre.")
        return
      }

      router.push('/market/transfers')
    } catch {
      setErrorMessage("Impossible d'envoyer l'offre.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="auth-bg min-h-screen w-full px-4 pb-12 pt-28">
        <div className="mx-auto w-full max-w-7xl text-white/70">Chargement de la négociation...</div>
      </div>
    )
  }

  if (!context) {
    return (
      <div className="auth-bg min-h-screen w-full px-4 pb-12 pt-28">
        <div className="mx-auto w-full max-w-7xl rounded-2xl border border-red-500/40 bg-red-500/10 p-5 text-red-100">
          {errorMessage ?? 'Négociation introuvable.'}
        </div>
      </div>
    )
  }

  return (
    <div className="auth-bg min-h-screen w-full px-4 pb-16 pt-28">
      <form className="mx-auto w-full max-w-7xl" onSubmit={submitOffer}>
        <header className="mb-8 border-b border-white/10 pb-6">
          <h1 className="text-4xl font-bold uppercase tracking-wide text-white md:text-5xl">
            Négociation - transfert de joueur
          </h1>
          <p className="mt-2 text-lg text-white/65">
            {context.buyerTeam.name} <ArrowRightLeft className="mx-1 inline h-4 w-4" /> {context.sellerTeam.name}
          </p>
        </header>

        <PlayerSummary context={context} />

        <section className="mt-8 rounded-2xl border border-brand-cyan/25 bg-[#071722]/85 p-5 shadow-2xl shadow-brand-cyan/10">
          <h2 className="text-lg font-bold text-white">Type d&apos;opération</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <ChoiceButton label={isSeller ? 'Vente' : 'Transfert'} active={type === 'purchase'} onClick={() => setType('purchase')} />
            <ChoiceButton label="Échange" active={type === 'exchange'} onClick={() => setType('exchange')} />
            <ChoiceButton label="Prêt" active={type === 'loan'} onClick={() => setType('loan')} />
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-brand-cyan/25 bg-[#071722]/88 p-5 shadow-2xl shadow-brand-cyan/10 md:p-6">
              <h2 className="text-xl font-bold text-white">{type === 'loan' ? 'Détails du prêt' : 'Détails du transfert'}</h2>

              <div className="mt-6">
                <FieldLabel>{type === 'loan' ? 'Indemnité de prêt' : 'Montant du transfert'}</FieldLabel>
                <MoneyInput value={amount} onChange={setAmount} placeholder="70 000 000" required />
                <p className="mt-2 text-sm text-white/55">{formatCurrency(amountValue)}</p>
              </div>

              {type === 'loan' && (
                <div className="mt-5">
                  <FieldLabel>Durée du prêt (mois)</FieldLabel>
                  <TextInput value={durationMonths} onChange={setDurationMonths} inputMode="numeric" placeholder="12" />
                </div>
              )}

              {type === 'exchange' && (
                <div className="mt-5">
                  <FieldLabel>{isSeller ? 'Joueur demandé en échange' : 'Joueur proposé en échange'}</FieldLabel>
                  <select
                    className="w-full rounded-xl border border-brand-cyan/30 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-brand-cyan"
                    value={exchangePlayerId}
                    onChange={(event) => setExchangePlayerId(event.target.value)}
                    required
                  >
                    <option value="">Sélectionner un joueur</option>
                    {roster.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.firstName} {player.lastName} - {player.position}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {type !== 'loan' && (
                <>
                  <div className="mt-5">
                    <FieldLabel>Structure de paiement</FieldLabel>
                    <div className="grid gap-3 md:grid-cols-2">
                      <ChoiceButton label="Paiement unique" active={paymentMode === 'single'} onClick={() => setPaymentMode('single')} />
                      <ChoiceButton label="Paiement en plusieurs fois" active={paymentMode === 'installments'} onClick={() => setPaymentMode('installments')} />
                    </div>
                  </div>

                  {paymentMode === 'installments' && (
                    <div className="mt-5">
                      <FieldLabel>Nombre de versements</FieldLabel>
                      <TextInput value={paymentInstallments} onChange={setPaymentInstallments} inputMode="numeric" placeholder="5" />
                    </div>
                  )}

                  <ToggleRow label="Ajouter des bonus" checked={hasBonus} onChange={setHasBonus} />
                  {hasBonus && (
                    <div className="mt-3 rounded-xl border border-brand-cyan/25 bg-white/5 p-4">
                      <FieldLabel>Montant du bonus</FieldLabel>
                      <MoneyInput value={performanceBonus} onChange={setPerformanceBonus} placeholder="5 000 000" />
                      <div className="mt-4">
                        <FieldLabel>Condition du bonus</FieldLabel>
                        <TextInput value={performanceBonusCondition} onChange={setPerformanceBonusCondition} placeholder="Qualification européenne, nombre de matchs..." />
                      </div>
                    </div>
                  )}

                  <ToggleRow label="Clause de revente" checked={hasResale} onChange={setHasResale} />
                  {hasResale && (
                    <div className="mt-3 rounded-xl border border-brand-cyan/25 bg-white/5 p-4">
                      <FieldLabel>Pourcentage à la revente</FieldLabel>
                      <TextInput value={resalePercentage} onChange={setResalePercentage} inputMode="numeric" suffix="%" placeholder="20" />
                    </div>
                  )}
                </>
              )}
            </section>

            <section className="rounded-2xl border border-brand-purple/25 bg-[#071722]/88 p-5 shadow-2xl shadow-brand-purple/10 md:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Options supplémentaires</h2>
                <ChevronUp className="h-5 w-5 text-brand-purple" />
              </div>

              {canShowAdvancedTransferTerms && (
                <>
                  <ToggleRow
                    label="Clause de rachat prioritaire"
                    description={`${context.buyerTeam.name} aura la priorité pour racheter le joueur.`}
                    checked={buyBackPriority}
                    onChange={setBuyBackPriority}
                    tone="purple"
                  />
                  <ToggleRow
                    label="Priorité sur un futur transfert"
                    description={`Priorité pour un joueur de ${context.sellerTeam.name} dans une future transaction.`}
                    checked={futureTransferPriority}
                    onChange={setFutureTransferPriority}
                    tone="purple"
                  />
                </>
              )}

              <label className="mt-5 block">
                <FieldLabel>Message personnalisé à {counterparty?.name}</FieldLabel>
                <textarea
                  className="min-h-32 w-full rounded-xl border border-brand-cyan/25 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-brand-cyan"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Ajouter un message personnalisé pour accompagner votre offre..."
                />
              </label>
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-2xl border-2 border-brand-purple/70 bg-[#111827]/90 p-6 shadow-2xl shadow-brand-purple/15">
              <h2 className="text-xl font-bold text-white">Récapitulatif de l&apos;offre</h2>
              <SummaryLine label="Type d'opération" value={operationLabel} />
              <SummaryLine label="Montant garanti" value={formatCurrency(amountValue)} highlight />
              {hasBonus && canShowAdvancedTransferTerms && <SummaryLine label="Bonus potentiels" value={`+ ${formatCurrency(bonusValue)}`} />}
              {hasResale && canShowAdvancedTransferTerms && <SummaryLine label="Clause de revente" value={`${resalePercentage || 0}%`} />}
              <SummaryLine label="Montant total" value={formatCurrency(totalValue)} strong />

              {errorMessage && (
                <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {errorMessage}
                </p>
              )}

              {subscription && !subscription.canCreateOffer && (
                <div className="mt-4 rounded-lg border border-brand-purple/40 bg-brand-purple/10 p-4">
                  <p className="text-sm font-semibold text-white">Fonctionnalité Pro</p>
                  <p className="mt-1 text-sm text-white/65">
                    Vous avez atteint la limite du plan gratuit.
                  </p>
                  <Button type="button" className="mt-3 w-full" onClick={() => router.push('/subscription')}>
                    Passer à Club Pro
                  </Button>
                </div>
              )}

              <Button type="submit" className="mt-5 w-full" isLoading={isSubmitting} disabled={Boolean(subscription && !subscription.canCreateOffer)} icon={<Send className="h-4 w-4" />}>
                Envoyer l&apos;offre
              </Button>
              <Button type="button" variant="secondary" className="mt-3 w-full" onClick={() => router.push('/market/transfers')}>
                Annuler
              </Button>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#071722]/90 p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white">Historique de négociation</h2>
              <div className="mt-5 space-y-4">
                {history.length === 0 && (
                  <p className="text-sm text-white/60">Aucune offre envoyée pour le moment.</p>
                )}
                {history.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <TeamLogo name={item.clubName} logoUrl={item.clubLogoUrl} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate font-semibold text-white">{item.clubName}</p>
                        <p className="shrink-0 text-xs text-white/45">{formatHistoryDate(item.createdAt)}</p>
                      </div>
                      <p className="text-sm text-white/60">{item.summary}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </form>
    </div>
  )
}

function formatHistoryDate(value?: string | null): string {
  if (!value) {
    return ''
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default TransferNegotiationPage