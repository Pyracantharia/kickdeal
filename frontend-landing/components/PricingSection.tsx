'use client'

import { useState } from 'react'
import { Check, ArrowRight } from 'lucide-react'
import { APP_ROUTES } from '@/lib/config'
import LinkButton, { type LinkButtonVariant } from '@/components/ui/LinkButton'

type PricingAudience = 'club' | 'agent'

interface PlanProps {
  name: string
  price: string
  period?: string
  description?: string
  features: string[]
  cta: string
  href: string
  highlighted?: boolean
  variant: LinkButtonVariant
}

const PRICING_PLANS: Record<PricingAudience, PlanProps[]> = {
  club: [
    {
      name: 'Club Free',
      price: 'Gratuit',
      description: 'Découvrir le marché',
      features: [
        '1 utilisateur',
        'Consulter les joueurs et clubs',
        'Faire une première offre / première approche',
        'Accès limité aux négociations',
        'Idéal pour tester KickDeal',
      ],
      cta: 'Commencer gratuitement',
      href: APP_ROUTES.register,
      variant: 'outline',
    },
    {
      name: 'Club Pro',
      price: '200 €',
      period: '/mois',
      features: [
        '3 utilisateurs inclus',
        'Négociations illimitées',
        'Gestion complète de l’effectif',
        'Offres et contre-offres illimitées',
        'Génération de PDF d’accord',
        'Historique avancé',
        'Multi-utilisateurs club',
        'Notifications et messagerie avancées',
        'Accès aux futures options premium',
      ],
      cta: 'Passer au Pro',
      href: `${APP_ROUTES.register}?plan=club-pro`,
      highlighted: true,
      variant: 'cyan',
    },
    {
      name: 'Club Enterprise',
      price: '400 €',
      period: '/mois',
      features: [
        'Utilisateurs illimités',
        'Permissions avancées',
        'Analytics avancés',
        'Support prioritaire',
        'Négociations illimitées',
        'Génération de PDF d’accord',
        'Accès aux futures options premium',
      ],
      cta: 'Passer à Enterprise',
      href: `${APP_ROUTES.register}?plan=club-enterprise`,
      variant: 'purple',
    },
  ],
  agent: [
    {
      name: 'Agent Free',
      price: 'Gratuit',
      features: [
        'Créer son profil agent',
        'Répondre aux sollicitations des clubs',
        'Participer aux négociations contractuelles entrantes',
        'Gérer un nombre limité de joueurs',
        'Idéal pour rejoindre une négociation existante',
      ],
      cta: 'Commencer gratuitement',
      href: APP_ROUTES.register,
      variant: 'outline',
    },
    {
      name: 'Agent Pro',
      price: '49 €',
      period: '/mois',
      features: [
        'Proposer activement ses joueurs aux clubs',
        'Mettre des joueurs sur le marché',
        'Contacter directement les clubs',
        'Joueurs représentés illimités',
        'Génération de PDF contractuels',
        'Historique avancé',
        'Visibilité renforcée sur la plateforme',
      ],
      cta: 'Passer au Pro',
      href: `${APP_ROUTES.register}?plan=agent-pro`,
      highlighted: true,
      variant: 'purple',
    },
  ],
}

function PricingSection() {
  const [audience, setAudience] = useState<PricingAudience>('club')
  const plans = PRICING_PLANS[audience]

  return (
    <section id="tarifs" className="py-20 sm:py-28 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-wider text-white">
            Tarifs transparents
          </h2>
          <p className="mt-4 text-white text-sm sm:text-base max-w-2xl mx-auto">
            Commencez gratuitement. Passez au premium quand vous êtes prêt.
          </p>
          <div className="mt-8 inline-flex rounded-full border border-white/15 bg-white/[0.04] p-1">
            {(['club', 'agent'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setAudience(item)}
                className={`rounded-full px-5 py-2 text-sm font-bold uppercase tracking-wider transition-colors ${
                  audience === item
                    ? 'bg-brand-cyan text-dark-900'
                    : 'text-white/65 hover:text-white'
                }`}
              >
                {item === 'club' ? 'Club' : 'Agent'}
              </button>
            ))}
          </div>
        </div>

        <div className={`grid grid-cols-1 gap-6 mx-auto ${
          audience === 'club' ? 'md:grid-cols-3 max-w-6xl' : 'md:grid-cols-2 max-w-4xl'
        }`}>
          {plans.map((plan) => (
            <PricingCard key={plan.name} {...plan} />
          ))}
        </div>
      </div>
    </section>
  )
}

function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  href,
  highlighted,
  variant,
}: PlanProps) {
  const borderColor =
    variant === 'cyan'
      ? 'border-brand-cyan/40'
      : variant === 'purple'
        ? 'border-brand-purple/40'
        : 'border-white/10'

  const bgColor = highlighted ? 'bg-brand-cyan/[0.05]' : 'bg-white/[0.03]'

  const checkColor = variant === 'cyan' ? 'text-brand-cyan' : variant === 'purple' ? 'text-brand-purple' : 'text-white/60'

  return (
    <div
      className={`relative rounded-2xl border ${borderColor} ${bgColor} p-6 sm:p-8 flex flex-col`}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-brand-cyan px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-dark-900">
            Populaire
          </span>
        </div>
      )}

      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-2">
          {name}
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-white">{price}</span>
          {period && <span className="text-sm text-white/60">{period}</span>}
        </div>
        {description && (
          <p className="mt-3 text-sm font-medium text-white/70">{description}</p>
        )}
      </div>

      <ul className="space-y-3 flex-1 mb-8">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <Check className={`h-4 w-4 mt-0.5 shrink-0 ${checkColor}`} />
            <span className="text-sm text-white">{feature}</span>
          </li>
        ))}
      </ul>

      <LinkButton href={href} variant={variant} icon={<ArrowRight className="h-4 w-4" />} className="w-full">
        {cta}
      </LinkButton>
    </div>
  )
}

export default PricingSection
