'use client'

import React from 'react'
import { BriefcaseBusiness, Dumbbell, ShieldCheck, UsersRound } from 'lucide-react'
import type { ClubPlayer } from '@/features/club/types/roster'
import Button from '@/components/ui/Button'
import CircleImage from '@/components/media/CircleImage'
import { getTransferFilterLabel } from '@/features/players/players'
import { getPositionDisplayName } from '@/features/players/position'

interface PlayerDetailsCardProps {
  player: ClubPlayer
  onActionsClick: () => void
}

function PlayerDetailsCard({ player, onActionsClick }: PlayerDetailsCardProps) {
  return (
    <aside className="w-full shrink-0 lg:sticky lg:top-32 lg:w-[340px] lg:self-start">
      <div className="overflow-hidden rounded-2xl border border-brand-cyan/25 bg-[#071722]/90 shadow-2xl backdrop-blur">
        <div className="bg-gradient-to-br from-brand-purple/25 via-brand-cyan/15 to-transparent p-6">
          <div className="flex items-center gap-4">
            <PlayerAvatar player={player} />
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold uppercase text-white">
                {player.firstName} {player.lastName}
              </h2>
              <p className="mt-1 text-sm text-white/60">{getPositionDisplayName(player.position)} · {player.age} ans</p>
              <p className="mt-2 truncate text-sm font-medium text-white">{player.nationality}</p>
            </div>
          </div>
          <StatusBadge status={player.status} />
        </div>

        <div className="space-y-6 p-6">
          <section>
            <SectionTitle icon={<BriefcaseBusiness className="h-4 w-4" />} label="Informations contractuelles" />
            <div className="space-y-3">
              <DetailItem label="Valeur marchande" value={player.marketValue} highlight />
              <DetailItem label="Salaire hebdomadaire" value={player.weeklySalary} />
              <DetailItem label="Contrat restant" value={`${player.contract} an${player.contract === '1' ? '' : 's'}`} />
              <DetailItem label="Arrivée au club" value={formatDate(player.joinDate)} />
              <DetailItem label="Marché" value={getTransferFilterLabel(player)} />
            </div>
          </section>

          <div className="h-px bg-white/10" />

          <section>
            <SectionTitle icon={<Dumbbell className="h-4 w-4" />} label="Profil sportif" purple />
            <div className="space-y-3">
              <DetailItem label="Taille / Poids" value={`${player.height || '-'} cm / ${player.weight || '-'} kg`} />
              <DetailItem label="Pied fort" value={player.foot} />
              <DetailItem label="Disponibilité" value={player.status} />
            </div>
          </section>

          {player.agentName && (
            <>
              <div className="h-px bg-white/10" />
              <section>
                <SectionTitle icon={<ShieldCheck className="h-4 w-4" />} label="Représentation" />
                <DetailItem label="Agent" value={player.agentName} />
              </section>
            </>
          )}

          <Button
            type="button"
            onClick={onActionsClick}
            className="w-full"
            icon={<UsersRound className="h-4 w-4" />}
          >
            Gérer le joueur
          </Button>
        </div>
      </div>
    </aside>
  )
}

function PlayerAvatar({ player }: { player: ClubPlayer }) {
  const fallback = (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan text-2xl font-bold text-white">
      {player.firstName.charAt(0)}{player.lastName.charAt(0)}
    </div>
  )

  if (!player.photoUrl) return fallback

  return (
    <CircleImage
      src={player.photoUrl}
      alt={`${player.firstName} ${player.lastName}`}
      className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-brand-purple/60"
      sizes="80px"
      fallback={fallback}
    />
  )
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLocaleLowerCase('fr')
  const style = normalized.includes('bless')
    ? 'border-red-400/30 bg-red-400/10 text-red-300'
    : normalized.includes('suspend')
      ? 'border-amber-300/30 bg-amber-300/10 text-amber-200'
      : 'border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan'

  return (
    <span className={`mt-5 inline-flex rounded-lg border px-3 py-1.5 text-xs font-bold ${style}`}>
      {status}
    </span>
  )
}

function SectionTitle({
  icon,
  label,
  purple = false,
}: {
  icon: React.ReactNode
  label: string
  purple?: boolean
}) {
  return (
    <h3 className={`mb-4 flex items-center gap-2 text-sm font-bold uppercase ${
      purple ? 'text-brand-purple' : 'text-brand-cyan'
    }`}>
      {icon}
      {label}
    </h3>
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
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-white/55">{label}</span>
      <span className={`text-right text-sm font-semibold ${highlight ? 'text-brand-cyan' : 'text-white'}`}>
        {value}
      </span>
    </div>
  )
}

function formatDate(value: string): string {
  if (!value) return 'Non renseignée'

  return new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

export default PlayerDetailsCard
