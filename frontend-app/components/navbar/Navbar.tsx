'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, ArrowLeft, ChevronDown, LogOut } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useAuth } from '@/context/AuthProvider'
import { authManager } from '@/features/auth/auth'
import type { SubscriptionPlan } from '@/features/subscription/subscription'

export type NavbarVariant = 'club' | 'agent' | 'sans-club' | 'creation'

interface NavbarProps {
  variant: NavbarVariant
  clubName?: string
  clubLogoUrl?: string | null
  subscriptionPlan?: SubscriptionPlan
}

const CLUB_LINKS = [
  { href: '/dashboard', label: 'Accueil' },
  { href: '/notifications', label: 'Notifications' },
  { href: '/market', label: 'Marché' },
  { href: '/players', label: 'Joueurs' },
  { href: '/messages', label: 'Messages' },
]

const AGENT_LINKS = [
  { href: '/dashboard', label: 'Accueil' },
  { href: '/mes-joueurs', label: 'Mes joueurs' },
  { href: '/negociations', label: 'Négociations' },
  { href: '/messages', label: 'Messages' },
]

const NO_CLUB_LINKS = [{ href: '/club', label: 'Mon club' }]

function getLinksByVariant(variant: NavbarVariant) {
  if (variant === 'club') return CLUB_LINKS
  if (variant === 'agent') return AGENT_LINKS
  if (variant === 'sans-club') return NO_CLUB_LINKS
  return []
}

const AVATAR_COLORS = [
  'bg-purple-600', 'bg-cyan-600', 'bg-blue-600', 'bg-emerald-600',
  'bg-red-600', 'bg-orange-500', 'bg-pink-600', 'bg-indigo-600',
]

function getAvatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 shrink-0">
      <div className="relative h-10 w-10 shrink-0">
        <Image src="/images/logo.png" alt="KickDeal" fill sizes="40px" className="object-contain" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-base font-bold text-white">KickDeal</span>
        <span className="text-[9px] font-semibold uppercase tracking-widest text-brand-cyan mt-0.5">
          Football Transfers
        </span>
      </div>
    </Link>
  )
}

function LogoMobile() {
  return (
    <Link href="/dashboard" className="flex flex-col items-center gap-0.5">
      <div className="relative h-9 w-9">
        <Image src="/images/logo.png" alt="KickDeal" fill sizes="36px" className="object-contain" />
      </div>
      <span className="text-sm font-bold text-white leading-none">KickDeal</span>
      <span className="text-[9px] font-semibold uppercase tracking-widest text-brand-cyan leading-none">
        Football Transfers
      </span>
    </Link>
  )
}

function Separator() {
  return <span className="h-6 w-px bg-white/25 mx-6 shrink-0" aria-hidden="true" />
}

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')
  return (
    <Link
      href={href}
      className={`text-sm font-medium transition-colors ${
        isActive ? 'text-white' : 'text-gray-400 hover:text-white'
      }`}
    >
      {label}
    </Link>
  )
}

function ClubButton({
  name,
  logoUrl,
  onLogout,
  isLoggingOut,
}: {
  name: string
  logoUrl?: string | null
  onLogout: () => void
  isLoggingOut: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity shrink-0"
      >
        {logoUrl ? (
          <div className="relative h-8 w-8 shrink-0">
            <Image
              src={logoUrl}
              alt={`Logo ${name}`}
              fill
              sizes="32px"
              className="object-contain"
            />
          </div>
        ) : (
          <div className={`h-8 w-8 rounded-full ${getAvatarColor(name)} flex items-center justify-center text-white font-bold text-sm`}>
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm font-medium">{name}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border-2 border-brand-cyan/30 bg-[#0d1526] shadow-xl z-50">
          <Link
            href="/club/detail"
            className="block px-4 py-3 text-sm font-medium text-white hover:bg-brand-cyan/10 border-b border-white/10 transition-colors first:rounded-t-lg"
            onClick={() => setIsOpen(false)}
          >
            Mon club
          </Link>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              onLogout()
            }}
            disabled={isLoggingOut}
            className="w-full px-4 py-3 text-left text-sm font-medium text-white hover:bg-brand-cyan/10 transition-colors disabled:opacity-60"
          >
            {isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}
          </button>
        </div>
      )}
    </div>
  )
}

function PlanBadge({ plan, onClick }: { plan?: SubscriptionPlan; onClick: () => void }) {
  const label = getPlanBadgeLabel(plan)
  const isEnterprise = plan === 'club_enterprise'
  const isPaid = isEnterprise || plan === 'club_pro' || plan === 'agent_pro'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
        isEnterprise
          ? 'border-brand-cyan/50 bg-brand-purple/25 text-white hover:bg-brand-purple/35'
          : isPaid
          ? 'border-brand-purple/50 bg-brand-purple/20 text-white hover:bg-brand-purple/30'
          : 'border-brand-cyan/45 bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20'
      }`}
      title="Voir mon abonnement"
    >
      {label}
    </button>
  )
}

function getPlanBadgeLabel(plan?: SubscriptionPlan): string {
  if (plan === 'club_enterprise') return 'Enterprise'
  if (plan === 'club_pro' || plan === 'agent_pro') return 'Pro'
  return 'Free'
}

function MobileMenu({
  links,
  onClose,
  onLogout,
  isLoggingOut,
  subscriptionPlan,
}: {
  links: { href: string; label: string }[]
  onClose: () => void
  onLogout: () => void
  isLoggingOut: boolean
  subscriptionPlan?: SubscriptionPlan
}) {
  const pathname = usePathname()
  const badgeLabel = getPlanBadgeLabel(subscriptionPlan)
  const isEnterprise = subscriptionPlan === 'club_enterprise'
  const isPaid = isEnterprise || subscriptionPlan === 'club_pro' || subscriptionPlan === 'agent_pro'

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute top-full left-0 right-0 z-50 navbar-bg border-t border-white/10 py-4 flex flex-col">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={`px-6 py-3 text-base font-medium transition-colors ${
              pathname === href || pathname.startsWith(href + '/')
                ? 'text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {label}
          </Link>
        ))}
        <Link
          href="/subscription"
          onClick={onClose}
          className="mx-6 mt-2 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          <span>Abonnement</span>
          <span className={isPaid ? 'text-brand-purple' : 'text-brand-cyan'}>{badgeLabel}</span>
        </Link>
        <div className="px-6 pt-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onLogout}
            isLoading={isLoggingOut}
            icon={<LogOut className="h-4 w-4" />}
            className="w-full px-4 py-2.5"
          >
            Déconnexion
          </Button>
        </div>
      </div>
    </>
  )
}


function Navbar({ variant, clubName = 'Club', clubLogoUrl = null, subscriptionPlan }: NavbarProps) {
  const router = useRouter()
  const { updateUser } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const links = getLinksByVariant(variant)
  const hasMobileMenu = variant === 'club' || variant === 'agent'
  const canLogout = variant !== 'creation'

  async function handleLogout() {
    if (isLoggingOut) return

    setIsLoggingOut(true)

    try {
      await authManager.logout()
    } finally {
      updateUser(null)
      setIsMenuOpen(false)
      router.replace('/auth/login')
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="navbar-bg relative z-40 w-full">

      <div className="hidden md:flex py-4">
        <div className="max-w-6xl mx-auto w-full px-8 flex items-center">

        <div className="flex items-center">
          {variant === 'creation' ? (
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Retour</span>
            </button>
          ) : (
            <>
              <Logo />
              {links.length > 0 && (
                <>
                  <Separator />
                  <nav className="flex items-center gap-8">
                    {links.map(({ href, label }) => (
                      <NavLink key={href} href={href} label={label} />
                    ))}
                  </nav>
                </>
              )}
            </>
          )}
        </div>

        {variant === 'creation' && (
          <div className="absolute left-1/2 -translate-x-1/2">
            <Logo />
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          {canLogout && (
            <PlanBadge plan={subscriptionPlan} onClick={() => router.push('/subscription')} />
          )}
          {variant === 'club' && (
            <ClubButton
              name={clubName}
              logoUrl={clubLogoUrl}
              onLogout={handleLogout}
              isLoggingOut={isLoggingOut}
            />
          )}
          {canLogout && variant !== 'club' && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleLogout}
              isLoading={isLoggingOut}
              icon={<LogOut className="h-4 w-4" />}
              className="px-4 py-2"
            >
              Déconnexion
            </Button>
          )}
        </div>
        </div>
      </div>

      <div className="md:hidden flex items-center justify-between px-4 py-3 relative">
        <div className="w-10">
          {hasMobileMenu && (
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-white transition-colors p-1"
              aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          )}
          {variant === 'creation' && (
            <button
              onClick={() => router.back()}
              className="text-gray-300 hover:text-white transition-colors p-1"
              aria-label="Retour"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
          )}
        </div>

        <LogoMobile />

        <div className="w-10 flex justify-end">
          {canLogout && (
            <button
              type="button"
              onClick={() => router.push('/subscription')}
              className="rounded-full border border-brand-cyan/45 bg-brand-cyan/10 px-2 py-1 text-[10px] font-bold uppercase text-brand-cyan"
              aria-label="Voir mon abonnement"
            >
              {getPlanBadgeLabel(subscriptionPlan)}
            </button>
          )}
        </div>
      </div>

      {hasMobileMenu && isMenuOpen && (
        <MobileMenu
          links={links}
          onClose={() => setIsMenuOpen(false)}
          onLogout={handleLogout}
          isLoggingOut={isLoggingOut}
          subscriptionPlan={subscriptionPlan}
        />
      )}
    </header>
  )
}

export default Navbar
