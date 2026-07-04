'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react'

import Button from '@/components/ui/Button'
import { transfersManager } from '@/features/market/transfers'
import type { TransferAgentInvitation } from '@/features/market/types/transfer'

export default function AgentInvitationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [invitation, setInvitation] = useState<TransferAgentInvitation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadInvitation() {
      if (!token) {
        setErrorMessage('Invitation introuvable.')
        setIsLoading(false)
        return
      }

      const response = await transfersManager.getAgentInvitation(token)
      if (!isMounted) return

      if (!response.ok) {
        setErrorMessage('Cette invitation est introuvable ou n’est plus disponible.')
      } else {
        setInvitation(response.data.invitation)
      }
      setIsLoading(false)
    }

    void loadInvitation()

    return () => {
      isMounted = false
    }
  }, [token])

  if (isLoading) {
    return <div className="auth-bg min-h-screen px-4 pt-40 text-center text-white/60">Chargement de l’invitation...</div>
  }

  if (!invitation) {
    return (
      <div className="auth-bg min-h-screen px-4 pt-40">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center text-red-200">
          {errorMessage ?? 'Invitation introuvable.'}
        </div>
      </div>
    )
  }

  const playerName = `${invitation.player.firstName} ${invitation.player.lastName}`

  return (
    <div className="auth-bg min-h-screen w-full px-4 pb-16 pt-28">
      <main className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-brand-cyan/25 bg-[#071722]/90 p-6 shadow-2xl shadow-brand-cyan/10 md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="relative h-14 w-14">
              <Image src="/images/logo.png" alt="KickDeal logo" fill sizes="56px" className="object-contain" priority />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-cyan">Invitation agent</p>
              <h1 className="text-3xl font-bold text-white">Bienvenue sur KickDeal</h1>
            </div>
          </div>

          <p className="text-lg text-white/75">
            Vous avez été invité pour représenter <span className="font-semibold text-white">{playerName}</span> dans le cadre d’un transfert entre <span className="font-semibold text-white">{invitation.sellerTeam.name}</span> et <span className="font-semibold text-white">{invitation.buyerTeam.name}</span>.
          </p>

          <div className="mt-7 space-y-3">
            {[
              'Les deux clubs ont déjà trouvé un accord.',
              'La négociation contractuelle du joueur attend votre intervention.',
              'En rejoignant KickDeal, vous retrouvez immédiatement cette négociation dans votre espace.',
              'Les échanges, offres et décisions sont centralisés sur la plateforme.',
            ].map((item) => (
              <div key={item} className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              onClick={() => router.push(`/auth/register/manager?invitationToken=${encodeURIComponent(token)}`)}
              icon={<ArrowRight className="h-4 w-4" />}
            >
              Créer mon compte agent
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push(`/auth/login?invitationToken=${encodeURIComponent(token)}`)}
              icon={<ShieldCheck className="h-4 w-4" />}
            >
              J’ai déjà un compte
            </Button>
          </div>
        </section>

        <aside className="rounded-2xl border border-brand-purple/25 bg-[#111827]/90 p-6 shadow-2xl shadow-brand-purple/10">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-purple">Négociation en attente</p>
          <h2 className="mt-3 text-2xl font-bold text-white">{playerName}</h2>
          <p className="mt-2 text-white/60">{invitation.player.position} · {invitation.player.age} ans</p>
          <div className="mt-6 space-y-3 text-sm text-white/70">
            <p><span className="text-white/45">Club vendeur:</span> {invitation.sellerTeam.name}</p>
            <p><span className="text-white/45">Club acheteur:</span> {invitation.buyerTeam.name}</p>
            <p><span className="text-white/45">Invitation envoyée à:</span> {invitation.email}</p>
          </div>
        </aside>
      </main>
    </div>
  )
}
