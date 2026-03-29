'use client'

import React from 'react'
import { Users, Mail, History } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import type { ClubPlayer } from '@/features/club/types/roster'

interface PlayerActionsModalProps {
  isOpen: boolean
  onClose: () => void
  player: ClubPlayer | null
}

function PlayerActionsModal({ isOpen, onClose, player }: PlayerActionsModalProps) {
  if (!player) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`ACTIONS - ${player.firstName.toUpperCase()} ${player.lastName.toUpperCase()}`}
    >
      <div className="space-y-6 max-h-96 overflow-y-auto">
        <div>
          <h4 className="text-brand-cyan font-bold mb-3 flex items-center gap-2 uppercase text-sm">
            Transferts
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <ActionButton label="Ajouter à la liste des transferts" />
            <ActionButton label="Ajouter à la liste de prêt" />
            <ActionButton label="Bloquer les offres" />
            <ActionButton label="Fixer une valeur marchande" />
            <ActionButton label="Définir prix minimum accepté" />
          </div>
        </div>

        <div>
          <h4 className="text-brand-purple font-bold mb-3 flex items-center gap-2 uppercase text-sm">
            Contrat
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <ActionButton label="Négocier contrat" />
            <ActionButton label="Prolonger contrat" />
            <ActionButton label="Libérer le joueur" />
            <ActionButton label="Ajouter clause libératoire" />
            <ActionButton label="Modifier salaire" />
          </div>
        </div>

        <div>
          <h4 className="text-brand-cyan font-bold mb-3 flex items-center gap-2 uppercase text-sm">
            <Users className="h-4 w-4" />
            Agent
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <ActionButton label="Voir l'agent" icon={<Users className="h-4 w-4" />} />
            <ActionButton label="Contacter l'agent" icon={<Mail className="h-4 w-4" />} />
            <ActionButton label="Historique des discussions" icon={<History className="h-4 w-4" />} />
            <ActionButton label="Changer d'agent" />
          </div>
        </div>
      </div>
    </Modal>
  )
}

function ActionButton({
  label,
  icon,
}: {
  label: string
  icon?: React.ReactNode
}) {
  return (
    <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-left text-xs text-white hover:border-brand-cyan/50 hover:bg-white/10 transition-all flex items-center gap-2">
      {icon}
      <span>{label}</span>
    </button>
  )
}

export default PlayerActionsModal