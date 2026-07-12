'use client'

import React from 'react'
import { useAuth } from './AuthProvider'
import { MessageEventPayload, messagesManager } from '@/features/messages/messages'

interface MessagesUnreadContextValue {
  unreadConversationIds: Set<string>
  hasUnreadMessages: boolean
  markConversationRead: (conversationId: string) => void
  setActiveConversationId: (conversationId: string | null) => void
}

const MessagesUnreadContext = React.createContext<MessagesUnreadContextValue | null>(null)

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
    __INITIAL_MESSAGES_MERCURE__?: { hubUrl: string; topic: string } | null
  }
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

export function MessagesUnreadProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [unreadConversationIds, setUnreadConversationIds] = React.useState<Set<string>>(new Set())
  const activeConversationIdRef = React.useRef<string | null>(null)
  const initialMercureToken = getInitialWindowValue<{ hubUrl: string; topic: string } | null>('__INITIAL_MESSAGES_MERCURE__')

  const markConversationRead = React.useCallback((conversationId: string) => {
    setUnreadConversationIds((current) => {
      if (!current.has(conversationId)) return current

      const nextUnreadConversationIds = new Set(current)
      nextUnreadConversationIds.delete(conversationId)
      return nextUnreadConversationIds
    })
  }, [])

  const setActiveConversationId = React.useCallback((conversationId: string | null) => {
    activeConversationIdRef.current = conversationId

    if (conversationId) {
      markConversationRead(conversationId)
    }
  }, [markConversationRead])

  React.useEffect(() => {
    if (!user) {
      setUnreadConversationIds(new Set())
      activeConversationIdRef.current = null
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
        const payload = JSON.parse(event.data) as MessageEventPayload
        const conversationId = payload.message.conversationId

        if (
          !conversationId ||
          conversationId === activeConversationIdRef.current ||
          payload.message.sender?.id === user.id
        ) {
          return
        }

        setUnreadConversationIds((current) => {
          if (current.has(conversationId)) return current

          const nextUnreadConversationIds = new Set(current)
          nextUnreadConversationIds.add(conversationId)
          return nextUnreadConversationIds
        })
      }

      eventSource.addEventListener('message.created', handleEvent as EventListener)
      eventSource.onmessage = handleEvent
    }

    const cancelDeferredConnection = runAfterInitialPaint(() => {
      if (initialMercureToken !== undefined) {
        connect(initialMercureToken)
        return
      }

      messagesManager.prepareMercureSubscription()
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

  const value = React.useMemo<MessagesUnreadContextValue>(() => ({
    unreadConversationIds,
    hasUnreadMessages: unreadConversationIds.size > 0,
    markConversationRead,
    setActiveConversationId,
  }), [markConversationRead, setActiveConversationId, unreadConversationIds])

  return (
    <MessagesUnreadContext.Provider value={value}>
      {children}
    </MessagesUnreadContext.Provider>
  )
}

export function useMessagesUnread() {
  const context = React.useContext(MessagesUnreadContext)

  if (!context) {
    throw new Error('useMessagesUnread must be used within MessagesUnreadProvider')
  }

  return context
}
