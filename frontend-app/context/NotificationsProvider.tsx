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

function runAfterInitialPaint(callback: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  let timeoutHandle: number | null = null

  const schedule = () => {
    timeoutHandle = window.setTimeout(callback, 2_500)
  }

  if (document.readyState === 'complete') {
    schedule()
  } else {
    window.addEventListener('load', schedule, { once: true })
  }

  return () => {
    window.removeEventListener('load', schedule)
    if (timeoutHandle !== null) {
      window.clearTimeout(timeoutHandle)
    }
  }
}

declare global {
  interface Window {
    __INITIAL_NOTIFICATIONS_SUMMARY__?: NotificationsSummary | null
    __INITIAL_NOTIFICATIONS_MERCURE__?: { hubUrl: string; topic: string } | null
  }
}

type NotificationsProviderProps = {
  children: React.ReactNode
  initialSummary?: NotificationsSummary | null
  initialMercureToken?: { hubUrl: string; topic: string } | null
}

function getInitialWindowValue<T>(key: keyof Window): T | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  if (!Object.prototype.hasOwnProperty.call(window, key)) {
    return undefined
  }

  return window[key] as T
}

export function NotificationsProvider({ children, initialSummary: initialSummaryProp, initialMercureToken: initialMercureTokenProp }: NotificationsProviderProps) {
  const { user } = useAuth()
  const initialSummary = initialSummaryProp !== undefined
    ? initialSummaryProp
    : getInitialWindowValue<NotificationsSummary | null>('__INITIAL_NOTIFICATIONS_SUMMARY__')
  const initialMercureToken = initialMercureTokenProp !== undefined
    ? initialMercureTokenProp
    : getInitialWindowValue<{ hubUrl: string; topic: string } | null>('__INITIAL_NOTIFICATIONS_MERCURE__')
  const hasInitialSummary = initialSummary !== undefined
  const [summary, setSummary] = React.useState<NotificationsSummary>(initialSummary ?? EMPTY_SUMMARY)
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
    if (hasInitialSummary) {
      return
    }

    void refreshSummary()
  }, [hasInitialSummary, refreshSummary])

  React.useEffect(() => {
    if (!user) {
      setSummary(EMPTY_SUMMARY)
      setLatestNotification(null)
      return
    }

    let eventSource: EventSource | null = null
    let isActive = true

    const connect = (token: { hubUrl: string; topic: string } | null | undefined) => {
      if (!isActive || !token?.hubUrl || !token.topic) return

      const url = new URL(token.hubUrl)
      url.searchParams.append('topic', token.topic)
      eventSource = new EventSource(url.toString(), { withCredentials: true })

      const handleEvent = (event: MessageEvent<string>) => {
        const payload = JSON.parse(event.data) as NotificationEventPayload
        setLatestNotification(payload.notification)
        setSummary(payload.summary)
      }

      eventSource.addEventListener('notification.created', handleEvent as EventListener)
      eventSource.onmessage = handleEvent
    }

    const cancelDeferredConnection = runAfterInitialPaint(() => {
      if (initialMercureToken !== undefined) {
        connect(initialMercureToken)
        return
      }

      notificationsManager.prepareMercureSubscription()
        .then((response) => {
          if (!isActive || !response.ok) return

          connect(response.data)
        })
        .catch(() => undefined)
    })

    return () => {
      isActive = false
      cancelDeferredConnection()
      eventSource?.close()
    }
  }, [initialMercureToken, user])

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
