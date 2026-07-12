'use client'

import { useAuth } from '@/context/AuthProvider'
import type { AgentDashboardHomeData } from '@/features/dashboard/dashboard'
import AgentDashboardHome from './AgentDashboardHome'
import ClubDashboardHome from './ClubDashboardHome'
import AdminDashboardHome from '@/components/admin/AdminDashboardHome'

interface DashboardHomeProps {
  initialUser?: {
    roles: string[]
  } | null
  initialClubDashboard?: import('@/features/dashboard/dashboard').ClubDashboardHomeData | null
  initialAgentDashboard?: AgentDashboardHomeData | null
  initialMarketNews?: import('@/features/public-feed/publicFeed').PublicFeedPost[] | null
  initialRecentConversations?: import('@/features/messages/messages').DirectConversation[] | null
}

function DashboardHome({
  initialUser,
  initialClubDashboard,
  initialAgentDashboard,
  initialMarketNews,
  initialRecentConversations,
}: DashboardHomeProps) {
  const { user } = useAuth()

  if (user?.roles.includes('ROLE_ADMIN')) {
    return <AdminDashboardHome />
  }

  if (user?.roles.includes('ROLE_AGENT')) {
    return <AgentDashboardHome />
  }

  return (
    <ClubDashboardHome
      initialDashboard={initialClubDashboard}
      initialMarketNews={initialMarketNews}
    />
  )
}

export default DashboardHome
