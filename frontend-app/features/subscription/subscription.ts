import httpClient from '@/features/api'
import type { ChilizPlanType } from '@/features/payments/chiliz'

export type SubscriptionPlan = 'club_free' | 'club_pro' | 'club_enterprise' | 'agent_free' | 'agent_pro'
export type SubscriptionAudience = 'club' | 'agent'
export type SubscriptionTier = 'free' | 'pro' | 'enterprise'

export interface SubscriptionLimit {
  key: string
  label: string
  used?: number | null
  limit?: number | null
  remaining?: number | null
  unit?: string
  isLimited: boolean
  unlimited?: boolean
}

export interface SubscriptionSeats {
  used: number
  included: number | null
  unlimited: boolean
}

export interface SubscriptionSummary {
  audience: SubscriptionAudience
  plan: SubscriptionPlan
  planLabel: string
  tier: SubscriptionTier
  isPro: boolean
  seats?: SubscriptionSeats | null
  limits: SubscriptionLimit[]
  proBenefits: string[]
  canCreateOffer: boolean
  upgradeCta: string
  enterpriseCta?: string | null
  manageCta: string
}

export interface SubscriptionPlanCatalogItem {
  plan: SubscriptionPlan
  title: string
  priceCents: number
  currency: string
  billingPeriod: string
  description: string
  features: string[]
  seats?: number | null
  tier: SubscriptionTier
}

interface SubscriptionResponse {
  subscription: SubscriptionSummary
  plans?: SubscriptionPlanCatalogItem[]
}

interface ChilizPaymentVerificationResponse {
  payment: {
    id: string
    provider: 'chiliz'
    txHash: string
    planType: ChilizPlanType
    amountChz: string
    status: 'confirmed'
    confirmedAt?: string | null
  }
  subscription: SubscriptionSummary
}

interface StripeCheckoutResponse {
  clientSecret: string
  subscriptionId: string
}

class SubscriptionManager {
  async getPlans(audience: SubscriptionAudience) {
    return httpClient.get<{ plans: SubscriptionPlanCatalogItem[] }>(`/subscription/plans?audience=${audience}`)
  }

  async getCurrent() {
    return httpClient.get<SubscriptionResponse>('/subscription/me')
  }

  async simulateUpgrade(targetPlan?: SubscriptionPlan) {
    return httpClient.post<SubscriptionResponse, { targetPlan?: SubscriptionPlan }>('/subscription/simulate-upgrade', { targetPlan })
  }

  async verifyChilizPayment(payload: { txHash: string; planType: ChilizPlanType }) {
    return httpClient.post<ChilizPaymentVerificationResponse, typeof payload>('/subscription/payments/chiliz/verify', payload)
  }

  async startStripePayment(payload: { targetPlan: SubscriptionPlan }) {
    return httpClient.post<StripeCheckoutResponse, typeof payload>('/subscription/payments/stripe/start', payload)
  }

  async completeStripePayment(payload: { subscriptionId: string }) {
    return httpClient.post<SubscriptionResponse, typeof payload>('/subscription/payments/stripe/complete', payload)
  }
}

export const subscriptionManager = new SubscriptionManager()
