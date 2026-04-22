'use client'

import { useAuth } from '@/context/AuthProvider'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode, useEffect } from 'react'

const CLUB_SETUP_PATHS = ['/club', '/club/create', '/club/joined']

function isClubSetupPath(pathname: string): boolean {
  return CLUB_SETUP_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

function AppAccessGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const mustCompleteClubSetup =
    !isLoading &&
    user?.roles.includes('ROLE_CLUB') &&
    !user.hasClubAccess &&
    !isClubSetupPath(pathname)

  useEffect(() => {
    if (mustCompleteClubSetup) {
      router.replace('/club')
    }
  }, [mustCompleteClubSetup, router])

  if (isLoading || mustCompleteClubSetup) {
    return <div className="auth-bg min-h-screen w-full" />
  }

  return children
}

export default AppAccessGuard
