'use client'

import { useAuth } from '@/context/AuthProvider'
import Navbar, { type NavbarVariant } from '@/components/navbar/Navbar'
import { authManager,type SupportSession } from '@/features/auth/auth'
import { clearSupportSwitch } from '@/features/support/supportSwitch'
import { useEffect,useState } from 'react'

// Determines the navbar variant based on user roles.
// TODO: refine once ROLE_CLUB / ROLE_AGENT are defined on the backend.
function getVariantFromRoles(roles: string[]): NavbarVariant {
  if (roles.includes('ROLE_CLUB')) return 'club'
  if (roles.includes('ROLE_AGENT') || roles.includes('ROLE_MANAGER')) return 'agent'
  if(roles.includes('ROLE_ADMIN')) return 'admin'
  return 'sans-club'
}

function AppHeader() {
  const { user,updateUser } = useAuth();const [support,setSupport]=useState<SupportSession|null>(null);const [leaving,setLeaving]=useState(false)

  useEffect(()=>{void authManager.supportSession().then(r=>{if(r.ok){setSupport(r.data);clearSupportSwitch()}})},[])
  async function leave(){setLeaving(true);const r=await authManager.stopSupportSession();if(r.ok){clearSupportSwitch();const me=await authManager.me();if(me.ok)updateUser(me.data);window.location.assign('/admin/users')}else setLeaving(false)}

  if (!user) return null

  const variant = user.roles.includes('ROLE_CLUB') && !user.hasClubAccess
    ? 'sans-club'
    : getVariantFromRoles(user.roles)

  return (
    <><Navbar
      variant={variant}
      clubName={user.clubName ?? 'Mon club'}
      clubLogoUrl={user.clubLogoUrl}
      agentName={user.agencyName ?? `${user.firstName} ${user.lastName}`}
      subscriptionPlan={user.subscriptionPlan}
    />{support?.active&&<div className="fixed bottom-0 left-0 right-0 z-[100] flex min-h-11 flex-wrap items-center justify-center gap-x-4 gap-y-2 bg-amber-400 px-4 py-2 text-center text-sm font-bold text-[#071722] shadow-[0_-8px_24px_rgba(0,0,0,0.3)]"><span>Mode support : vous agissez au nom de {support.user?.name} ({support.user?.email})</span><button type="button" onClick={leave} disabled={leaving} className="rounded-md bg-[#071722] px-3 py-1 text-white disabled:opacity-60">{leaving?'Sortie…':'Quitter'}</button></div>}</>
  )
}

export default AppHeader
