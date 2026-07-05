import httpClient from '@/features/api'

export type NotificationCategory =
  | 'all'
  | 'unread'
  | 'actions'
  | 'messages'
  | 'market'
  | 'negotiations'
  | 'players'
  | 'admin'
  | 'account'
  | 'system'

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'danger'

export interface AppNotification {
  id: string
  type: string
  category: Exclude<NotificationCategory, 'all' | 'unread' | 'actions'>
  severity: NotificationSeverity
  title: string
  body?: string | null
  actionUrl?: string | null
  targetRoute?: string | null
  requiresAction: boolean
  isRead: boolean
  readAt?: string | null
  resolvedAt?: string | null
  sourceType?: string | null
  sourceId?: string | null
  metadata?: Record<string, unknown> | null
  createdAt?: string | null
  actor?: {
    id: string
    name: string
  } | null
}

export interface NotificationsSummary {
  unreadCount: number
  actionCounts: Record<string, number>
  unreadCounts: Record<string, number>
  hasUnread: boolean
  hasActions: boolean
}

export interface NotificationEventPayload {
  notification: AppNotification
  summary: NotificationsSummary
}

export interface NotificationsPagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

interface NotificationsResponse {
  notifications: AppNotification[]
  summary: NotificationsSummary
  pagination: NotificationsPagination
}

interface SummaryResponse {
  summary: NotificationsSummary
}

interface MercureTokenResponse {
  hubUrl: string
  topic: string
}

class NotificationsManager {
  async list(filter: NotificationCategory = 'all', page = 1, limit = 10) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    })

    if (filter !== 'all') {
      params.set('filter', filter)
    }

    return httpClient.get<NotificationsResponse>(`/notifications?${params.toString()}`)
  }

  async summary() {
    return httpClient.get<SummaryResponse>('/notifications/summary')
  }

  async markRead(notificationId: string) {
    return httpClient.put<NotificationEventPayload>(`/notifications/${notificationId}/read`, {})
  }

  async markAllRead() {
    return httpClient.post<SummaryResponse>('/notifications/read-all', {})
  }

  async prepareMercureSubscription() {
    return httpClient.get<MercureTokenResponse>('/notifications/mercure-token')
  }
}

export const notificationsManager = new NotificationsManager()

export function formatNotificationDate(value?: string | null): string {
  if (!value) return ''

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
