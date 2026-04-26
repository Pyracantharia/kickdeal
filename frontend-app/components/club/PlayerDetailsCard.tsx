'use client'

import React from 'react'
import { Users } from 'lucide-react'
import type { ClubPlayer } from '@/features/club/types/roster'
import Button from '@/components/ui/Button'
import CircleImage from '@/components/media/CircleImage'

interface PlayerDetailsCardProps {
  player: ClubPlayer
  onActionsClick: () => void
}

function PlayerDetailsCard({ player, onActionsClick }: PlayerDetailsCardProps) {
  return (
    <div className="w-full lg:w-80 flex-shrink-0">
      <div className="rounded-lg border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur">
        <div className="mb-6 text-center">
          {player.photoUrl ? (
            <CircleImage
              src={player.photoUrl}
              alt={`${player.firstName} ${player.lastName}`}
              className="relative mx-auto mb-3 h-20 w-20 overflow-hidden rounded-full border border-white/20"
              sizes="80px"
              fallback={
                <div className="h-20 w-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center text-white text-3xl font-bold">
                  {player.firstName.charAt(0)}{player.lastName.charAt(0)}
                </div>
              }
            />
          ) : (
            <div className="h-20 w-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center text-white text-3xl font-bold">
              {player.firstName.charAt(0)}{player.lastName.charAt(0)}
            </div>
          )}
          <h3 className="text-xl font-bold text-white">
            {player.firstName} {player.lastName}
          </h3>
          <p className="text-sm text-white/60 mt-1">{player.position}</p>
        </div>

        <div className="mb-6 text-center">
          <span
            className={`inline-block px-4 py-1.5 rounded-lg text-xs font-bold uppercase ${
              player.status === 'Normal'
                ? 'bg-brand-cyan/20 text-brand-cyan'
                : player.status === 'Blessé'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-yellow-500/20 text-yellow-400'
            }`}
          >
            {player.status}
          </span>
        </div>

        <div className="space-y-4 mb-6">
          <DetailItem label="Taille / Poids" value={`${player.height} cm / ${player.weight} kg`} />
          <DetailItem label="Pied fort" value={player.foot} />
          <DetailItem label="Valeur marchande" value={player.marketValue} highlight />
          <DetailItem label="Salaire" value={player.weeklySalary} highlight />
          <DetailItem label="Durée restante contrat" value={`${player.contract} ans`} />
          <DetailItem label="Nationalité" value={player.nationality} />
          {player.agentName && <DetailItem label="Agent" value={player.agentName} />}
        </div>

        <Button
          onClick={onActionsClick}
          variant="primary"
          className="w-full flex items-center justify-center gap-2"
          icon={<Users className="h-4 w-4" />}
        >
          Actions joueur
        </Button>
      </div>
    </div>
  )
}

function DetailItem({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-white/70">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-brand-cyan' : 'text-white'}`}>
        {value}
      </span>
    </div>
  )
}

export default PlayerDetailsCard