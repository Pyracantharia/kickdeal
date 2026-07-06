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
        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-3xl border border-brand-cyan/40 bg-white/10 shadow-[0_0_40px_rgba(0,245,212,0.22)]"
        sizes="96px"
        imageClassName="object-contain p-3"
        fallback={<ClubLogoFallback club={club} />}
      />
    )
  }

  return <ClubLogoFallback club={club} />
}

function ClubLogoFallback({ club }: { club: ClubDetail }) {
  return (
    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-brand-cyan/40 bg-white/10 text-4xl font-black text-white shadow-[0_0_40px_rgba(0,245,212,0.22)]">
      {(club.logo || club.name.charAt(0)).toUpperCase()}
    </div>
  )
}

export function InfoCard({ label, value }: { label: string; value: string; tone?: Tone }) {
  return (
    <div className="rounded-2xl border border-brand-cyan/30 bg-[#071722]/95 px-4 py-3 shadow-xl shadow-black/25 backdrop-blur">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-white/45">{label}</p>
      <p className="mt-1 text-2xl font-black leading-none text-brand-cyan">{value}</p>
    </div>
  )
}

export function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number; tone?: Tone }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-brand-cyan/28 bg-[#071722]/95 p-4 shadow-xl shadow-black/30 transition hover:-translate-y-1 hover:border-brand-cyan/55 hover:shadow-brand-cyan/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(0,245,212,0.12),transparent_42%)] opacity-80 transition group-hover:opacity-100" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="rounded-2xl border border-brand-cyan/22 bg-brand-cyan/10 p-2.5 text-brand-cyan">{icon}</div>
        <p className="text-3xl font-black leading-none text-white">{value}</p>
      </div>
      <p className="relative mt-5 text-xs font-bold uppercase tracking-[0.16em] text-white/55">{label}</p>
    </div>
  )
}

export function FinanceCard({ label, value }: { label: string; value: string; tone?: Tone }) {
  return (
    <div className="rounded-3xl border border-brand-cyan/24 bg-[#061923]/95 p-4 shadow-xl shadow-black/20">
      <p className="mb-3 min-h-8 text-[0.68rem] font-bold uppercase leading-4 tracking-[0.16em] text-white/45">{label}</p>
      <p className="whitespace-nowrap text-2xl font-black leading-none text-brand-cyan 2xl:text-3xl">{value}</p>
    </div>
  )
}

export function ActionCard({
  title,
  description,
  icon,
  href,
  onClick,
}: {
  title: string
  description: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
  tone?: Tone
}) {
  const content = (
    <div className="group relative min-h-44 cursor-pointer overflow-hidden rounded-3xl border border-brand-cyan/32 bg-[#071722]/95 p-5 shadow-2xl shadow-black/30 transition-all hover:-translate-y-1 hover:border-brand-cyan/65 hover:shadow-brand-cyan/12">
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/5 transition group-hover:scale-125" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(0,245,212,0.10),transparent_44%)]" />
      <div className="relative flex h-full flex-col justify-between gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="rounded-2xl border border-brand-cyan/30 bg-brand-cyan/10 p-3 text-brand-cyan">{icon}</div>
          <span className="text-2xl text-white/35 transition group-hover:translate-x-1 group-hover:text-white">→</span>
        </div>
        <div>
          <p className="text-xl font-black text-white">{title}</p>
          <p className="mt-2 text-sm leading-5 text-white/58">{description}</p>
        </div>
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
