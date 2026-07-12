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

export type TransferWindowStatus =
  | {
      isOpen: true
      label: string
      daysRemaining: number
    }
  | {
      isOpen: false
      label: string
      daysUntilOpen: number
    }

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function daysBetween(from: Date, to: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24

  return Math.max(0, Math.ceil((startOfDay(to).getTime() - startOfDay(from).getTime()) / msPerDay))
}

function getTransferWindowsForYear(year: number) {
  return [
    {
      name: 'mercato hivernal',
      start: new Date(year, 0, 1),
      end: new Date(year, 1, 3),
    },
    {
      name: 'mercato estival',
      start: new Date(year, 5, 10),
      end: new Date(year, 7, 30),
    },
  ]
}

export function getTransferWindowStatus(referenceDate = new Date()): TransferWindowStatus {
  const year = referenceDate.getFullYear()
  const windows = [
    ...getTransferWindowsForYear(year - 1),
    ...getTransferWindowsForYear(year),
    ...getTransferWindowsForYear(year + 1),
  ]
  const currentWindow = windows.find(
    (window) => referenceDate >= window.start && referenceDate <= window.end,
  )

  if (currentWindow) {
    const daysRemaining = daysBetween(referenceDate, currentWindow.end)

    return {
      isOpen: true,
      daysRemaining,
      label: `Le ${currentWindow.name} actuel se termine dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`,
    }
  }

  const nextWindow = windows.find((window) => window.start > referenceDate) ?? getTransferWindowsForYear(year + 1)[0]
  const daysUntilOpen = daysBetween(referenceDate, nextWindow.start)

  return {
    isOpen: false,
    daysUntilOpen,
    label: `La prochaine fenêtre de mercato ouvre dans ${daysUntilOpen} jour${daysUntilOpen > 1 ? 's' : ''}`,
  }
}

export function getDaysUntilNextTransferWindow(referenceDate = new Date()): number {
  const status = getTransferWindowStatus(referenceDate)

  return status.isOpen ? status.daysRemaining : status.daysUntilOpen
}
