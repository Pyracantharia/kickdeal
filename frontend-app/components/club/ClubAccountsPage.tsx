'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, UserPlus } from 'lucide-react'

import ClubAccountsPanel from '@/components/club/ClubAccountsPanel'
import { clubManager } from '@/features/club/club'
import type { ClubDetail } from '@/features/club/types/club'

function ClubAccountsPage() {
  const [club, setClub] = useState<ClubDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadClub() {
      try {
        const response = await clubManager.getMine()

        if (!isMounted) {
          return
        }

        if (response.ok) {
          setClub(response.data.club)
          setErrorMessage(null)
        } else {
          setErrorMessage('Impossible de charger les comptes du club.')
        }
      } catch {
        if (isMounted) {
          setErrorMessage('Impossible de charger les comptes du club.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadClub()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="auth-bg min-h-screen w-full px-4 pb-12 pt-28">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6">
          <Link
            href="/club/detail"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-[#172033] px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à mon club
          </Link>
        </div>

        <header className="mb-8 rounded-2xl border border-brand-cyan/30 bg-[#071722]/90 p-6 shadow-2xl shadow-brand-cyan/10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-brand-cyan">Comptes club</p>
              <h1 className="mt-2 text-4xl font-bold text-white">Gérer les accès</h1>
              <p className="mt-2 max-w-2xl text-white/65">
                Invitez les membres de votre club, suivez les places incluses dans votre abonnement et gardez une vision claire des accès.
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-purple/40 bg-brand-purple/15 text-brand-purple">
              <UserPlus className="h-7 w-7" />
            </div>
          </div>
        </header>

        {isLoading && (
          <div className="rounded-2xl border border-white/10 bg-[#071722]/85 p-6 text-white/70">
            Chargement des comptes...
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="rounded-2xl border border-red-500/35 bg-red-500/10 p-6 text-red-100">
            {errorMessage}
          </div>
        )}

        {!isLoading && club?.accounts && <ClubAccountsPanel accounts={club.accounts} />}
      </div>
    </div>
  )
}

export default ClubAccountsPage