import { ArrowRight } from 'lucide-react'
import { APP_ROUTES } from '@/lib/config'
import LinkButton from '@/components/ui/LinkButton'

function CtaSection() {
  return (
    <section className="py-20 sm:py-28 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/20 via-brand-purple/10 to-brand-purple/20" />
          <div className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm" />

          <div className="relative px-6 py-16 sm:px-12 sm:py-20 text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-wider text-white leading-tight">
              Prêt à révolutionner vos{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-purple">
                transferts
              </span>{' '}
              ?
            </h2>

            <p className="mt-4 text-white text-sm sm:text-base max-w-xl mx-auto">
              Rejoignez les 350+ clubs et agents qui utilisent déjà KickDeal pour simplifier leurs transferts.
            </p>

            <div className="home-cta mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <LinkButton href={APP_ROUTES.register} icon={<ArrowRight className="h-4 w-4" />}>
                Commencer maintenant
              </LinkButton>
            </div>

            <p className="mt-4 text-xs text-white/60">
              Aucune carte de crédit requise · Plateforme réservée aux clubs et agents vérifiés
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CtaSection