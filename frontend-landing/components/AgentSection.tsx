import { APP_ROUTES } from '@/lib/config'
import LinkButton from '@/components/ui/LinkButton'
import {
  ArrowRight,
  Briefcase,
  Bell,
  BarChart3,
  MessageSquare,
  Globe2,
  Clock,
} from 'lucide-react'

const AGENT_FEATURES = [
  { icon: Briefcase, text: 'Portefeuille de joueurs centralisé' },
  { icon: Bell, text: 'Notifications en temps réel sur les offres' },
  { icon: BarChart3, text: 'Historique complet des négociations' },
  { icon: MessageSquare, text: 'Communication directe avec les clubs' },
  { icon: Globe2, text: 'Guide de valorisation de joueurs' },
  { icon: Clock, text: 'Accès au marché complet 24/7' },
]

const MOCK_PLAYERS = [
  { name: 'Carlos Roberto', position: 'Milieu offensif', flag: '🇧🇷' },
  { name: 'Jean Delacroix', position: 'Défenseur central', flag: '🇫🇷' },
  { name: 'Pascal Adrien', position: 'Attaquant', flag: '🇫🇷' },
]

const AVATAR_COLORS = [
  'bg-purple-600',
  'bg-cyan-600',
  'bg-blue-600',
]

function AgentSection() {
  return (
    <section id="agents" className="py-20 sm:py-28 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="order-2 lg:order-1 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <div className="space-y-4">
              {MOCK_PLAYERS.map(({ name, position, flag }, i) => (
                <div
                  key={name}
                  className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-brand-purple/30 transition-colors"
                >
                  <div
                    className={`h-12 w-12 rounded-full ${AVATAR_COLORS[i]} flex items-center justify-center text-white font-bold text-lg shrink-0`}
                  >
                    {name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{name}</p>
                    <p className="text-xs text-white/70">{position}</p>
                  </div>
                  <span className="text-xl" aria-label={`Drapeau`}>
                    {flag}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-purple/30 bg-brand-purple/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-purple mb-6">
              Pour les agents
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-wider text-white leading-tight">
              Boostez votre activité d&apos;agent
            </h2>
            <p className="mt-4 text-white text-sm sm:text-base leading-relaxed max-w-lg">
              Gérez tous vos joueurs depuis un dashboard unique. Multipliez les opportunités et finalisez vos deals plus rapidement.
            </p>

            <ul className="mt-8 space-y-3">
              {AGENT_FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <div className="rounded-lg bg-brand-purple/10 p-1.5 shrink-0">
                    <Icon className="h-4 w-4 text-brand-purple" />
                  </div>
                  <span className="text-sm text-white">{text}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <LinkButton href={APP_ROUTES.registerManager} variant="purple" icon={<ArrowRight className="h-4 w-4" />}>
                Devenir agent
              </LinkButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AgentSection
