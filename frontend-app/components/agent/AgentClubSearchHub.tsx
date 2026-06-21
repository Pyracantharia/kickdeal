'use client'

import React, { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Building2, UsersRound } from 'lucide-react'
import { useRouter } from 'next/navigation'

import Button from '@/components/ui/Button'
import CircleImage from '@/components/media/CircleImage'
import type { Player } from '@/features/market/types/player'
import { playersManager } from '@/features/players/players'
import { getPositionDisplayName } from '@/features/players/position'

function AgentClubSearchHub() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadPlayers() {
      try {
        const response = await playersManager.getAgentRoster()
        if (!isMounted) return

        if (!response.ok) {
          setErrorMessage('Impossible de charger vos joueurs.')
          return
        }

        setPlayers(response.data.players ?? [])
      } catch {
        if (isMounted) setErrorMessage('Impossible de charger vos joueurs.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void loadPlayers()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="auth-bg min-h-screen w-full px-4 pb-14 pt-36 md:px-8 md:pt-40">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8 border-b border-white/10 pb-7">
          <button
            type="button"
            onClick={() => router.push('/market')}
            className="mb-4 inline-flex items-center gap-2 text-sm text-white/55 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au marché agent
          </button>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-cyan">Prospection agent</p>
          <h1 className="mt-2 text-4xl font-bold text-white">RECHERCHER UN CLUB</h1>
          <p className="mt-2 text-white/60">
            Sélectionnez d’abord un joueur de votre portefeuille pour lancer la recherche de clubs compatibles.
          </p>
        </header>

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-2xl border border-white/10 bg-[#071722]/80 p-10 text-center text-white/55">
            Chargement de vos joueurs...
          </div>
        ) : players.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#071722]/80 p-10 text-center">
            <UsersRound className="mx-auto h-11 w-11 text-brand-cyan" />
            <h2 className="mt-4 text-xl font-bold text-white">Aucun joueur représenté</h2>
            <p className="mt-2 text-white/55">
              Ajoutez d’abord un joueur à votre portefeuille pour commencer la prospection club.
            </p>
            <Button
              type="button"
              className="mt-5"
              onClick={() => router.push('/mes-joueurs?add=1')}
            >
              Ajouter un joueur
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {players.map((player) => (
              <article
                key={player.id}
                className="rounded-2xl border border-white/15 bg-[#071722]/85 p-5 shadow-xl transition-colors hover:border-brand-cyan/45"
              >
                <div className="flex items-center gap-4">
                  <PlayerAvatar player={player} />
                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-bold text-white">
                      {player.firstName} {player.lastName}
                    </h2>
                    <p className="mt-1 text-sm text-white/55">
                      {getPositionDisplayName(player.position)} · {player.age} ans · {player.club}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-brand-cyan">
                      {player.marketValue ?? '-'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    className="flex-1"
                    icon={<Building2 className="h-4 w-4" />}
                    onClick={() => router.push(`/mes-joueurs/${player.id}/clubs`)}
                  >
                    Trouver un club
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    icon={<ArrowRight className="h-4 w-4" />}
                    onClick={() => router.push(`/market/player/${player.id}`)}
                  >
                    Voir le profil
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PlayerAvatar({ player }: { player: Player }) {
  const fallback = (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan font-bold text-white">
      {player.firstName.charAt(0)}{player.lastName.charAt(0)}
    </div>
  )

  if (!player.photoUrl) return fallback

  return (
    <CircleImage
      src={player.photoUrl}
      alt={`${player.firstName} ${player.lastName}`}
      className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white/20"
      sizes="56px"
      fallback={fallback}
    />
  )
}

export default AgentClubSearchHub
