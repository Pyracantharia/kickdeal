'use client'

import React, { useMemo, useState } from 'react'
import { Search, CheckCircle2 } from 'lucide-react'
import type { Club } from '@/features/club/mockClubs'

interface StepSelectClubProps {
  clubs: Club[]
  selectedClub: Club | null
  onSelect: (club: Club | null) => void
}

const AVATAR_COLORS = [
  'bg-purple-600',
  'bg-cyan-600',
  'bg-blue-600',
  'bg-emerald-600',
  'bg-red-600',
  'bg-orange-500',
  'bg-pink-600',
  'bg-indigo-600',
]

function ClubAvatar({ name }: { name: string }) {
  const colorIndex = name.charCodeAt(0) % AVATAR_COLORS.length
  return (
    <div
      className={`h-10 w-10 rounded-full ${AVATAR_COLORS[colorIndex]} flex items-center justify-center text-white font-bold text-sm shrink-0`}
      aria-hidden="true"
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function StepSelectClub({ clubs, selectedClub, onSelect }: StepSelectClubProps) {
  const [query, setQuery] = useState(selectedClub?.name ?? '')

  const filtered = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return clubs.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.league.toLowerCase().includes(q),
    )
  }, [query, clubs])

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setQuery(value)
    if (selectedClub && value !== selectedClub.name) {
      onSelect(null)
    }
  }

  function handleSelect(club: Club) {
    onSelect(club)
    setQuery(club.name)
  }

  const showResults = query.trim().length > 0

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-bold text-white uppercase mb-1">Sélection du club</h2>
        <p className="text-sm text-gray-300">
          Sélectionnez votre club pour préremplir automatiquement les informations disponibles.
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
          Rechercher un club
        </label>
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 transition-all focus-within:border-brand-cyan focus-within:ring-1 focus-within:ring-brand-cyan/50">
          <Search className="h-5 w-5 text-gray-400 shrink-0" aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Nom du club, pays ou ligue..."
            className="w-full bg-transparent text-sm text-white placeholder-gray-500 outline-none"
            autoComplete="off"
          />
        </div>
      </div>

      {showResults && (
        <div className="rounded-lg border border-white/10 overflow-hidden">
          <div className="max-h-[204px] overflow-y-auto divide-y divide-white/10">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                Aucun club trouvé
              </div>
            ) : (
              filtered.map((club) => {
                const isSelected = selectedClub?.id === club.id
                return (
                  <button
                    key={club.id}
                    type="button"
                    onClick={() => handleSelect(club)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all
                      ${isSelected
                        ? 'bg-brand-cyan/10 border-l-2 border-l-brand-cyan'
                        : 'bg-white/5 hover:bg-white/10'
                      }
                    `}
                  >
                    <ClubAvatar name={club.name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{club.name}</p>
                      <p className="text-xs text-gray-400">
                        {club.league} • {club.country}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-brand-cyan shrink-0" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default StepSelectClub