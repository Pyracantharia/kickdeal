'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'

import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

interface ConfirmationItem {
  label: string
  value?: string | number | null
}

interface ActionConfirmationModalProps {
  isOpen: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  items?: ConfirmationItem[]
  warning?: string
  isLoading?: boolean
  confirmDisabled?: boolean
  tone?: 'default' | 'danger'
  onClose: () => void
  onConfirm: () => void
  children?: React.ReactNode
}

function ActionConfirmationModal({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Annuler',
  items = [],
  warning = 'Cette action peut avoir un impact important et ne doit pas être validée par erreur.',
  isLoading = false,
  confirmDisabled = false,
  tone = 'default',
  onClose,
  onConfirm,
  children,
}: ActionConfirmationModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={isLoading ? () => undefined : onClose} title={title} className="max-w-lg">
      <div className="space-y-5">
        <div className="rounded-xl border border-amber-300/30 bg-amber-300/10 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" />
            <div>
              <p className="text-sm leading-6 text-white/75">{description}</p>
              <p className="mt-2 text-xs leading-5 text-amber-100/80">{warning}</p>
            </div>
          </div>
        </div>

        {items.length > 0 && (
          <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
            {items.map((item) => (
              <div key={item.label} className="flex items-start justify-between gap-4 text-sm">
                <span className="text-white/45">{item.label}</span>
                <span className="text-right font-semibold text-white">{item.value ?? '-'}</span>
              </div>
            ))}
          </div>
        )}

        {children}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            className={`flex-1 ${tone === 'danger' ? 'border border-red-500/50 bg-red-500/20 text-red-100 hover:bg-red-500/30' : ''}`}
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ActionConfirmationModal
