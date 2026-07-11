'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRightLeft, ChevronUp, Clock3, Mail, Send } from 'lucide-react'

import Button from '@/components/ui/Button'
import ActionConfirmationModal from '@/components/ui/ActionConfirmationModal'
import StartConversationButton from '@/components/messages/StartConversationButton'
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
import { useNotifications } from '@/context/NotificationsProvider'
import type { ClubPlayer } from '@/features/club/types/roster'
import { formatCurrency, formatNumberInput, parseFormattedNumber, parseOptionalNumber } from '@/features/format/number'
import { transfersManager } from '@/features/market/transfers'
import type { OfferType, TransferNegotiationContext, TransferOfferPayload } from '@/features/market/types/transfer'
import { playersManager } from '@/features/players/players'
import { subscriptionManager, type SubscriptionSummary } from '@/features/subscription/subscription'
import { getPositionDisplayName } from '@/features/players/position'

type PaymentMode = 'single' | 'installments'

function TransferNegotiationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshSummary } = useNotifications()
  const listingId = searchParams.get('listingId') ?? undefined
  const offerId = searchParams.get('offerId') ?? undefined

  const [context, setContext] = useState<TransferNegotiationContext | null>(null)
  const [roster, setRoster] = useState<ClubPlayer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null)
  const [pendingOfferPayload, setPendingOfferPayload] = useState<TransferOfferPayload | null>(null)

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
  const [publicFeedEnabled, setPublicFeedEnabled] = useState(false)
  const [sellerClubInviteEmail, setSellerClubInviteEmail] = useState('')
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
        setPublicFeedEnabled(Boolean(nextContext.publicFeedEnabled ?? latestOffer?.publicFeedEnabled))
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
  const viewerBudgetValue = context?.viewerTeam.transferBudgetValue ?? null
  const remainingBudgetValue = null !== viewerBudgetValue ? viewerBudgetValue - totalValue : null
  const budgetUsagePercent = null !== viewerBudgetValue && viewerBudgetValue > 0
    ? Math.min(100, Math.max(0, (totalValue / viewerBudgetValue) * 100))
    : 0
  const isOverBudget = null !== remainingBudgetValue && remainingBudgetValue < 0
  const operationLabel = type === 'loan' ? 'Prêt' : type === 'exchange' ? 'Échange' : isSeller ? 'Vente' : 'Transfert définitif'
  const canShowAdvancedTransferTerms = type !== 'loan'
  const canPublishExistingOffer = publicFeedEnabled && !context?.publicFeedEnabled
  const sellerClubResolution = context?.sellerClubResolution
  const shouldPrepareSellerClubInvite = Boolean(
    sellerClubResolution?.requiresAction
    && sellerClubResolution.viewerRole === 'buyer'
    && !sellerClubResolution.invitationSent
    && !sellerClubResolution.externalContacted,
  )
  const isSameAsLatestOffer = context?.latestOffer
    ? isPayloadSameAsOffer(
      {
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
      },
      context.latestOffer,
    )
    : false

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
      publicFeedEnabled,
      message: message || undefined,
    }

    setPendingOfferPayload(payload)
  }

  const confirmSubmitOffer = async () => {
    if (!pendingOfferPayload) return

    setIsSubmitting(true)
    setErrorMessage(null)
    const finalPayload = {
      ...pendingOfferPayload,
      publicFeedEnabled,
    }

    try {
      const response = offerId
        ? await transfersManager.counterOffer(offerId, finalPayload)
        : await transfersManager.createOffer(finalPayload)

      if (!response.ok) {
        const errorData = response.data as { errorMessage?: unknown }
        setErrorMessage(typeof errorData.errorMessage === 'string' ? errorData.errorMessage : "Impossible d'envoyer l'offre.")
        return
      }

      const negociationId = response.data.offer.negociationId
      const inviteEmail = sellerClubInviteEmail.trim()
      if (!offerId && shouldPrepareSellerClubInvite && negociationId && inviteEmail) {
        const invitationResponse = await transfersManager.inviteSellerClub(negociationId, inviteEmail)
        if (!invitationResponse.ok) {
          setErrorMessage("L'offre a été envoyée, mais l'invitation au club vendeur n'a pas pu partir. Vous pourrez la relancer depuis la liste des offres.")
          setPendingOfferPayload(null)
          await refreshSummary()
          router.push('/market/transfers')
          return
        }
      }

      await refreshSummary()
      setPendingOfferPayload(null)
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
                <BudgetPreview
                  budget={viewerBudgetValue}
                  committed={totalValue}
                  remaining={remainingBudgetValue}
                  usagePercent={budgetUsagePercent}
                  isOverBudget={isOverBudget}
                />
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
                        {player.firstName} {player.lastName} - {getPositionDisplayName(player.position)}
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
              <div className={`mt-4 rounded-xl border p-4 ${isOverBudget ? 'border-red-400/45 bg-red-500/10' : 'border-brand-cyan/30 bg-brand-cyan/10'}`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Budget transfert restant</p>
                <p className={`mt-1 text-2xl font-bold ${isOverBudget ? 'text-red-200' : 'text-brand-cyan'}`}>
                  {null !== remainingBudgetValue ? formatCurrency(Math.max(remainingBudgetValue, 0)) : 'Non renseigné'}
                </p>
                <p className="mt-1 text-sm text-white/60">
                  {null !== viewerBudgetValue
                    ? `${formatCurrency(totalValue)} engagé sur ${formatCurrency(viewerBudgetValue)}`
                    : 'Aucun budget transfert défini pour votre club.'}
                </p>
              </div>
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

              {!offerId && shouldPrepareSellerClubInvite && (
                <div className="mt-5 rounded-xl border border-brand-cyan/40 bg-brand-cyan/10 p-4">
                  <div className="flex gap-3">
                    <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-brand-cyan" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white">Club vendeur non représenté</p>
                      <p className="mt-1 text-sm text-white/65">
                        {sellerClubResolution?.sellerTeamName ?? context.sellerTeam.name} n’a pas encore de gérant sur KickDeal.
                        Votre offre sera conservée, puis le club devra rejoindre la plateforme pour répondre.
                      </p>
                      <label className="mt-4 block">
                        <span className="text-xs font-semibold uppercase tracking-wide text-white/55">
                          Email d’un dirigeant du club
                        </span>
                        <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/15 bg-[#071722] px-3 py-2 focus-within:border-brand-cyan">
                          <Mail className="h-4 w-4 shrink-0 text-brand-cyan" />
                          <input
                            type="email"
                            value={sellerClubInviteEmail}
                            onChange={(event) => setSellerClubInviteEmail(event.target.value)}
                            placeholder="dirigeant@club.com"
                            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                          />
                        </div>
                      </label>
                      <p className="mt-2 text-xs text-white/45">
                        Optionnel : si vous le renseignez, l’invitation partira automatiquement après l’envoi de l’offre.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <StartConversationButton
                recipient={context.messageRecipient}
                className="mt-5 w-full"
                onError={(message) => setErrorMessage(message || null)}
              />

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

      <ActionConfirmationModal
        isOpen={!!pendingOfferPayload}
        title={offerId ? 'Confirmer la contre-offre' : 'Confirmer l’offre'}
        description="Vous êtes sur le point d’envoyer une proposition financière à un autre club. Vérifiez bien les montants et les conditions avant de continuer."
        confirmLabel={offerId ? 'Envoyer la contre-offre' : 'Envoyer l’offre'}
        isLoading={isSubmitting}
        items={[
          { label: 'Joueur', value: `${context.player.firstName} ${context.player.lastName}` },
          { label: 'Opération', value: operationLabel },
          { label: 'Montant garanti', value: formatCurrency(amountValue) },
          { label: 'Bonus potentiels', value: hasBonus && canShowAdvancedTransferTerms ? formatCurrency(bonusValue) : '-' },
          { label: 'Montant total', value: formatCurrency(totalValue) },
          { label: 'Paiement', value: type !== 'loan' && paymentMode === 'installments' ? `${paymentInstallments} versements` : 'Paiement comptant' },
          { label: 'Club concerné', value: counterparty?.name ?? '-' },
          { label: 'KickDeal Feed', value: publicFeedEnabled ? 'Publication autorisée' : 'Publication refusée' },
        ]}
        warning="Une offre envoyée entre dans l’historique de négociation et peut déclencher une décision du club adverse."
        confirmDisabled={isSameAsLatestOffer && !canPublishExistingOffer}
        onClose={() => setPendingOfferPayload(null)}
        onConfirm={() => void confirmSubmitOffer()}
      >
        {!offerId && shouldPrepareSellerClubInvite && (
          <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-4">
            <div className="flex gap-3">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" />
              <div className="min-w-0">
                <p className="font-semibold text-white">Réponse du club vendeur en attente</p>
                <p className="mt-1 text-sm text-white/65">
                  {sellerClubResolution?.sellerTeamName ?? context.sellerTeam.name} n’est pas encore représenté sur KickDeal.
                  {sellerClubInviteEmail.trim()
                    ? ` Une invitation sera envoyée à ${sellerClubInviteEmail.trim()} après l’offre.`
                    : ' Vous pourrez inviter un dirigeant après l’envoi de l’offre.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-brand-cyan/40 bg-brand-cyan/10 p-4">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-cyan">KickDeal Feed</p>
          <ToggleRow
            label="Publier cette offre sur l’application mobile"
            description="Si activé, l’offre sera visible publiquement dans À la une et Live. Si les clubs tombent d’accord, un post d’accord sera aussi publié."
            checked={publicFeedEnabled}
            onChange={setPublicFeedEnabled}
            tone="cyan"
          />
          {isSameAsLatestOffer && !canPublishExistingOffer && (
            <p className="mt-4 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
              Cette proposition est identique à la dernière offre. Modifiez un élément ou activez la publication KickDeal Feed pour continuer.
            </p>
          )}
        </div>
      </ActionConfirmationModal>
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

function BudgetPreview({
  budget,
  committed,
  remaining,
  usagePercent,
  isOverBudget,
}: {
  budget: number | null
  committed: number
  remaining: number | null
  usagePercent: number
  isOverBudget: boolean
}) {
  if (null === budget) {
    return (
      <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/55">
        Budget transfert non renseigné pour votre club.
      </div>
    )
  }

  return (
    <div className={`mt-3 rounded-xl border p-4 ${isOverBudget ? 'border-red-400/45 bg-red-500/10' : 'border-brand-cyan/30 bg-brand-cyan/10'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Budget disponible</p>
          <p className="mt-1 text-sm text-white/65">
            {formatCurrency(committed)} engagé sur {formatCurrency(budget)}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${isOverBudget ? 'text-red-200' : 'text-brand-cyan'}`}>
            {formatCurrency(Math.max(remaining ?? 0, 0))}
          </p>
          <p className="text-xs text-white/45">restant après offre</p>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${isOverBudget ? 'bg-red-400' : 'bg-brand-cyan'}`}
          style={{ width: `${usagePercent}%` }}
        />
      </div>
      {isOverBudget && (
        <p className="mt-3 text-sm font-semibold text-red-200">
          Cette offre dépasse votre budget de {formatCurrency(Math.abs(remaining ?? 0))}.
        </p>
      )}
    </div>
  )
}

function isPayloadSameAsOffer(
  payload: Omit<TransferOfferPayload, 'listingId'>,
  offer: TransferNegotiationContext['latestOffer'],
): boolean {
  if (!offer) return false

  return (
    payload.type === offer.type
    && normalizeNumber(payload.amount) === normalizeNumber(offer.amountValue)
    && normalizeNumber(payload.durationMonths) === normalizeNumber(offer.duration)
    && normalizeNumber(payload.paymentInstallments) === normalizeInstallments(offer.paymentStructure)
    && normalizeNumber(payload.performanceBonus) === normalizeNumber(offer.performanceBonusValue)
    && normalizeText(payload.performanceBonusCondition) === normalizeText(offer.performanceBonusCondition)
    && normalizeNumber(payload.resalePercentage) === normalizeNumber(offer.resalePercentageValue)
    && normalizeBoolean(payload.buyBackPriority) === normalizeBoolean(offer.buyBackPriority)
    && normalizeBoolean(payload.futureTransferPriority) === normalizeBoolean(offer.futureTransferPriority)
    && normalizeText(payload.message) === normalizeText(offer.customMessage)
  )
}

function normalizeNumber(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? ''
}

function normalizeBoolean(value: boolean | null | undefined): boolean {
  return value === true
}

function normalizeInstallments(paymentStructure?: string | null): number | null {
  if (!paymentStructure || paymentStructure === 'Paiement comptant') {
    return null
  }

  const match = paymentStructure.match(/\d+/)
  return match ? Number(match[0]) : null
}

export default TransferNegotiationPage
