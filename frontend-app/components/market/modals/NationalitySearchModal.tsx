'use client'

import React, { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import type { Nationality } from '@/features/market/types/player'

interface NationalitySearchModalProps {
  isOpen: boolean
  onClose: () => void
  nationalities: Nationality[]
  onSelect: (nationality: Nationality) => void
  selectedNationalityId?: string
}

function NationalitySearchModal({
  isOpen,
  onClose,
  nationalities,
  onSelect,
  selectedNationalityId,
}: NationalitySearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredNationalities = useMemo(() => {
    if (!searchTerm.trim()) return nationalities
    const lowerTerm = searchTerm.toLowerCase()
    return nationalities.filter((n) => n.label.toLowerCase().includes(lowerTerm))
  }, [searchTerm, nationalities])

  const handleSelectNationality = (nationality: Nationality) => {
    onSelect(nationality)
    setSearchTerm('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Recherche par nationalité">
      <div className="flex flex-col gap-4">
        <Input
          label="Pays"
          placeholder="France"
          icon={<Search className="h-5 w-5" />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
        />

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {filteredNationalities.map((nationality) => (
            <button
              key={nationality.id}
              onClick={() => handleSelectNationality(nationality)}
              className={`w-full rounded-lg border-2 p-3 text-left transition-all flex items-center gap-3 ${
                selectedNationalityId === nationality.id
                  ? 'border-brand-cyan bg-brand-cyan/10 text-white'
                  : 'border-white/10 bg-white/5 text-white/80 hover:border-brand-cyan/50 hover:bg-white/10'
              }`}
            >
              <span className="text-xl">{nationality.flag}</span>
              <p className="font-semibold">{nationality.label}</p>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}

export default NationalitySearchModal