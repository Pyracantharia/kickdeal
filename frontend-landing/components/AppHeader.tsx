'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { APP_ROUTES } from '@/lib/config'
import LinkButton from '@/components/ui/LinkButton'

const NAV_LINKS = [
  { href: '#fonctionnalites', label: 'Fonctionnalités' },
  { href: '#clubs', label: 'Pour les clubs' },
  { href: '#agents', label: 'Pour les agents' },
  { href: '#tarifs', label: 'Tarifs' },
]

function AppHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${ isScrolled
          ? 'bg-dark-900/95 backdrop-blur-md border-b border-white/5'
          : 'navbar-bg'
      }`} >
      <div className="hidden md:flex py-4">
        <div className="max-w-6xl mx-auto w-full px-8 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3 shrink-0">
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

            <span className="h-6 w-px bg-white/25 mx-6 shrink-0" aria-hidden="true" />

            <nav className="flex items-center gap-8">
              {NAV_LINKS.map(({ href, label }) => (
                <a key={href} href={href} className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                  {label}
                </a>
              ))}
            </nav>
          </div>

          <LinkButton href={APP_ROUTES.register} className="px-5 py-2">
            Commencer
          </LinkButton>
        </div>
      </div>

      <div className="md:hidden flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="relative h-9 w-9 shrink-0">
            <Image src="/images/logo.png" alt="KickDeal" fill sizes="36px" className="object-contain"/>
          </div>
          <span className="text-sm font-bold text-white">KickDeal</span>
        </Link>

        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white/70 hover:text-white transition-colors p-1" aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}>
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isMenuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute top-full left-0 right-0 z-50 bg-dark-900/95 backdrop-blur-md border-t border-white/10 py-4 flex flex-col md:hidden">
            {NAV_LINKS.map(({ href, label }) => (
              <a key={href} href={href} onClick={() => setIsMenuOpen(false)} className="px-6 py-3 text-base font-medium text-white/70 hover:text-white transition-colors" >
                {label}
              </a>
            ))}
            <div className="px-6 pt-3">
              <LinkButton href={APP_ROUTES.register} className="w-full py-2.5">
                Commencer
              </LinkButton>
            </div>
          </div>
        </>
      )}
    </header>
  )
}

export default AppHeader