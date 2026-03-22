'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { MOCK_PLAYERS, MOCK_NATIONALITIES, MOCK_CLUBS } from '@/features/market/mockPlayers'
import type { Player } from '@/features/market/types/player'

interface PlayerDetailsProps {
  playerId: string
}

function PlayerDetails({ playerId }: PlayerDetailsProps) {
  const router = useRouter()
  const player = MOCK_PLAYERS.find((p) => p.id === playerId)

  if (!player) {
    return (
      <div className="auth-bg min-h-screen w-full pt-36 md:pt-40 pb-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 text-lg mb-4">Joueur non trouvé</p>
          <Button type="button" onClick={() => router.back()}>
            Retour
          </Button>
        </div>
      </div>
    )
  }

  const nationality = MOCK_NATIONALITIES.find((n) => n.label === player.nationality)
  const club = MOCK_CLUBS.find((c) => c.label === player.club)

  return (
    <div className="auth-bg min-h-screen w-full pt-36 md:pt-40 pb-12 px-4">
      <div className="mx-auto w-full max-w-5xl">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-brand-cyan hover:text-brand-cyan/80 transition-colors text-sm font-semibold mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux résultats
        </button>

        <Card color="purple" baseGradient={false} className="bg-gradient-to-b from-brand-purple/20 from-0% to-transparent to-90% p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex flex-col items-center shrink-0">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center text-white font-bold text-5xl border-4 border-brand-purple mb-4">
                {player.firstName.charAt(0)}{player.lastName.charAt(0)}
              </div>
              <div className="inline-block bg-brand-cyan text-white px-4 py-1 rounded-full text-sm font-bold">
                {player.position}
              </div>
            </div>

            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-1">
                {player.firstName}
              </h1>
              <p className="text-3xl font-bold text-white/80 mb-6">
                {player.lastName}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-white/5 p-3 border border-white/10">
                  <p className="text-white/60 text-xs">Âge</p>
                  <p className="text-white font-semibold text-lg">{player.age}</p>
                </div>
                <div className="rounded-lg bg-white/5 p-3 border border-white/10">
                  <p className="text-white/60 text-xs">Taille</p>
                  <p className="text-white font-semibold text-lg">{player.height} cm</p>
                </div>
                <div className="rounded-lg bg-white/5 p-3 border border-white/10">
                  <p className="text-white/60 text-xs">Poids et taille</p>
                  <p className="text-white font-semibold text-lg">{player.weight} kg</p>
                </div>
                <div className="rounded-lg bg-white/5 p-3 border border-white/10">
                  <p className="text-white/60 text-xs">Pied fort</p>
                  <p className="text-white font-semibold text-lg">{player.foot}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex flex-col gap-6">
            <Card
              color="cyan"
              baseGradient={false}
              className="bg-gradient-to-b from-brand-cyan/10 from-0% to-transparent to-90% p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 border-2 border-brand-cyan flex items-center justify-center text-3xl">
                    {club?.logo || '⚽'}
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Club</p>
                    <p className="text-white font-bold text-lg">{player.club}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-xs">Statut</p>
                  <p className="text-brand-cyan font-semibold">{player.transferStatus}</p>
                </div>
              </div>
            </Card>

            <Card
              color="purple"
              baseGradient={false}
              className="bg-gradient-to-b from-brand-purple/10 from-0% to-transparent to-90% p-6"
            >
              <div className="flex items-center gap-4">
                <div className="text-6xl">{nationality?.flag || '🌍'}</div>
                <div>
                  <p className="text-white/60 text-xs">Nationalité/Région</p>
                  <p className="text-white font-bold text-lg">{player.nationality}</p>
                </div>
              </div>
            </Card>
          </div>

          <Card
            color="cyan"
            baseGradient={false}
            className="bg-gradient-to-b from-brand-cyan/10 from-0% to-transparent to-90% p-6"
            >
            <h3 className="text-lg font-bold text-white mb-4">Finances</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 border border-white/10">
                <p className="text-white/80">Valeur marché</p>
                <p className="text-brand-cyan font-semibold">{player.marketValue}</p>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 border border-white/10">
                <p className="text-white/80">Salaire hebdo.</p>
                <p className="text-brand-cyan font-semibold">{player.weeklySalary}</p>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 border border-white/10">
                <p className="text-white/80">Clause de libération</p>
                <p className="text-white font-semibold">{player.releaseClause}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button type="button" className="flex-1">
            Recruter
          </Button>
          <Button type="button" variant="secondary" className="flex-1">
            Ajouter à la liste
          </Button>
          <Button type="button" variant="secondary" className="flex-1">
            Ajouter à la liste et afficher
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PlayerDetails