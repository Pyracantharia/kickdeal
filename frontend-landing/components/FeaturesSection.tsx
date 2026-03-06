import {
  Search,
  Handshake,
  Users,
  BarChart3,
  Shield,
  Bell,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Search,
    title: 'Recherche avancée',
    description:
      'Filtrez par genre, pays, nationalité, contrat. Trouvez le joueur idéal en quelques clics.',
  },
  {
    icon: Handshake,
    title: 'Négociation intégrée',
    description:
      'Centralisez vos offres, ajustez termes et montant. Négociez directement sur la plateforme.',
  },
  {
    icon: Users,
    title: "Gestion d'effectif",
    description:
      'Tableau complet format FIFA. Gérez vos joueurs, contrats et dates de fin facilement.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Stats',
    description:
      'Accédez aux KPIs, budgets, données avancées. Prenez les meilleures décisions avec des données fiables.',
  },
  {
    icon: Shield,
    title: 'Sécurité totale',
    description:
      'Vérification des clubs, validation administrative. Garantissez la crédibilité des transactions.',
  },
  {
    icon: Bell,
    title: 'Temps réel',
    description:
      'Notifications push, alertes personnalisées. Ne manquez plus aucune opportunité de transfert.',
  },
]

function FeaturesSection() {
  return (
    <section id="fonctionnalites" className="py-20 sm:py-28 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-wider text-white">
            Tout ce dont vous avez besoin
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-brand-cyan/30 hover:bg-brand-cyan/[0.03] transition-all duration-300">
              <div className="rounded-xl bg-brand-cyan/10 p-3 w-fit mb-4 group-hover:bg-brand-cyan/15 transition-colors">
                <Icon className="h-6 w-6 text-brand-cyan" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wide mb-2">
                {title}
              </h3>
              <p className="text-sm text-white leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection