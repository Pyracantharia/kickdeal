'use client'

import { useAuth } from '@/context/AuthProvider'
import Navbar, { type NavbarVariant } from '@/components/navbar/Navbar'

// Determines the navbar variant based on user roles.
// TODO: refine once ROLE_CLUB / ROLE_AGENT are defined on the backend.
function getVariantFromRoles(roles: string[]): NavbarVariant {
  if (roles.includes('ROLE_CLUB')) return 'club'
  if (roles.includes('ROLE_AGENT') || roles.includes('ROLE_MANAGER')) return 'agent'
  return 'sans-club'
}

function AppHeader() {
  const { user } = useAuth()

  if (!user) return null

  const variant = user.roles.includes('ROLE_CLUB') && !user.hasClubAccess
    ? 'sans-club'
    : getVariantFromRoles(user.roles)

  return <Navbar variant={variant} clubName={user.clubName ?? 'Mon club'} />
}

export default AppHeader
