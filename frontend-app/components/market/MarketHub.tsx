'use client'

import React from 'react'
import { History, Search, ArrowRightLeft, MessageSquare } from 'lucide-react'
import Link from 'next/link'

import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useAuth } from '@/context/AuthProvider'

interface MarketCard {
  id: string
  title: string
  subtitle?: string
  icon: React.ReactNode
  description: string
  buttonLabel: string
  href: string
}

const MARKET_CARDS: MarketCard[] = [
  {
    id: 'search-players',
    title: 'Rechercher joueur',
    subtitle: undefined,
    icon: <Search className="h-16 w-16" />,
    description: 'Recherchez des joueurs à ajouter à votre club ou à votre liste de transferts',
    buttonLabel: 'Rechercher joueur',
    href: '/market/search',
  },
  {
    id: 'transfers-home',
    title: 'Accueil transferts',
    subtitle: 'Offres recues',
    icon: <ArrowRightLeft className="h-16 w-16" />,
    description:
      'Vous n\'avez pas encore reçu d\'offre. Vous pouvez ajouter des joueurs à la liste des transferts à partir de la recherche de joueurs',
    buttonLabel: 'Accueil transferts',
    href: '/market/transfers',
  },
  {
    id: 'transfer-history',
    title: 'Historique',
    subtitle: 'Accords trouvés',
    icon: <History className="h-16 w-16" />,
    description: 'Retrouvez les transferts acceptés et les montants négociés par votre club',
    buttonLabel: 'Voir l’historique',
    href: '/market/transfers/history',
  },
  {
    id: 'messaging',
    title: 'Messagerie',
    subtitle: undefined,
    icon: <MessageSquare className="h-16 w-16" />,
    description: 'Consultez vos messages',
    buttonLabel: 'Messagerie',
    href: '/notifications',
  },
]

const AGENT_MARKET_CARDS: MarketCard[] = [
  {
    id: 'search-clubs',
    title: 'Rechercher un club',
    icon: <ArrowRightLeft className="h-16 w-16" />,
    description: 'Choisissez un joueur de votre portefeuille puis explorez les clubs les plus compatibles.',
    buttonLabel: 'Trouver un club',
    href: '/market/clubs',
  },
  {
    id: 'search-players-agent',
    title: 'Rechercher un joueur',
    icon: <Search className="h-16 w-16" />,
    description: 'Lancez une recherche de joueurs afin de les ajouter à votre liste de joueurs gérés.',
    buttonLabel: 'Ajouter un joueur',
    href: '/mes-joueurs?add=1',
  },
]

function MarketHub() {
  const { user } = useAuth()
  const isAgent = Boolean(user?.roles.includes('ROLE_AGENT'))
  const cards = isAgent ? AGENT_MARKET_CARDS : MARKET_CARDS

  return (
    <div className="auth-bg min-h-screen w-full pt-36 md:pt-40 pb-12 px-4">
      <div className="mx-auto w-full max-w-6xl">
        <div className={`grid grid-cols-1 gap-6 lg:gap-8 ${isAgent ? 'md:grid-cols-2' : 'md:grid-cols-4'}`}>
          {cards.map((card, index) => (
            <MarketCard key={card.id} card={card} colorIndex={index} />
          ))}
        </div>
      </div>
    </div>
  )
}

function MarketCard({
  card,
  colorIndex,
}: {
  card: MarketCard
  colorIndex: number
}) {
  const colors = ['purple', 'cyan', 'purple', 'cyan'] as const
  const color = colors[colorIndex % colors.length]

  return (
    <div className="flex flex-col items-center">
      <Card
        color={color}
        baseGradient={false}
        className={`w-full max-w-[360px] h-[420px] text-white px-6 py-8 flex flex-col bg-linear-to-b ${
          color === 'purple'
            ? 'from-brand-purple/35 from-0% to-transparent to-90%'
            : 'from-brand-cyan/35 from-0% to-transparent to-90%'
        }`}
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">{card.title}</h2>
          {card.subtitle && (
            <p
              className={`mt-1 text-lg font-semibold ${
                color === 'purple' ? 'text-brand-purple' : 'text-brand-cyan'
              }`}
            >
              {card.subtitle}
            </p>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className={color === 'purple' ? 'text-brand-purple' : 'text-brand-cyan'}>
            {card.icon}
          </div>
          <p className="text-white/90 text-center text-sm leading-relaxed">
            {card.description}
          </p>
        </div>
      </Card>

      <Link href={card.href} className="w-full max-w-[360px] mt-6">
        <Button className="w-full" type="button">
          {card.buttonLabel}
        </Button>
      </Link>
    </div>
  )
}

export default MarketHub
