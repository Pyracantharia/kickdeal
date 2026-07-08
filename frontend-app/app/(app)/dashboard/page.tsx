import AgentDashboardHome from '@/components/dashboard/AgentDashboardHome'
import ClubDashboardHome from '@/components/dashboard/ClubDashboardHome'
import type { User } from '@/context/AuthProvider'
import type { ClubDashboardHomeData, AgentDashboardHomeData } from '@/features/dashboard/dashboard'
import type { DirectConversation } from '@/features/messages/messages'
import type { PublicFeedPost } from '@/features/public-feed/publicFeed'
import { fetchApiJson, loadCurrentUser } from '@/features/server/appInitialData'

type PublicFeedResponse = {
  posts: PublicFeedPost[]
}

const IMPORTANT_FEED_TYPES = ['transfer_official', 'contract_signed', 'contract_renewal', 'loan']

type DashboardPayload = {
  user: User | null
  clubDashboard: ClubDashboardHomeData | null
  agentDashboard: AgentDashboardHomeData | null
  marketNews: PublicFeedPost[] | null
  recentConversations: DirectConversation[] | null
}

async function loadImportantMarketNews(limit = 3): Promise<PublicFeedPost[] | null> {
  const responses = await Promise.all(
    IMPORTANT_FEED_TYPES.map((type) => fetchApiJson<PublicFeedResponse>(`/public-feed?tab=official&limit=${limit}&type=${type}`)),
  )
  const successfulResponses = responses.filter((response): response is PublicFeedResponse => response !== null)

  if (successfulResponses.length === 0) {
    return null
  }

  const postsById = new Map<string, PublicFeedPost>()

  for (const response of successfulResponses) {
    for (const post of response.posts ?? []) {
      postsById.set(post.id, post)
    }
  }

  return Array.from(postsById.values())
    .sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime())
    .slice(0, limit)
}

async function loadDashboardPayload(): Promise<DashboardPayload> {
  const user = await loadCurrentUser()

  if (!user) {
    const publicFeedResponse = await loadImportantMarketNews()

    return {
      user: null,
      clubDashboard: null,
      agentDashboard: null,
      marketNews: publicFeedResponse,
      recentConversations: null,
    }
  }

  const isAgent = user.roles.includes('ROLE_AGENT') || user.roles.includes('ROLE_MANAGER')

  if (isAgent) {
    const [dashboardResponse, conversationsResponse] = await Promise.all([
      fetchApiJson<AgentDashboardHomeData>('/dashboard/agent'),
      fetchApiJson<{ conversations: DirectConversation[] }>('/messages/conversations'),
    ])

    return {
      user,
      clubDashboard: null,
      agentDashboard: dashboardResponse,
      marketNews: null,
      recentConversations: conversationsResponse?.conversations?.filter((conversation) => conversation.lastMessage).slice(0, 4) ?? null,
    }
  }

  const [dashboardResponse, publicFeedResponse] = await Promise.all([
    fetchApiJson<ClubDashboardHomeData>('/dashboard/home'),
    loadImportantMarketNews(),
  ])

  return {
    user,
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
      {payload.user?.roles.includes('ROLE_AGENT') || payload.user?.roles.includes('ROLE_MANAGER') ? (
        <AgentDashboardHome
          initialDashboard={payload.agentDashboard}
          initialRecentConversations={payload.recentConversations}
        />
      ) : (
        <ClubDashboardHome
          initialDashboard={payload.clubDashboard}
          initialMarketNews={payload.marketNews}
        />
      )}
    </>
  )
}
