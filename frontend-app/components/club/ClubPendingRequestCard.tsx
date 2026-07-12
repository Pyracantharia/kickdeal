'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Clock3, FileCheck2, ShieldCheck, UsersRound } from 'lucide-react'
import { useRouter } from 'next/navigation'

import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { useAuth } from '@/context/AuthProvider'
import { authManager } from '@/features/auth/auth'
import { clubManager, type ClubRequestSummary } from '@/features/club/club'

function ClubPendingRequestCard() {
  const router = useRouter()
  const { updateUser } = useAuth()
  const [clubRequest, setClubRequest] = useState<ClubRequestSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const refreshStatus = useCallback(async () => {
    setIsLoading(true)
    setStatusMessage(null)

    try {
      const response = await clubManager.getMyClubRequest()

      if (response.ok) {
        setClubRequest(response.data.clubRequest)

        if (response.data.hasClubAccess) {
          const meResponse = await authManager.me()

          if (meResponse.ok) {
            updateUser(meResponse.data)
          }

          router.replace('/dashboard')
          return
        }

        if (response.data.clubRequest?.status === 'rejected') {
          router.replace('/club')
          return
        }
      }

      setStatusMessage('Votre demande est toujours en attente de validation.')
    } finally {
      setIsLoading(false)
    }
  }, [router, updateUser])

  useEffect(() => {
    void refreshStatus()
  }, [refreshStatus])

  const team = clubRequest?.team

  return (
    <div className="auth-bg min-h-screen w-full px-4 pb-12 pt-24">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <div className="rounded-full border-2 border-brand-cyan bg-brand-cyan/10 p-5 shadow-lg shadow-brand-cyan/20">
          <Clock3 className="h-12 w-12 text-brand-cyan" aria-hidden="true" />
        </div>

        <div>
          <h1 className="text-3xl font-bold uppercase tracking-widest text-white">
            Validation en attente
          </h1>
          <p className="mt-2 text-sm text-gray-300">
            Votre demande de gestion doit être vérifiée par un administrateur KickDeal avant activation.
          </p>
        </div>

        <Card color="cyan" className="w-full p-6 text-left">
          {isLoading ? (
            <p className="text-sm text-gray-300">Chargement de votre demande...</p>
          ) : team ? (
            <div className="flex items-center gap-4">
              {team.logoUrl ? (
                <div className="relative h-20 w-24 shrink-0">
                  <Image
                    src={team.logoUrl}
                    alt={`Logo ${team.name}`}
                    fill
                    sizes="96px"
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-purple/40 text-xl font-bold text-white">
                  {team.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-cyan">Club demandé</p>
                <h2 className="mt-1 truncate text-2xl font-bold text-white">{team.name}</h2>
                <p className="mt-1 text-sm text-gray-300">
                  {team.league} · {team.country}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-300">
              Aucune demande en attente n’a été trouvée pour ce compte.
            </p>
          )}
        </Card>

        <div className="grid w-full gap-4 md:grid-cols-3">
          <StatusStep icon={<FileCheck2 className="h-5 w-5" />} title="Demande reçue" text="Vos informations ont bien été transmises." />
          <StatusStep icon={<ShieldCheck className="h-5 w-5" />} title="Vérification admin" text="Un administrateur vérifie votre légitimité." />
          <StatusStep icon={<UsersRound className="h-5 w-5" />} title="Accès club" text="Après validation, vous devenez gestionnaire principal." />
        </div>

        <div className="w-full rounded-xl border border-white/10 bg-white/5 p-5 text-left">
          <p className="text-sm text-gray-300">
            Tant que la demande n’est pas validée, l’accès au marché, aux joueurs et aux négociations reste désactivé.
            Si le club est déjà géré sur KickDeal, il faudra rejoindre l’espace club via un code d’invitation transmis par le gestionnaire principal.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Button type="button" className="flex-1" isLoading={isLoading} onClick={refreshStatus}>
            Actualiser le statut
          </Button>
        </div>
        {statusMessage && (
          <p className="text-sm text-gray-300" role="status">{statusMessage}</p>
        )}
      </div>
    </div>
  )
}

function StatusStep({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-left">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan">
        {icon}
      </div>
      <p className="text-sm font-bold text-white">{title}</p>
      <p className="mt-1 text-xs text-gray-400">{text}</p>
    </div>
  )
}

export default ClubPendingRequestCard
