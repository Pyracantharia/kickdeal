import { ArrowRight } from 'lucide-react'
import { APP_ROUTES } from '@/lib/config'
import LinkButton from '@/components/ui/LinkButton'

const STATS = [
  { value: '350+', label: 'Clubs actifs' },
  { value: '1.2k+', label: 'Transferts' },
  { value: '98%', label: 'Satisfaction' },
]

function HeroSection() {
  return (
    <section className="hero-bg relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16">
      <div className="mb-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-cyan">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan animate-pulse" />
          Plateforme n°1 des transferts professionnels
        </span>
      </div>

      <h1 className="text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold uppercase tracking-wider text-white max-w-4xl leading-tight">
        Révolutionnez vos{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-purple">
          transferts
        </span>
      </h1>

      <p className="mt-6 max-w-2xl text-center text-base sm:text-lg text-white leading-relaxed">
        La plateforme de transferts footballistiques nouvelle génération. Clubs et agents
        licenciés, négociez, gérez et finalisez vos transferts en toute sécurité.
      </p>

      <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
        <LinkButton href={APP_ROUTES.register} icon={<ArrowRight className="h-4 w-4" />}>
          Commencer gratuitement
        </LinkButton>
      </div>

      <div className="mt-16 grid grid-cols-3 gap-4 sm:gap-8 w-full max-w-lg">
        {STATS.map(({ value, label }) => (
          <div key={label} className="stat-card rounded-xl px-4 py-5 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-purple">
              {value}
            </p>
            <p className="mt-1 text-[11px] sm:text-xs font-medium uppercase tracking-wider text-white/70">
              {label}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default HeroSection