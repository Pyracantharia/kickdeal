'use client'

import React from 'react'

import { CountryFlag } from '@/components/media/CountryFlag'
import Modal from '@/components/ui/Modal'
import type { LeagueCountry } from '@/features/market/types/player'

interface CountrySearchModalProps {
  isOpen: boolean
  onClose: () => void
  countries: LeagueCountry[]
  onSelect: (country: LeagueCountry) => void
  selectedCountryId?: string
}

function CountrySearchModal({
  isOpen,
  onClose,
  countries,
  onSelect,
  selectedCountryId,
}: CountrySearchModalProps) {
  function handleSelect(country: LeagueCountry) {
    onSelect(country)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choisir un pays">
      <div className="space-y-2">
        {countries.map((country) => (
          <button
            key={country.id}
            type="button"
            onClick={() => handleSelect(country)}
            className={`flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left transition-all ${
              selectedCountryId === country.id
                ? 'border-brand-cyan bg-brand-cyan/10 text-white'
                : 'border-white/10 bg-white/5 text-white/80 hover:border-brand-cyan/50 hover:bg-white/10'
            }`}
          >
            <CountryFlag code={country.countryCode} country={country.label} className="h-5 w-7" />
            <span className="font-semibold">{country.label}</span>
          </button>
        ))}
      </div>
    </Modal>
  )
}

export default CountrySearchModal
