'use client'

import React from 'react'
import { Check } from 'lucide-react'

import type { SubscriptionPlan } from '@/features/subscription/subscription'

interface PlanOption {
  plan: SubscriptionPlan
  name: string
  price: string
  seats?: string
  features: string[]
}

interface PlanSelectionProps {
  audience: 'club' | 'agent'
  selectedPlan: SubscriptionPlan
  onChange: (plan: SubscriptionPlan) => void
}

const CLUB_PLANS: PlanOption[] = [
  {
    plan: 'club_free',
    name: 'Club Free',
    price: 'Gratuit',
    seats: '1 utilisateur',
    features: ['Découverte du marché', '1 offre gratuite', 'Accès limité aux négociations'],
  },
  {
    plan: 'club_pro',
    name: 'Club Pro',
    price: '200 €/mois',
    seats: '3 utilisateurs inclus',
    features: ['Négociations illimitées', 'PDF officiels', 'Gestion effectif complète'],
  },
  {
    plan: 'club_enterprise',
    name: 'Club Enterprise',
    price: '400 €/mois',
    seats: 'Utilisateurs illimités',
    features: ['Permissions avancées', 'Analytics avancés', 'Support prioritaire'],
  },
]

const AGENT_PLANS: PlanOption[] = [
  {
    plan: 'agent_free',
    name: 'Agent Free',
    price: 'Gratuit',
    features: ['Profil agent', 'Négociations entrantes', 'Joueurs représentés limités'],
  },
  {
    plan: 'agent_pro',
    name: 'Agent Pro',
    price: '49 €/mois',
    features: ['Contacter les clubs', 'Mettre des joueurs sur le marché', 'Visibilité renforcée'],
  },
]

function PlanSelection({ audience, selectedPlan, onChange }: PlanSelectionProps) {
  const plans = audience === 'club' ? CLUB_PLANS : AGENT_PLANS

  return (
    <section>
      <h2 className="mb-2 text-xl font-semibold">Choix du plan</h2>
      <p className="mb-4 text-sm text-gray-300">
        Vous pouvez rester sur le plan gratuit. Pour un plan payant, vous choisirez ensuite votre moyen de paiement sécurisé.
      </p>

      <div className={`grid gap-3 ${audience === 'club' ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.plan

          return (
            <button
              key={plan.plan}
              type="button"
              onClick={() => onChange(plan.plan)}
              className={`plan-selection-choice rounded-xl border p-4 text-left transition-all ${
                isSelected
                  ? 'border-brand-cyan bg-brand-cyan/10 shadow-lg shadow-brand-cyan/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-white">{plan.name}</p>
                  <p className="mt-1 text-lg font-bold text-brand-cyan">{plan.price}</p>
                  {plan.seats && <p className="mt-1 text-xs font-semibold text-white/70">{plan.seats}</p>}
                </div>
                {isSelected && <Check className="h-5 w-5 shrink-0 text-brand-cyan" />}
              </div>

              <ul className="mt-4 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-xs text-gray-300">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-cyan" />
                    {feature}
                  </li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default PlanSelection
