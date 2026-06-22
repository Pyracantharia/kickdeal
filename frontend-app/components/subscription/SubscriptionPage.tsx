'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, Crown, Lock, Zap } from 'lucide-react'

import Button from '@/components/ui/Button'
import { useAuth } from '@/context/AuthProvider'
import StripeCheckout from '@/components/subscription/StripeCheckout'
import { getChilizPaymentConfig, payWithChiliz, type ChilizPlanType } from '@/features/payments/chiliz'
import {
  subscriptionManager,
  type SubscriptionPlan,
  type SubscriptionSummary,
} from '@/features/subscription/subscription'

const CLUB_FREE_FEATURES = [
  '1 utilisateur',
  '1 offre / approche gratuite',
  'Nombre limité de négociations actives',
  'Accès limité aux PDFs',
  'Gestion d’effectif limitée',
]

const CLUB_PRO_FEATURES = [
  '3 utilisateurs inclus',
  'Négociations illimitées',
  'Gestion effectif complète',
  'PDF officiels',
  'Historique complet',
  'Multi-utilisateurs',
]

const CLUB_ENTERPRISE_FEATURES = [
  'Utilisateurs illimités',
  'Permissions avancées',
  'Analytics avancés',
  'Support prioritaire',
  'Négociations illimitées',
  'PDF officiels',
]

const AGENT_FREE_FEATURES = [
  'Profil agent',
  'Réponses aux sollicitations entrantes',
  'Négociations contractuelles entrantes',
  'Nombre limité de joueurs représentés',
]

const AGENT_PRO_FEATURES = [
  'Proposition active de joueurs',
  'Mise sur le marché',
  'Contacts directs avec les clubs',
  'Joueurs représentés illimités',
  'Visibilité renforcée',
]

const CLUB_PLANS: PlanConfig[] = [
  {
    plan: 'club_free',
    title: 'Club Free',
    price: 'Gratuit',
    features: CLUB_FREE_FEATURES,
    seatsLabel: '1 utilisateur',
  },
  {
    plan: 'club_pro',
    title: 'Club Pro',
    price: '200 €/mois',
    features: CLUB_PRO_FEATURES,
    seatsLabel: '3 utilisateurs inclus',
    highlighted: true,
  },
  {
    plan: 'club_enterprise',
    title: 'Club Enterprise',
    price: '400 €/mois',
    features: CLUB_ENTERPRISE_FEATURES,
    seatsLabel: 'Utilisateurs illimités',
    highlighted: true,
  },
]

const AGENT_PLANS: PlanConfig[] = [
  {
    plan: 'agent_free',
    title: 'Agent Free',
    price: 'Gratuit',
    features: AGENT_FREE_FEATURES,
  },
  {
    plan: 'agent_pro',
    title: 'Agent Pro',
    price: '49 €/mois',
    features: AGENT_PRO_FEATURES,
    highlighted: true,
  },
]

interface PlanConfig {
  plan: SubscriptionPlan
  title: string
  price: string
  features: string[]
  seatsLabel?: string
  highlighted?: boolean
}

function SubscriptionPage() {
  const { user, updateUser } = useAuth()
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [paymentPlan, setPaymentPlan] = useState<SubscriptionPlan | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [upgradeAnimation, setUpgradeAnimation] = useState<{ from: string; to: string } | null>(null)
  const [stripeCheckout, setStripeCheckout] = useState<{ clientSecret: string; subscriptionId: string; plan: SubscriptionPlan } | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadSubscription() {
      try {
        const response = await subscriptionManager.getCurrent()

        if (isMounted && response.ok) {
          setSubscription(response.data.subscription)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadSubscription()

    return () => {
      isMounted = false
    }
  }, [])

  const audience = subscription?.audience ?? (user?.roles.includes('ROLE_AGENT') ? 'agent' : 'club')
  const isPaid = subscription?.isPro ?? false
  const isEnterprise = subscription?.plan === 'club_enterprise'
  const plans = audience === 'agent' ? AGENT_PLANS : CLUB_PLANS
  const recommendedPlan = audience === 'agent' ? AGENT_PLANS[1] : isPaid ? CLUB_PLANS[2] : CLUB_PLANS[1]
  const freeLabel = audience === 'agent' ? 'Agent Free' : 'Club Free'

  const planLabel = useMemo(() => {
    if (subscription?.planLabel) {
      return subscription.planLabel
    }

    if (user?.subscriptionPlan === 'agent_pro') return 'Agent Pro'
    if (user?.subscriptionPlan === 'club_pro') return 'Club Pro'
    if (user?.subscriptionPlan === 'club_enterprise') return 'Club Enterprise'
    return freeLabel
  }, [freeLabel, subscription?.planLabel, user?.subscriptionPlan])

  async function handleChilizPayment(targetPlan: SubscriptionPlan) {
    const planType = getChilizPlanType(targetPlan)
    if (!planType) return

    setIsUpgrading(true)
    setPaymentPlan(targetPlan)
    setNotice(null)
    setPaymentStatus('Connexion au wallet MetaMask...')

    try {
      setPaymentStatus('Vérification du réseau Chiliz Spicy Testnet...')
      const txHash = await payWithChiliz(planType, () => {
        setPaymentStatus('Transaction envoyée. Attente de confirmation sur Chiliz Spicy Testnet...')
      })
      setPaymentStatus('Transaction confirmée. Validation blockchain côté KickDeal...')
      const response = await subscriptionManager.verifyChilizPayment({ txHash, planType })

      if (!response.ok) {
        const data = response.data as { errorMessage?: unknown }
        throw new Error(typeof data.errorMessage === 'string' ? data.errorMessage : 'Erreur de paiement CHZ.')
      }

      const previousPlanLabel = planLabel
      setSubscription(response.data.subscription)
      updateUser(user ? { ...user, subscriptionPlan: response.data.subscription.plan } : user)
      setUpgradeAnimation({ from: previousPlanLabel, to: response.data.subscription.planLabel })
      window.setTimeout(() => setUpgradeAnimation(null), 2600)
      setNotice('Paiement CHZ confirmé. Votre abonnement est activé.')
    } catch (error) {
      setNotice(getPaymentErrorMessage(error))
    } finally {
      setPaymentStatus(null)
      setPaymentPlan(null)
      setIsUpgrading(false)
    }
  }

  async function handleStripePayment(targetPlan: SubscriptionPlan) {
    setIsUpgrading(true)
    setPaymentPlan(targetPlan)
    setNotice(null)

    try {
      const response = await subscriptionManager.startStripePayment({ targetPlan })
      if (!response.ok) {
        const data = response.data as { errorMessage?: unknown }
        throw new Error(typeof data.errorMessage === 'string' ? data.errorMessage : 'Impossible de préparer le paiement Stripe.')
      }
      setStripeCheckout({ ...response.data, plan: targetPlan })
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Impossible de préparer le paiement Stripe.')
    } finally {
      setPaymentPlan(null)
      setIsUpgrading(false)
    }
  }

  async function completeStripePayment() {
    if (!stripeCheckout) return

    const response = await subscriptionManager.completeStripePayment({ subscriptionId: stripeCheckout.subscriptionId })
    if (!response.ok) {
      const data = response.data as { errorMessage?: unknown }
      throw new Error(typeof data.errorMessage === 'string' ? data.errorMessage : 'Paiement confirmé, activation en cours.')
    }

    const previousPlanLabel = planLabel
    setSubscription(response.data.subscription)
    updateUser(user ? { ...user, subscriptionPlan: response.data.subscription.plan } : user)
    setUpgradeAnimation({ from: previousPlanLabel, to: response.data.subscription.planLabel })
    window.setTimeout(() => setUpgradeAnimation(null), 2600)
    setNotice('Paiement Stripe confirmé. Votre abonnement est activé.')
    setStripeCheckout(null)
  }

  const seatsText = formatSeats(subscription)
  const chilizConfig = getChilizPaymentConfig()

  if (isLoading) {
    return (
      <div className="auth-bg min-h-screen w-full px-4 pb-12 pt-28">
        <div className="mx-auto w-full max-w-6xl text-white/70">Chargement de l’abonnement...</div>
      </div>
    )
  }

  return (
    <div className="auth-bg min-h-screen w-full px-4 pb-16 pt-28">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8 border-b border-white/10 pb-6">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-cyan">Abonnement</p>
          <h1 className="mt-2 text-4xl font-bold uppercase tracking-wide text-white md:text-5xl">
            Plan KickDeal
          </h1>
          <p className="mt-3 max-w-2xl text-white/65">
            Démarrez gratuitement, puis débloquez les négociations et outils avancés quand votre activité s’accélère.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-2xl border border-brand-cyan/25 bg-[#071722]/88 p-6 shadow-2xl shadow-brand-cyan/10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-white/55">Plan actuel</p>
                <h2 className="mt-2 text-3xl font-bold text-white">{planLabel}</h2>
                <p className="mt-2 text-white/65">
                  {isPaid ? 'Abonnement actif. Accès complet activé.' : 'Votre compte gratuit reste actif sans paiement.'}
                </p>
                {seatsText && (
                  <p className="mt-3 text-sm font-semibold text-brand-cyan">{seatsText}</p>
                )}
              </div>
              <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold uppercase ${
                isEnterprise
                  ? 'border-brand-cyan/50 bg-brand-purple/25 text-white'
                  : isPaid
                  ? 'border-brand-purple/50 bg-brand-purple/20 text-white'
                  : 'border-brand-cyan/45 bg-brand-cyan/10 text-brand-cyan'
              }`}>
                {isPaid ? <Crown className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                {isEnterprise ? 'Enterprise' : isPaid ? 'Pro' : 'Free'}
              </span>
            </div>

            {(subscription?.limits ?? []).length > 0 && (
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {(subscription?.limits ?? []).map((limit) => (
                  <div key={limit.key} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-semibold text-white">{limit.label}</p>
                    <p className="mt-2 text-2xl font-bold text-brand-cyan">
                      {limit.unlimited
                        ? 'Illimité'
                        : limit.isLimited && typeof limit.remaining === 'number'
                        ? `${Math.max(limit.remaining, 0)} restant`
                        : 'Inclus'}
                    </p>
                    {limit.isLimited && !limit.unlimited && (
                      <p className="mt-1 text-xs text-white/55">
                        {limit.used ?? 0} utilisé{(limit.used ?? 0) > 1 ? 's' : ''} sur {limit.limit}
                      </p>
                    )}
                    {limit.unlimited && typeof limit.used === 'number' && (
                      <p className="mt-1 text-xs text-white/55">{limit.used} membres utilisés · illimité</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {notice && (
              <p className="mt-6 rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 px-4 py-3 text-sm text-white" role="status">
                {notice}
              </p>
            )}

            {paymentStatus && (
              <p className="mt-6 rounded-lg border border-brand-purple/40 bg-brand-purple/10 px-4 py-3 text-sm text-white" role="status">
                {paymentStatus}
              </p>
            )}

          </div>

          <aside className="rounded-2xl border-2 border-brand-purple/55 bg-[#111827]/90 p-6 shadow-2xl shadow-brand-purple/15">
            <Lock className="h-8 w-8 text-brand-purple" />
            <h2 className="mt-4 text-2xl font-bold text-white">
              {isPaid ? 'Accès complet activé' : 'Pourquoi passer au Pro ?'}
            </h2>
            <ul className="mt-5 space-y-3">
              {recommendedPlan.features.map((feature) => (
                <li key={feature} className="flex gap-3 text-sm text-white">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" />
                  {feature}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-white/55">Carte sécurisée par Stripe ou paiement CHZ sur Chiliz Spicy Testnet (1 CHZ = {chilizConfig.chzEurRate} €).</p>
          </aside>
        </section>

        <section className={`mt-8 grid gap-6 ${
          audience === 'club' ? 'lg:grid-cols-3' : 'md:grid-cols-2'
        }`}>
          {plans.map((plan) => (
            <PlanColumn
              key={plan.plan}
              title={plan.title}
              price={plan.price}
              features={plan.features}
              seatsLabel={plan.seatsLabel}
              active={subscription?.plan === plan.plan || (!subscription && plan.plan.endsWith('_free'))}
              highlighted={plan.highlighted}
              isLoading={isUpgrading && paymentPlan === plan.plan}
              paymentLabel={getStripePaymentLabel(plan.plan)}
              onSelect={canPayWithStripe(subscription?.plan, plan.plan) ? () => handleStripePayment(plan.plan) : undefined}
              secondaryPaymentLabel={getChilizPaymentLabel(plan.plan)}
              onSecondarySelect={canPayWithChiliz(subscription?.plan, plan.plan) ? () => handleChilizPayment(plan.plan) : undefined}
            />
          ))}
        </section>
      </div>

      {upgradeAnimation && (
        <UpgradeAnimationOverlay from={upgradeAnimation.from} to={upgradeAnimation.to} />
      )}
      {stripeCheckout && (
        <StripeCheckout
          clientSecret={stripeCheckout.clientSecret}
          planLabel={plans.find((plan) => plan.plan === stripeCheckout.plan)?.title ?? 'Abonnement KickDeal'}
          onComplete={completeStripePayment}
          onClose={() => setStripeCheckout(null)}
        />
      )}
    </div>
  )
}

function UpgradeAnimationOverlay({ from, to }: { from: string; to: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020712]/75 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-brand-cyan/35 bg-[#071722] p-6 shadow-2xl shadow-brand-cyan/20">
        <p className="text-center text-sm font-bold uppercase tracking-widest text-brand-cyan">Abonnement activé</p>
        <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="animate-pulse rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-xs uppercase text-white/45">Avant</p>
            <p className="mt-2 text-xl font-bold text-white/75">{from}</p>
          </div>
          <div className="flex h-11 w-11 animate-pulse items-center justify-center rounded-full border border-brand-purple/50 bg-brand-purple/20 text-brand-purple">
            <ArrowRight className="h-5 w-5" />
          </div>
          <div className="scale-105 rounded-xl border border-brand-cyan/45 bg-brand-cyan/10 p-4 text-center shadow-lg shadow-brand-cyan/10 transition-transform">
            <p className="text-xs uppercase text-brand-cyan">Maintenant</p>
            <p className="mt-2 text-xl font-bold text-white">{to}</p>
          </div>
        </div>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-full origin-left animate-pulse rounded-full bg-gradient-to-r from-brand-cyan to-brand-purple" />
        </div>
      </div>
    </div>
  )
}

function PlanColumn({
  title,
  price,
  features,
  seatsLabel,
  active,
  highlighted = false,
  isLoading = false,
  paymentLabel,
  onSelect,
  secondaryPaymentLabel,
  onSecondarySelect,
}: {
  title: string
  price: string
  features: string[]
  seatsLabel?: string
  active: boolean
  highlighted?: boolean
  isLoading?: boolean
  paymentLabel?: string
  onSelect?: () => void
  secondaryPaymentLabel?: string
  onSecondarySelect?: () => void
}) {
  return (
    <div className={`rounded-2xl border p-6 shadow-2xl ${
      highlighted
        ? 'border-brand-purple/45 bg-[#121a2a] shadow-brand-purple/10'
        : 'border-white/15 bg-[#0c1a25] shadow-black/20'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <p className="mt-1 text-white/60">{price}</p>
          {seatsLabel && <p className="mt-2 text-sm font-semibold text-brand-cyan">{seatsLabel}</p>}
        </div>
        {active && (
          <span className="rounded-full bg-brand-cyan px-3 py-1 text-xs font-bold uppercase text-[#071722]">
            Actuel
          </span>
        )}
      </div>
      <ul className="mt-5 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex gap-3 text-sm text-white/80">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" />
            {feature}
          </li>
        ))}
      </ul>
      {onSelect && (
        <Button type="button" className="mt-6 w-full" variant={highlighted ? 'primary' : 'secondary'} isLoading={isLoading} onClick={onSelect}>
          {paymentLabel ?? 'Choisir ce plan'}
        </Button>
      )}
      {onSecondarySelect && (
        <Button type="button" className="mt-3 w-full" variant="secondary" isLoading={isLoading} onClick={onSecondarySelect}>
          {secondaryPaymentLabel}
        </Button>
      )}
    </div>
  )
}

function formatSeats(subscription: SubscriptionSummary | null): string | null {
  if (!subscription?.seats) {
    return null
  }

  if (subscription.seats.unlimited) {
    return `${subscription.seats.used} membres utilisés · illimité`
  }

  return `${subscription.seats.used} / ${subscription.seats.included ?? 0} utilisé`
}

function canUpgradeTo(currentPlan: SubscriptionPlan | undefined, targetPlan: SubscriptionPlan): boolean {
  if (!currentPlan || currentPlan === targetPlan) {
    return false
  }

  return getPlanRank(targetPlan) > getPlanRank(currentPlan)
}

function getStripePaymentLabel(plan: SubscriptionPlan): string | undefined {
  return plan.endsWith('_pro') || plan === 'club_enterprise' ? 'Payer par carte' : undefined
}

function canPayWithStripe(currentPlan: SubscriptionPlan | undefined, targetPlan: SubscriptionPlan): boolean {
  return canUpgradeTo(currentPlan, targetPlan) && getStripePaymentLabel(targetPlan) !== undefined
}

function getChilizPlanType(plan: SubscriptionPlan): ChilizPlanType | null {
  if (plan === 'agent_pro') return 'AGENT_PRO'
  if (plan === 'club_pro') return 'PRO'
  if (plan === 'club_enterprise') return 'ENTERPRISE'
  return null
}

function getChilizPaymentLabel(plan: SubscriptionPlan): string | undefined {
  const type = getChilizPlanType(plan)
  return type ? `Payer en CHZ (${type === 'ENTERPRISE' ? '2' : '1'} CHZ)` : undefined
}

function canPayWithChiliz(currentPlan: SubscriptionPlan | undefined, targetPlan: SubscriptionPlan): boolean {
  return canUpgradeTo(currentPlan, targetPlan) && getChilizPlanType(targetPlan) !== null
}

function getPaymentErrorMessage(error: unknown): string {
  const paymentError = error as { code?: number | string; message?: string; shortMessage?: string }
  const message = `${paymentError.shortMessage ?? ''} ${paymentError.message ?? ''}`.toLowerCase()

  if (paymentError.code === 4001 || paymentError.code === 'ACTION_REJECTED' || message.includes('user rejected')) {
    return 'Paiement annulé. Aucune transaction n’a été envoyée.'
  }
  if (message.includes('insufficient funds')) {
    return 'Solde CHZ insuffisant pour finaliser cette transaction.'
  }
  return error instanceof Error && error.message ? error.message : 'Le paiement CHZ n’a pas pu être finalisé.'
}

function getPlanRank(plan: SubscriptionPlan): number {
  return {
    agent_free: 0,
    agent_pro: 1,
    club_free: 0,
    club_pro: 1,
    club_enterprise: 2,
  }[plan]
}

export default SubscriptionPage
