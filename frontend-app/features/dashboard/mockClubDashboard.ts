export interface ActiveDeal {
  id: string
  eventLabel: string
  eventDateLabel: string
  homeClub: string
  awayClub: string
  playerName: string
  status: string
  pendingOffersCount: number
  unreadMessagesCount: number
  pendingRenewalsCount: number
}

export interface TransferNewsItem {
  id: string
  source: string
  publishedAtLabel: string
  headline: string
  summary: string
}

export const MOCK_ACTIVE_DEAL: ActiveDeal = {
  id: 'deal-001',
  eventLabel: 'Deal transfert',
  eventDateLabel: '26 juil., 16:00',
  homeClub: 'Real Madrid',
  awayClub: 'Chelsea FC',
  playerName: 'Luka Modrić',
  status: 'Négociation en cours',
  pendingOffersCount: 2,
  unreadMessagesCount: 9,
  pendingRenewalsCount: 2,
}

export const MOCK_GLOBAL_TRANSFER_NEWS: TransferNewsItem[] = [
  {
    id: 'news-1',
    source: 'MERCATO GLOBAL',
    publishedAtLabel: "À l'instant",
    headline: 'OFFICIEL : Kylian Mbappé signe au Real Madrid jusqu’en 2029',
    summary:
      'Après plusieurs semaines de négociations, l’attaquant français rejoint officiellement le Real Madrid. Les clubs ont confirmé l’accord dans un communiqué.',
  },
  {
    id: 'news-2',
    source: 'MERCATO GLOBAL',
    publishedAtLabel: 'il y a 12 min',
    headline: 'OFFICIEL : Victor Osimhen rejoint le PSG pour un montant record',
    summary:
      'Paris boucle l’un des plus gros transferts de l’été avec un contrat longue durée et des bonus liés aux performances.',
  },
  {
    id: 'news-3',
    source: 'MERCATO GLOBAL',
    publishedAtLabel: 'il y a 34 min',
    headline: 'OFFICIEL : Florian Wirtz finalise son transfert à Manchester City',
    summary:
      'Le milieu allemand signe après des discussions avancées et la validation médicale. Le joueur doit rejoindre le stage de pré-saison immédiatement.',
  },
]

export function getDaysUntilNextTransferWindow(referenceDate = new Date()): number {
  const year = referenceDate.getFullYear()

  const januaryWindow = new Date(year, 0, 1)
  const julyWindow = new Date(year, 6, 1)

  const targets = [januaryWindow, julyWindow, new Date(year + 1, 0, 1)]
  const nextTarget = targets.find((target) => target.getTime() > referenceDate.getTime())

  if (!nextTarget) return 0

  const msPerDay = 1000 * 60 * 60 * 24
  return Math.ceil((nextTarget.getTime() - referenceDate.getTime()) / msPerDay)
}