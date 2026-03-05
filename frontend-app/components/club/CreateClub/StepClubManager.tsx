import React from 'react'
import { ClipboardList, CheckCircle2 } from 'lucide-react'
import type { Club } from '@/features/club/mockClubs'

interface StepClubManagerProps {
  selectedClub: Club
  userEmail: string
}

const PRIVILEGES = [
  'Gestion complète du profil du club',
  'Invitation et gestion des membres',
  'Validation des transferts et négociations',
]

function StepClubManager({ selectedClub, userEmail }: StepClubManagerProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-bold text-white uppercase mb-1">Responsable du club</h2>
        <p className="text-sm text-gray-300">
          Vous serez désigné comme gestionnaire principal du club.
        </p>
      </div>

      <div className="rounded-lg border border-brand-purple/40 bg-brand-purple/10 p-4 flex items-start gap-3">
        <div className="rounded-full bg-brand-purple/20 p-2 border border-brand-purple shrink-0">
          <ClipboardList className="h-6 w-6 text-brand-purple" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-white font-semibold text-sm break-all">{userEmail}</span>
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30 shrink-0">
              Gestionnaire principal
            </span>
          </div>
          <p className="text-xs text-gray-300">
            En tant que créateur de{' '}
            <span className="text-white font-medium">{selectedClub.name}</span>, vous aurez
            accès à toutes les fonctionnalités de gestion et pourrez inviter d&apos;autres membres.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Privilèges du gestionnaire</h3>
        <ul className="space-y-2">
          {PRIVILEGES.map((privilege) => (
            <li key={privilege} className="flex items-center gap-2 text-sm text-gray-300">
              <CheckCircle2 className="h-4 w-4 text-brand-cyan shrink-0" aria-hidden="true" />
              {privilege}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default StepClubManager