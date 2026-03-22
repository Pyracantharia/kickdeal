'use client'

import React from 'react'
import Modal from '@/components/ui/Modal'
import type { TransferStatus } from '@/features/market/types/player'

interface TransferStatusSearchModalProps {
  isOpen: boolean
  onClose: () => void
  statuses: TransferStatus[]
  onSelect: (status: TransferStatus) => void
  selectedStatusId?: string
}

function TransferStatusSearchModal({
  isOpen,
  onClose,
  statuses,
  onSelect,
  selectedStatusId,
}: TransferStatusSearchModalProps) {
  const handleSelectStatus = (status: TransferStatus) => {
    onSelect(status)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Statut de transfert">
      <div className="space-y-2">
        {statuses.map((status) => (
          <button
            key={status.id}
            onClick={() => handleSelectStatus(status)}
            className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
              selectedStatusId === status.id
                ? 'border-brand-purple bg-brand-purple/10 text-white'
                : 'border-white/10 bg-white/5 text-white/80 hover:border-brand-purple/50 hover:bg-white/10'
            }`}
          >
            <p className="font-semibold">{status.label}</p>
          </button>
        ))}
      </div>
    </Modal>
  )
}

export default TransferStatusSearchModal