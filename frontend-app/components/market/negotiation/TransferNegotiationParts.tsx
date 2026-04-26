'use client'

import React from 'react'

import CircleImage from '@/components/media/CircleImage'
import { formatNumberInput } from '@/features/format/number'
import type { TransferNegotiationContext } from '@/features/market/types/transfer'

export function PlayerSummary({ context }: { context: TransferNegotiationContext }) {
  const player = context.player

  return (
    <section className="rounded-2xl border border-brand-cyan/25 bg-[#071722]/85 bg-gradient-to-r from-white/8 to-brand-cyan/10 p-6 shadow-2xl shadow-brand-cyan/10">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-6">
          <CircleImage
            src={player.photoUrl}
            alt={`${player.firstName} ${player.lastName}`}
            className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-brand-purple bg-white/10"
            sizes="80px"
            fallback={<div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-purple/20 font-bold text-white">{player.firstName.charAt(0)}{player.lastName.charAt(0)}</div>}
          />
          <div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/65">
              <span className="text-brand-cyan">{player.nationality}</span>
              <span>{player.position}</span>
              <span>Âge <strong className="text-white">{player.age}</strong></span>
            </div>
            <h2 className="mt-2 text-2xl font-bold uppercase text-white">{player.firstName} {player.lastName}</h2>
          </div>
          <TeamLogo name={context.sellerTeam.name} logoUrl={context.sellerTeam.logoUrl} />
        </div>

        <div className="text-left md:text-right">
          <p className="text-sm text-white/55">Valeur estimée</p>
          <p className="text-3xl font-bold text-brand-cyan">{player.marketValue}</p>
        </div>
      </div>
    </section>
  )
}

export function TeamLogo({ name, logoUrl, size = 'md' }: { name: string; logoUrl?: string | null; size?: 'sm' | 'md' }) {
  const className = size === 'sm' ? 'relative h-10 w-10 overflow-hidden rounded-full bg-white/10' : 'relative h-16 w-16 overflow-hidden rounded-full bg-white/10'
  const fallbackClassName = size === 'sm' ? 'flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white' : 'flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-xl font-bold text-white'

  return (
    <CircleImage
      src={logoUrl}
      alt={name}
      className={className}
      sizes={size === 'sm' ? '40px' : '64px'}
      imageClassName="object-contain p-1.5"
      fallback={<div className={fallbackClassName}>{name.charAt(0).toUpperCase()}</div>}
    />
  )
}

export function ChoiceButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-5 py-3 text-sm font-semibold transition ${
        active
          ? 'border-brand-purple bg-gradient-to-r from-brand-purple/45 to-brand-cyan/25 text-white'
          : 'border-brand-cyan/25 bg-white/5 text-white/55 hover:border-brand-cyan/50 hover:text-white'
      }`}
    >
      {label}
    </button>
  )
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-2 block text-sm font-medium text-white/65">{children}</span>
}

export function MoneyInput({ value, onChange, placeholder, required }: { value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <div className="relative">
      <input
        className="w-full rounded-xl border border-brand-cyan/30 bg-white/5 px-4 py-3 pr-10 text-white outline-none transition focus:border-brand-cyan"
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(formatNumberInput(event.target.value))}
        placeholder={placeholder}
        required={required}
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-cyan">€</span>
    </div>
  )
}

export function TextInput({
  value,
  onChange,
  placeholder,
  inputMode,
  suffix,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  suffix?: string
}) {
  return (
    <div className="relative">
      <input
        className="w-full rounded-xl border border-brand-cyan/30 bg-white/5 px-4 py-3 pr-10 text-white outline-none transition focus:border-brand-cyan"
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-cyan">{suffix}</span>}
    </div>
  )
}

export function ToggleRow({
  label,
  description,
  checked,
  onChange,
  tone = 'cyan',
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  tone?: 'cyan' | 'purple'
}) {
  return (
    <div className="mt-5 flex items-center justify-between gap-4">
      <div>
        <p className="font-medium text-white/70">{label}</p>
        {description && <p className="mt-1 text-xs text-white/45">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`flex h-7 w-14 items-center rounded-full p-1 transition ${checked ? (tone === 'cyan' ? 'bg-brand-cyan' : 'bg-brand-purple') : 'bg-white/20'}`}
        aria-pressed={checked}
      >
        <span className={`h-5 w-5 rounded-full bg-white transition ${checked ? 'translate-x-7' : ''}`} />
      </button>
    </div>
  )
}

export function SummaryLine({ label, value, highlight, strong }: { label: string; value: string; highlight?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-brand-cyan/20 py-4">
      <span className="text-sm text-white/55">{label}</span>
      <span className={`${strong ? 'text-2xl font-bold text-white' : highlight ? 'font-bold text-brand-cyan' : 'font-semibold text-white'}`}>{value}</span>
    </div>
  )
}