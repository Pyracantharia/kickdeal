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
    !user?.googleConnected &&
    pathname !== '/account'

  const isBanned = !isLoading && Boolean(user?.banned)

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
    (!isBanned && (mustChangeExpiredPassword || mustCompleteClubSetup || mustStayOnPending))
  ) {
    return <div className="auth-bg min-h-screen w-full" />
  }

  if (isBanned) {
    return (
      <div className="auth-bg flex min-h-screen w-full items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-2xl border border-red-500/30 bg-[#071722]/90 p-6 text-center shadow-2xl shadow-red-500/10">
          <h1 className="text-2xl font-bold text-white">Compte suspendu</h1>
          <p className="mt-3 text-sm leading-6 text-gray-300">
            Votre compte est temporairement suspendu
            {user?.banExpiresAt ? ` jusqu’au ${formatBanDate(user.banExpiresAt)}` : ''}.
          </p>
          <button
            type="button"
            onClick={async () => {
              await authManager.logout()
              updateUser(null)
              router.replace('/auth/login')
            }}
            className="mt-6 rounded-lg border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    )
  }

  return children
}

function formatBanDate(value: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default AppAccessGuard
