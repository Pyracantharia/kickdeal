export interface InboxItem {
  id: string
  senderName: string
  subject: string
  dateLabel: string
  isUnread: boolean
}

export interface AgentChatItem {
  id: string
  agentName: string
  lastMessage: string
  dateLabel: string
  isUnread: boolean
}

export interface NotificationFeed<T> {
  totalCount: number
  unreadCount: number
  items: T[]
}

export const MOCK_INBOX_FEED: NotificationFeed<InboxItem> = {
  totalCount: 9,
  unreadCount: 2,
  items: [
    {
      id: 'inbox-1',
      senderName: 'John Doe',
      subject: 'Offre pour Kylian Mbappé',
      dateLabel: '13 juin',
      isUnread: true,
    },
    {
      id: 'inbox-2',
      senderName: 'John Doe',
      subject: 'Offre pour Kylian Mbappé',
      dateLabel: '13 juin',
      isUnread: true,
    },
    {
      id: 'inbox-3',
      senderName: 'John Doe',
      subject: 'Offre pour Kylian Mbappé',
      dateLabel: '13 juin',
      isUnread: false,
    },
    {
      id: 'inbox-4',
      senderName: 'John Doe',
      subject: 'Offre pour Kylian Mbappé',
      dateLabel: '13 juin',
      isUnread: false,
    },
    {
      id: 'inbox-5',
      senderName: 'John Doe',
      subject: 'Mise à jour du dossier transfert',
      dateLabel: '12 juin',
      isUnread: false,
    },
  ],
}

export const MOCK_AGENT_CHAT_FEED: NotificationFeed<AgentChatItem> = {
  totalCount: 7,
  unreadCount: 3,
  items: [
    {
      id: 'chat-1',
      agentName: 'John Doe',
      lastMessage: 'Offre pour Kylian Mbappé',
      dateLabel: '13 juin',
      isUnread: true,
    },
    {
      id: 'chat-2',
      agentName: 'John Doe',
      lastMessage: 'Offre pour Kylian Mbappé',
      dateLabel: '13 juin',
      isUnread: true,
    },
    {
      id: 'chat-3',
      agentName: 'John Doe',
      lastMessage: 'Offre pour Kylian Mbappé',
      dateLabel: '13 juin',
      isUnread: true,
    },
    {
      id: 'chat-4',
      agentName: 'John Doe',
      lastMessage: 'Relance sur les conditions salariales',
      dateLabel: '12 juin',
      isUnread: false,
    },
  ],
}

export function getVisibleItems<T>(items: T[], maxItems = 4): T[] {
  return items.slice(0, maxItems)
}