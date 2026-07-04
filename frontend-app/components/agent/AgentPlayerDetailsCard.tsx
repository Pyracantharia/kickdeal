'use client'

import React from 'react'
import { BriefcaseBusiness, CalendarDays, Check, ShieldCheck, UserRoundCheck, UsersRound, X } from 'lucide-react'

import Button from '@/components/ui/Button'
import CircleImage from '@/components/media/CircleImage'
import { CountryFlag } from '@/components/media/CountryFlag'
import type { Player } from '@/features/market/types/player'
import type { RepresentationRequest } from '@/features/agent/agentPlayers'
import { getLeagueDisplayName } from '@/features/league/leagueConfig'
import { getPositionDisplayName } from '@/features/players/position'

interface AgentPlayerDetailsCardProps {
  player: Player
  handoverRequest?: RepresentationRequest | null
  onManage: () => void
  onDecideHandover?: (requestId: string, decision: 'approve' | 'reject') => void
}

function AgentPlayerDetailsCard({
  player,
  handoverRequest = null,
  onManage,
  onDecideHandover,
}: AgentPlayerDetailsCardProps) {
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
              <p className="mt-2 truncate text-sm font-medium text-white">{player.club}</p>
            </div>
          </div>
          <span className="mt-5 inline-flex rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-1.5 text-xs font-bold text-brand-cyan">
            {player.transferStatus}
          </span>
          {player.marketContext && (
            <p className="mt-3 max-w-xs text-sm text-white/65">
              {player.marketContext.message}
            </p>
          )}
        </div>

        <div className="space-y-6 p-6">
          <section>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase text-brand-cyan">
              <BriefcaseBusiness className="h-4 w-4" />
              Informations contractuelles
            </h3>
            <div className="space-y-3">
              <Detail label="Valeur marchande" value={player.marketValue ?? '-'} highlight />
              <Detail label="Salaire hebdomadaire" value={player.weeklySalary ?? '-'} />
              <Detail label="Fin de contrat" value={formatContractDate(player.contractEndDate)} />
              <Detail label="Clause libératoire" value={player.releaseClause ?? 'Aucune'} />
            </div>
          </section>

          <div className="h-px bg-white/10" />

          <section>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase text-brand-purple">
              <ShieldCheck className="h-4 w-4" />
              Situation sportive
            </h3>
            <div className="space-y-3">
              <Detail label="Club actuel" value={player.club || 'Sans club'} />
              <Detail label="Ligue" value={getLeagueDisplayName(player.league)} />
              <Detail
                label="Nationalité"
                value={(
                  <span className="inline-flex items-center justify-end gap-1.5">
                    <CountryFlag country={player.nationality} className="h-3.5 w-5" />
                    {player.nationality}
                  </span>
                )}
              />
              <Detail label="Marché" value={player.transferStatus || 'Non listé'} />
            </div>
          </section>

          {handoverRequest && (
            <>
              <div className="h-px bg-white/10" />

              <section className="rounded-xl border border-brand-cyan/30 bg-brand-cyan/10 p-4">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase text-brand-cyan">
                  <UserRoundCheck className="h-4 w-4" />
                  Passation demandée
                </h3>
                <p className="text-sm text-white/70">
                  {handoverRequest.requestingAgent?.name ?? 'Un autre agent'} souhaite récupérer ce joueur.
                  La demande a été validée par l’administration et attend votre décision.
                </p>
                {handoverRequest.message && (
                  <p className="mt-3 rounded-lg border border-white/10 bg-[#071722]/70 px-3 py-2 text-sm text-white/55">
                    {handoverRequest.message}
                  </p>
                )}
                {onDecideHandover && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => onDecideHandover(handoverRequest.id, 'reject')}
                      icon={<X className="h-4 w-4" />}
                    >
                      Refuser
                    </Button>
                    <Button
                      type="button"
                      onClick={() => onDecideHandover(handoverRequest.id, 'approve')}
                      icon={<Check className="h-4 w-4" />}
                    >
                      Accepter
                    </Button>
                  </div>
                )}
              </section>
            </>
          )}

          <Button
            type="button"
            onClick={onManage}
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

function PlayerAvatar({ player }: { player: Player }) {
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

function Detail({ label, value, highlight = false }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="flex items-center gap-1.5 text-sm text-white/55">
        {label === 'Fin de contrat' && <CalendarDays className="h-3.5 w-3.5" />}
        {label}
      </span>
      <span className={`text-right text-sm font-semibold ${highlight ? 'text-brand-cyan' : 'text-white'}`}>
        {value}
      </span>
    </div>
  )
}

function formatContractDate(value?: string | null): string {
  if (!value) return 'Non renseignée'

  return new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

export default AgentPlayerDetailsCard
