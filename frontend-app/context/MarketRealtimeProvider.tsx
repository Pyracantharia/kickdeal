'use client'

import React from 'react'

import { useAuth } from '@/context/AuthProvider'
import { transfersManager } from '@/features/market/transfers'

export const MARKET_REALTIME_EVENT = 'kickdeal:market-updated'

export interface MarketRealtimePayload {
  type: string
  payload?: {
    domain?: 'transfer' | 'contract'
    offerId?: string | null
    negotiationId?: string | null
    playerId?: string | null
    targetRoute?: string | null
  }
  occurredAt?: string
}

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

export function MarketRealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  React.useEffect(() => {
    if (!user) {
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
        const payload = JSON.parse(event.data) as MarketRealtimePayload
        window.dispatchEvent(new CustomEvent<MarketRealtimePayload>(MARKET_REALTIME_EVENT, {
          detail: payload,
        }))
      }

      eventSource.addEventListener('market.updated', handleEvent as EventListener)
      eventSource.onmessage = handleEvent
    }

    const cancelDeferredConnection = runAfterInitialPaint(() => {
      transfersManager.prepareMercureSubscription()
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
  }, [user])

  return children
}
