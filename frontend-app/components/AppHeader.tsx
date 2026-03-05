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

  // Temporary test — remove once backend roles are connected
  return <Navbar variant="club" clubName="Real Madrid" />

  if (!user) return null

  // const variant = getVariantFromRoles(user.roles)
  // const clubName = user.firstname

  // return <Navbar variant={variant} clubName={clubName} />
}

export default AppHeader