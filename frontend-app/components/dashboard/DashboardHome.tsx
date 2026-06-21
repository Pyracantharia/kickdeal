'use client'

import { useAuth } from '@/context/AuthProvider'
import AgentDashboardHome from './AgentDashboardHome'
import ClubDashboardHome from './ClubDashboardHome'

function DashboardHome() {
  const { user } = useAuth()

  if (user?.roles.includes('ROLE_AGENT')) {
    return <AgentDashboardHome />
  }

  return <ClubDashboardHome />
}

export default DashboardHome
