import { APP_ROUTES } from '@/lib/config'
import LinkButton from '@/components/ui/LinkButton'
import {
  ArrowRight,
  BarChart3,
  Globe2,
  Shield,
  Users,
  FileText,
  TrendingUp,
} from 'lucide-react'

const CLUB_FEATURES = [
  { icon: BarChart3, text: 'Tableau de bord complet avec KPIs financiers' },
  { icon: Globe2, text: 'Gestion d\'effectif format FIFA/EA Sports' },
  { icon: Shield, text: 'Suivi des offres reçues et données' },
  { icon: TrendingUp, text: 'Historique de négociation détaillée' },
  { icon: FileText, text: 'Création de joueurs (centre de formation)' },
  { icon: Users, text: 'Export PDF et rapports automatiques' },
]

function ClubSection() {
  return (
    <section id="clubs" className="section-blue py-20 sm:py-28 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-cyan mb-6">
              Pour les clubs
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-wider text-white leading-tight">
              Gérez votre club comme un pro
            </h2>
            <p className="mt-4 text-white text-sm sm:text-base leading-relaxed max-w-lg">
              Recrutement, ventes, prêts, négociations. Tout est centralisé pour vous faire gagner un temps précieux.
            </p>

            <ul className="mt-8 space-y-3">
              {CLUB_FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <div className="rounded-lg bg-brand-cyan/10 p-1.5 shrink-0">
                    <Icon className="h-4 w-4 text-brand-cyan" />
                  </div>
                  <span className="text-sm text-white">{text}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <LinkButton href={APP_ROUTES.registerClub} icon={<ArrowRight className="h-4 w-4" />}>
                Créer mon club
              </LinkButton>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs text-white/60 uppercase tracking-wider">Budget transfert</p>
                <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-purple">
                  180.0 M€
                </p>
              </div>
              <div className="rounded-lg bg-brand-cyan/10 p-2">
                <TrendingUp className="h-5 w-5 text-brand-cyan" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <DashboardStat label="Joueurs" value="24" color="cyan" />
              <DashboardStat label="Négociations" value="12" color="purple" />
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-xs text-white/60 uppercase tracking-wider mb-2">
                Valeur totale de l&apos;effectif
              </p>
              <p className="text-2xl font-bold text-white">2,847</p>
              <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-cyan to-brand-purple"
                  style={{ width: '72%' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function DashboardStat({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: 'cyan' | 'purple'
}) {
  const borderColor = color === 'cyan' ? 'border-brand-cyan/20' : 'border-brand-purple/20'
  const textColor = color === 'cyan' ? 'text-brand-cyan' : 'text-brand-purple'

  return (
    <div className={`rounded-xl border ${borderColor} bg-white/[0.02] p-4`}>
      <p className="text-xs text-white/60 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
    </div>
  )
}

export default ClubSection