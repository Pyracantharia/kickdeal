import type { User } from '@/context/AuthProvider'
import type { NotificationsSummary } from '@/features/notifications/notifications'
import { cookies } from 'next/headers'
import { cache } from 'react'

const SERVER_BACKEND_URL = process.env.NEXT_SERVER_BACKEND_URL?.replace(/\/$/, '')
const API_URL = SERVER_BACKEND_URL
  ? `${SERVER_BACKEND_URL}/api`
  : process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'

async function getCookieHeader() {
  const cookieStore = await cookies()

  return cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ')
}

export async function fetchApiJson<T>(endpoint: string): Promise<T | null> {
  const cookieHeader = await getCookieHeader()

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        Accept: 'application/json',
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    return await response.json() as T
  } catch {
    return null
  }
}

export const loadCurrentUser = cache(async () => fetchApiJson<User>('/auth/me'))

export const loadNotificationsSummary = cache(async () => {
  const response = await fetchApiJson<{ summary: NotificationsSummary }>('/notifications/summary')

  return response?.summary ?? null
})
