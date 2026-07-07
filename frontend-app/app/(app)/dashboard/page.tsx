import DashboardHome from '@/components/dashboard/DashboardHome'
import type { User } from '@/context/AuthProvider'
import type { ClubDashboardHomeData, AgentDashboardHomeData } from '@/features/dashboard/dashboard'
import type { DirectConversation } from '@/features/messages/messages'
import type { NotificationsSummary } from '@/features/notifications/notifications'
import type { PublicFeedPost } from '@/features/public-feed/publicFeed'
import { cookies } from 'next/headers'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'

type MercureToken = {
  hubUrl: string
  topic: string
}

type PublicFeedResponse = {
  posts: PublicFeedPost[]
}

const IMPORTANT_FEED_TYPES = ['transfer_official', 'contract_signed', 'contract_renewal', 'loan']

type DashboardPayload = {
  user: User | null
  notificationsSummary: NotificationsSummary | null
  notificationsMercure: MercureToken | null
  messagesMercure: MercureToken | null
  clubDashboard: ClubDashboardHomeData | null
  agentDashboard: AgentDashboardHomeData | null
  marketNews: PublicFeedPost[] | null
  recentConversations: DirectConversation[] | null
}

async function fetchJson<T>(endpoint: string, cookieHeader: string): Promise<T | null> {
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

async function loadImportantMarketNews(cookieHeader: string, limit = 3): Promise<PublicFeedPost[] | null> {
  const responses = await Promise.all(
    IMPORTANT_FEED_TYPES.map((type) => fetchJson<PublicFeedResponse>(`/public-feed?tab=official&limit=${limit}&type=${type}`, cookieHeader)),
  )

  const postsById = new Map<string, PublicFeedPost>()

  for (const response of responses) {
    for (const post of response?.posts ?? []) {
      postsById.set(post.id, post)
    }
  }

  return Array.from(postsById.values())
    .sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime())
    .slice(0, limit)
}

async function getCookieHeader() {
  const cookieStore = await cookies()

  return cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ')
}

function serializeInitialData(payload: DashboardPayload): string {
  return JSON.stringify(payload).replace(/</g, '\\u003c')
}

async function loadDashboardPayload(): Promise<DashboardPayload> {
  const cookieHeader = await getCookieHeader()

  const [user, notificationsSummary, notificationsMercure, messagesMercure, publicFeedResponse] = await Promise.all([
    fetchJson<User>('/auth/me', cookieHeader),
    fetchJson<{ summary: NotificationsSummary }>('/notifications/summary', cookieHeader),
    fetchJson<MercureToken>('/notifications/mercure-token', cookieHeader),
    fetchJson<MercureToken>('/messages/mercure-token', cookieHeader),
    loadImportantMarketNews(cookieHeader),
  ])

  if (!user) {
    return {
      user: null,
      notificationsSummary: notificationsSummary?.summary ?? null,
      notificationsMercure,
      messagesMercure,
      clubDashboard: null,
      agentDashboard: null,
      marketNews: publicFeedResponse,
      recentConversations: null,
    }
  }

  const isAgent = user.roles.includes('ROLE_AGENT') || user.roles.includes('ROLE_MANAGER')

  if (isAgent) {
    const [dashboardResponse, conversationsResponse] = await Promise.all([
      fetchJson<AgentDashboardHomeData>('/dashboard/agent', cookieHeader),
      fetchJson<{ conversations: DirectConversation[] }>('/messages/conversations', cookieHeader),
    ])

    return {
      user,
      notificationsSummary: notificationsSummary?.summary ?? null,
      notificationsMercure,
      messagesMercure,
      clubDashboard: null,
      agentDashboard: dashboardResponse,
      marketNews: null,
      recentConversations: conversationsResponse?.conversations?.filter((conversation) => conversation.lastMessage).slice(0, 4) ?? null,
    }
  }

  const dashboardResponse = await fetchJson<ClubDashboardHomeData>('/dashboard/home', cookieHeader)

  return {
    user,
    notificationsSummary: notificationsSummary?.summary ?? null,
    notificationsMercure,
    messagesMercure,
    clubDashboard: dashboardResponse,
    agentDashboard: null,
    marketNews: publicFeedResponse,
    recentConversations: null,
  }
}

export default async function DashboardPage() {
  const payload = await loadDashboardPayload()

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__INITIAL_AUTH_USER__ = ${JSON.stringify(payload.user).replace(/</g, '\\u003c')};\nwindow.__INITIAL_NOTIFICATIONS_SUMMARY__ = ${JSON.stringify(payload.notificationsSummary).replace(/</g, '\\u003c')};\nwindow.__INITIAL_NOTIFICATIONS_MERCURE__ = ${JSON.stringify(payload.notificationsMercure).replace(/</g, '\\u003c')};\nwindow.__INITIAL_MESSAGES_MERCURE__ = ${JSON.stringify(payload.messagesMercure).replace(/</g, '\\u003c')};`,
        }}
      />
      <DashboardHome
        initialUser={payload.user}
        initialClubDashboard={payload.clubDashboard}
        initialAgentDashboard={payload.agentDashboard}
        initialMarketNews={payload.marketNews}
        initialRecentConversations={payload.recentConversations}
      />
    </>
  )
}
