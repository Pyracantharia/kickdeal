'use client'

import React from 'react'

import { useAuth } from '@/context/AuthProvider'
import {
  AppNotification,
  NotificationEventPayload,
  NotificationsSummary,
  notificationsManager,
} from '@/features/notifications/notifications'

interface NotificationsContextValue {
  summary: NotificationsSummary
  latestNotification: AppNotification | null
  unreadCount: number
  actionCounts: Record<string, number>
  unreadCounts: Record<string, number>
  hasUnreadNotifications: boolean
  getActionCount: (route: string) => number
  getUnreadCount: (route: string) => number
  refreshSummary: () => Promise<void>
  markAllRead: () => Promise<void>
}

const EMPTY_SUMMARY: NotificationsSummary = {
  unreadCount: 0,
  actionCounts: {},
  unreadCounts: {},
  hasUnread: false,
  hasActions: false,
}

const NotificationsContext = React.createContext<NotificationsContextValue | null>(null)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [summary, setSummary] = React.useState<NotificationsSummary>(EMPTY_SUMMARY)
  const [latestNotification, setLatestNotification] = React.useState<AppNotification | null>(null)

  const refreshSummary = React.useCallback(async () => {
    if (!user) {
      setSummary(EMPTY_SUMMARY)
      return
    }

    const response = await notificationsManager.summary()
    if (response.ok) {
      setSummary(response.data.summary)
    }
  }, [user])

  const markAllRead = React.useCallback(async () => {
    const response = await notificationsManager.markAllRead()
    if (response.ok) {
      setSummary(response.data.summary)
    }
  }, [])

  const getActionCount = React.useCallback((route: string) => {
    return summary.actionCounts[route] ?? 0
  }, [summary.actionCounts])

  const getUnreadCount = React.useCallback((route: string) => {
    return summary.unreadCounts[route] ?? 0
  }, [summary.unreadCounts])

  React.useEffect(() => {
    void refreshSummary()
  }, [refreshSummary])

  React.useEffect(() => {
    if (!user) {
      setSummary(EMPTY_SUMMARY)
      setLatestNotification(null)
      return
    }

    let eventSource: EventSource | null = null
    let isActive = true

    notificationsManager.prepareMercureSubscription()
      .then((response) => {
        if (!isActive || !response.ok || !response.data.hubUrl || !response.data.topic) return

        const url = new URL(response.data.hubUrl)
        url.searchParams.append('topic', response.data.topic)
        eventSource = new EventSource(url.toString(), { withCredentials: true })

        const handleEvent = (event: MessageEvent<string>) => {
          const payload = JSON.parse(event.data) as NotificationEventPayload
          setLatestNotification(payload.notification)
          setSummary(payload.summary)
        }

        eventSource.addEventListener('notification.created', handleEvent as EventListener)
        eventSource.onmessage = handleEvent
      })
      .catch(() => undefined)

    return () => {
      isActive = false
      eventSource?.close()
    }
  }, [user])

  const value = React.useMemo<NotificationsContextValue>(() => ({
    summary,
    latestNotification,
    unreadCount: summary.unreadCount,
    actionCounts: summary.actionCounts,
    unreadCounts: summary.unreadCounts,
    hasUnreadNotifications: summary.hasUnread,
    getActionCount,
    getUnreadCount,
    refreshSummary,
    markAllRead,
  }), [getActionCount, getUnreadCount, latestNotification, markAllRead, refreshSummary, summary])

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = React.useContext(NotificationsContext)

  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider')
  }

  return context
}
