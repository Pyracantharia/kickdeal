'use client'

import React from 'react'

import CircleImage from '@/components/media/CircleImage'
import type { ClubDetail } from '@/features/club/types/club'

type Tone = 'cyan' | 'purple'

export function ClubLogo({ club }: { club: ClubDetail }) {
  if (club.logoUrl) {
    return (
      <CircleImage
        src={club.logoUrl}
        alt={club.name}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-brand-cyan bg-white/10 shadow-[0_0_28px_rgba(0,245,212,0.22)]"
        sizes="80px"
        imageClassName="object-contain p-2"
        fallback={<ClubLogoFallback club={club} />}
      />
    )
  }

  return <ClubLogoFallback club={club} />
}

function ClubLogoFallback({ club }: { club: ClubDetail }) {
  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-brand-cyan bg-white/10 text-3xl font-bold text-white shadow-[0_0_28px_rgba(0,245,212,0.22)]">
      {(club.logo || club.name.charAt(0)).toUpperCase()}
    </div>
  )
}

export function InfoCard({ label, value, tone = 'cyan' }: { label: string; value: string; tone?: Tone }) {
  const styles = tone === 'cyan'
    ? 'border-brand-cyan/50 bg-brand-cyan/10 text-brand-cyan'
    : 'border-brand-purple/50 bg-brand-purple/12 text-brand-purple'

  return (
    <div className={`min-w-28 rounded-lg border-2 px-3 py-2 text-center ${styles}`}>
      <p className="text-xs text-white/75">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  )
}

export function StatCard({ icon, label, value, tone = 'cyan' }: { icon: React.ReactNode; label: string; value: number; tone?: Tone }) {
  const styles = tone === 'cyan'
    ? 'border-brand-cyan/35 bg-brand-cyan/10 text-brand-cyan'
    : 'border-brand-purple/35 bg-brand-purple/12 text-brand-purple'

  return (
    <div className={`rounded-lg border-2 p-4 flex flex-col items-center gap-2 text-center transition hover:-translate-y-0.5 hover:border-white/35 ${styles}`}>
      <div>{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-white/75">{label}</p>
    </div>
  )
}

export function FinanceCard({ label, value, tone = 'cyan' }: { label: string; value: string; tone?: Tone }) {
  const valueColor = tone === 'cyan' ? 'text-brand-cyan' : 'text-brand-purple'

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
      <p className="text-xs text-white/70 mb-2">{label}</p>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  )
}

export function ActionCard({
  title,
  description,
  icon,
  href,
  onClick,
  tone = 'cyan',
}: {
  title: string
  description: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
  tone?: Tone
}) {
  const styles = tone === 'cyan'
    ? 'border-brand-cyan/40 bg-[#0b202a] hover:border-brand-cyan/70 hover:bg-[#0f2a35]'
    : 'border-brand-purple/40 bg-[#191629] hover:border-brand-purple/70 hover:bg-[#211b35]'
  const iconColor = tone === 'cyan' ? 'text-brand-cyan' : 'text-brand-purple'

  const content = (
    <div className={`rounded-lg border-2 p-4 transition-all cursor-pointer group ${styles}`}>
      <div className="flex items-center gap-4">
        <div className={iconColor}>{icon}</div>
        <div className="flex-1">
          <p className="font-semibold text-white">{title}</p>
          <p className="text-sm text-white/75">{description}</p>
        </div>
        <span className={`${iconColor} opacity-0 group-hover:opacity-100 transition-opacity`}>→</span>
      </div>
    </div>
  )

  if (href) {
    return <a href={href}>{content}</a>
  }

  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      {content}
    </button>
  )
}