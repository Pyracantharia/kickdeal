'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import countries from 'i18n-iso-countries'
import frLocale from 'i18n-iso-countries/langs/fr.json'
import { ChevronDown, MapPin, Search, X } from 'lucide-react'

import { CountryFlag } from '@/components/media/CountryFlag'

countries.registerLocale(frLocale)

type CountryOption = {
  code: string
  label: string
}

const COUNTRY_OPTIONS: CountryOption[] = Object.entries(countries.getNames('fr'))
  .map(([code, label]) => ({ code, label }))
  .sort((a, b) => a.label.localeCompare(b.label, 'fr'))

type CountrySelectProps = {
  label: string
  value?: string
  onChange: (value: string) => void
  error?: string
  placeholder?: string
}

function CountrySelect({
  label,
  value,
  onChange,
  error,
  placeholder = 'Choisir un pays',
}: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedCountry = useMemo(
    () => COUNTRY_OPTIONS.find((country) => country.label === value),
    [value],
  )

  const filteredCountries = useMemo(() => {
    const normalizedSearch = normalizeSearch(searchTerm)
    if (!normalizedSearch) return COUNTRY_OPTIONS

    return COUNTRY_OPTIONS.filter((country) =>
      normalizeSearch(country.label).includes(normalizedSearch),
    )
  }, [searchTerm])

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  function handleSelect(country: CountryOption) {
    onChange(country.label)
    setSearchTerm('')
    setIsOpen(false)
  }

  function handleClear(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    onChange('')
    setSearchTerm('')
  }

  return (
    <div ref={containerRef} className="country-select relative flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-200">
        {label}
      </label>

      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setIsOpen((current) => !current)
          }
        }}
        className={`flex w-full items-center gap-3 rounded-lg border bg-white/5 px-4 py-3 text-left transition-all focus:outline-none focus-visible:border-emerald-400 focus-visible:ring-1 focus-visible:ring-emerald-400/50 ${
          error ? 'border-red-500' : isOpen ? 'border-emerald-400 ring-1 ring-emerald-400/50' : 'border-white/10'
        }`}
        aria-expanded={isOpen}
      >
        <span className="shrink-0 text-gray-400" aria-hidden="true">
          <MapPin className="h-5 w-5" />
        </span>

        {selectedCountry ? (
          <span className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium text-white">
            <CountryFlag code={selectedCountry.code} country={selectedCountry.label} className="h-4 w-6" />
            <span className="truncate">{selectedCountry.label}</span>
          </span>
        ) : (
          <span className="min-w-0 flex-1 text-sm text-gray-500">{placeholder}</span>
        )}

        {selectedCountry && (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 rounded-full p-1 text-gray-500 transition hover:bg-white/10 hover:text-white"
            aria-label="Effacer le pays"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <ChevronDown
          className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-white/15 bg-[#071722] shadow-2xl shadow-black/40">
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
            <Search className="h-5 w-5 shrink-0 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Rechercher un pays"
              className="country-select-input w-full bg-transparent text-sm text-white placeholder-gray-500 outline-none"
              autoFocus
            />
          </div>

          <div className="max-h-72 overflow-y-auto py-2">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleSelect(country)}
                  className={`country-select-choice flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-white/10 ${
                    value === country.label ? 'bg-brand-cyan/10 text-white' : 'text-white/80'
                  }`}
                >
                  <CountryFlag code={country.code} country={country.label} className="h-4 w-6" />
                  <span className="font-medium">{country.label}</span>
                </button>
              ))
            ) : (
              <p className="px-4 py-6 text-center text-sm text-white/50">
                Aucun pays trouvé.
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export default CountrySelect
