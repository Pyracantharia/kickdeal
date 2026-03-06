import {
  X,
  Check,
  FileSearch,
  Clock,
  AlertTriangle,
  BarChart3,
  Shield,
  Zap,
  Users,
  Globe2,
} from 'lucide-react'

const BEFORE_ITEMS = [
  { icon: FileSearch, text: 'Emails et appels interminables' },
  { icon: AlertTriangle, text: 'Négociations confuses et désorganisées' },
  { icon: Clock, text: 'Perte de temps sur les étapes administratives' },
  { icon: BarChart3, text: 'Pas de visibilité sur les données du marché' },
  { icon: Globe2, text: 'Manque de visibilité sur le marché' },
]

const AFTER_ITEMS = [
  { icon: Shield, text: 'Tout centralisé sur une seule plateforme' },
  { icon: Zap, text: 'Négociations structurées et professionnelles' },
  { icon: Clock, text: 'Automatisation des tâches administratives' },
  { icon: Users, text: 'Gain de temps via des outils avancés disponibles' },
  { icon: Globe2, text: 'Accès instantané à tous les joueurs disponibles' },
]

function BeforeAfterSection() {
  return (
    <section className="section-dark py-20 sm:py-28 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-wider text-white">
            Fini les transferts compliqués
          </h2>
          <p className="mt-4 text-white text-sm sm:text-base max-w-2xl mx-auto">
            KickDeal simplifie chaque étape du processus de transfert
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-6">
              Avant KickDeal
            </p>
            <ul className="space-y-4">
              {BEFORE_ITEMS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-red-500/10 p-1.5 shrink-0">
                    <X className="h-3.5 w-3.5 text-red-400" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-white/40 shrink-0" />
                    <span className="text-sm text-white">{text}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-brand-cyan/20 bg-brand-cyan/[0.03] p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-cyan mb-6">
              Avec KickDeal
            </p>
            <ul className="space-y-4">
              {AFTER_ITEMS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-brand-cyan/10 p-1.5 shrink-0">
                    <Check className="h-3.5 w-3.5 text-brand-cyan" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-brand-cyan/60 shrink-0" />
                    <span className="text-sm text-white">{text}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export default BeforeAfterSection