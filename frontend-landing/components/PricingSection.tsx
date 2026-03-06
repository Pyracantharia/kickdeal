import { Check, ArrowRight } from 'lucide-react'
import { APP_ROUTES } from '@/lib/config'
import LinkButton, { type LinkButtonVariant } from '@/components/ui/LinkButton'

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

const PLANS: PlanProps[] = [
  {
    name: 'Gratuit',
    price: '0€',
    description: '',
    features: [
      'Accès au marché (consultation)',
      '3 négociations / mois',
      'Dashboard basique',
      'Support email',
    ],
    cta: 'Commencer',
    href: APP_ROUTES.register,
    variant: 'outline',
  },
  {
    name: 'Pro',
    price: '99€',
    period: '/mois',
    features: [
      'Négociations illimitées',
      'Statistiques avancées / Analyses IA',
      'Source d\'effectif complète',
      'Notifications temps réel',
      'Support prioritaire',
      'Export PDF',
    ],
    cta: 'Choisir Pro',
    href: `${APP_ROUTES.register}?plan=pro`,
    highlighted: true,
    variant: 'cyan',
  },
  {
    name: 'Enterprise',
    price: 'Sur mesure',
    features: [
      'Tout du pack Pro',
      'API publique',
      'Multi-clubs',
      'Formation sur plateforme',
      'SLA garanti',
      'Manager dédié',
    ],
    cta: 'Nous contacter',
    href: '/contact',
    variant: 'purple',
  },
]

function PricingSection() {
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
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
