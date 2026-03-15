import httpClient from '@/features/api'

import type { AgentChatItem, InboxItem, NotificationFeed } from './mockNotifications'

class NotificationsManager {
  async getInboxFeed() {
    // TODO: connect backend endpoint when available
    return httpClient.get<NotificationFeed<InboxItem>>('/notifications/inbox')
  }

  async getAgentChatFeed() {
    // TODO: connect backend endpoint when available
    return httpClient.get<NotificationFeed<AgentChatItem>>('/notifications/agent-chat')
  }
}

export const notificationsManager = new NotificationsManager()