'use client'

import { clubManager } from '@/features/club/club'
import { useAuth } from '@/context/AuthProvider'
import { authManager } from '@/features/auth/auth'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'

const CLUB_SETUP_PATHS = ['/club', '/club/create', '/club/joined', '/club/pending']

function isClubSetupPath(pathname: string): boolean {
  return CLUB_SETUP_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

function AppAccessGuard({ children }: { children: ReactNode }) {
  const { user, isLoading, updateUser } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [hasActiveClubRequest, setHasActiveClubRequest] = useState<boolean | null>(null)

  const isUnauthenticated = !isLoading && !user

  const shouldCheckClubAccess =
    !isLoading &&
    user?.roles.includes('ROLE_CLUB') &&
    !user.hasClubAccess

  const mustCompleteClubSetup =
    shouldCheckClubAccess &&
    !isClubSetupPath(pathname)

  const mustStayOnPending =
    shouldCheckClubAccess &&
    hasActiveClubRequest === true &&
    pathname !== '/club/pending'

  const mustChangeExpiredPassword =
    !isLoading &&
    Boolean(user?.passwordExpired) &&
    pathname !== '/account'

  useEffect(() => {
    if (isUnauthenticated) {
      router.replace('/auth/login')
      return
    }

    if (shouldCheckClubAccess && hasActiveClubRequest === null) {
      let isMounted = true

      clubManager.getMyClubRequest()
        .then(async (response) => {
          if (!isMounted) return

          if (response.ok && response.data.hasClubAccess) {
            const meResponse = await authManager.me()

            if (isMounted && meResponse.ok) {
              updateUser(meResponse.data)
              router.replace('/dashboard')
            }

            return
          }

          setHasActiveClubRequest(Boolean(response.ok && response.data.clubRequest))
        })
        .catch(() => {
          if (isMounted) setHasActiveClubRequest(false)
        })

      return () => {
        isMounted = false
      }
    }

    if (mustStayOnPending) {
      router.replace('/club/pending')
      return
    }

    if (mustChangeExpiredPassword) {
      router.replace('/account')
      return
    }

    if (mustCompleteClubSetup && hasActiveClubRequest === false) {
      router.replace('/club')
    }
  }, [
    hasActiveClubRequest,
    isUnauthenticated,
    mustCompleteClubSetup,
    mustChangeExpiredPassword,
    mustStayOnPending,
    router,
    shouldCheckClubAccess,
    updateUser,
  ])

  if (
    isLoading ||
    isUnauthenticated ||
    (shouldCheckClubAccess && hasActiveClubRequest === null) ||
    mustChangeExpiredPassword ||
    mustCompleteClubSetup ||
    mustStayOnPending
  ) {
    return <div className="auth-bg min-h-screen w-full" />
  }

  return children
}

export default AppAccessGuard
