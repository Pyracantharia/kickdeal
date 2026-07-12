'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Users,
  Trophy,
  Globe2,
  Mail,
  ChevronRight,
  UserCheck,
  ArrowRight,
} from 'lucide-react'

import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { getMockJoinResult } from '@/features/club/mockClubs'

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

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const colorIndex = name.charCodeAt(0) % AVATAR_COLORS.length
  const sizeClasses = {
    sm: 'h-10 w-10 text-sm',
    md: 'h-14 w-14 text-lg',
    lg: 'h-20 w-20 text-2xl',
  }
  return (
    <div
      className={`rounded-full ${AVATAR_COLORS[colorIndex]} ${sizeClasses[size]} flex items-center justify-center text-white font-bold shrink-0`}
      aria-hidden="true"
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-gray-400 shrink-0" aria-hidden="true">{icon}</span>
      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
        <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
        <span className="text-sm font-medium text-white">{value}</span>
      </div>
    </div>
  )
}

const NEXT_STEPS = [
  'Accédez au marché des transferts',
  'Consultez les profils des joueurs disponibles',
  'Démarrez vos premières négociations',
]

function ClubJoinedCard() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const code = searchParams.get('code') ?? 'CLUB-DEFAULT'
  const result = getMockJoinResult(code)
  const { club, inviter, yourRole, joinedAt } = result

  return (
    <div className="auth-bg min-h-screen w-full flex flex-col items-center pt-24 pb-12 px-4">
      <div className="w-full max-w-xl flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="rounded-full bg-brand-cyan/10 border-2 border-brand-cyan p-4 shadow-lg shadow-brand-cyan/20">
            <CheckCircle2 className="h-10 w-10 text-brand-cyan" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white uppercase tracking-widest">
              Club rejoint !
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Vous êtes maintenant membre de{' '}
              <span className="text-white font-semibold">{club.name}</span>
            </p>
          </div>
        </div>

        <Card color="cyan" className="w-full p-5">
          <div className="flex items-center gap-4 mb-4">
            <Avatar name={club.name} size="lg" />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white">{club.name}</h2>
              <span className="inline-block mt-1 text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30">
                {yourRole}
              </span>
            </div>
          </div>

          <hr className="border-white/10 mb-4" />

          <div className="flex flex-col gap-3">
            <InfoRow
              icon={<Trophy className="h-4 w-4" />}
              label="Ligue"
              value={club.league}
            />
            <InfoRow
              icon={<Globe2 className="h-4 w-4" />}
              label="Pays"
              value={club.country}
            />
            <InfoRow
              icon={<Users className="h-4 w-4" />}
              label="Membres"
              value={`${club.memberCount} membres`}
            />
            <InfoRow
              icon={<UserCheck className="h-4 w-4" />}
              label="Membre depuis"
              value={joinedAt}
            />
          </div>
        </Card>

        <Card color="purple" className="w-full p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Invitation envoyée par
          </p>
          <div className="flex items-center gap-4">
            <Avatar
              name={inviter.firstname}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold">
                {inviter.firstname} {inviter.lastname}
              </p>
              <p className="text-xs text-brand-purple mt-0.5">{inviter.role}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Mail className="h-3 w-3 text-gray-400 shrink-0" aria-hidden="true" />
                <span className="text-xs text-gray-400 truncate">{inviter.email}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="w-full rounded-xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">
            Prochaines étapes
          </h3>
          <ul className="space-y-2">
            {NEXT_STEPS.map((step) => (
              <li key={step} className="flex items-center gap-2 text-sm text-gray-300">
                <ChevronRight className="h-4 w-4 text-brand-cyan shrink-0" aria-hidden="true" />
                {step}
              </li>
            ))}
          </ul>
        </div>

        <Button type="button" onClick={() => router.push('/dashboard')} icon={<ArrowRight className="h-4 w-4" />} className="w-full">
          Accéder à mon espace
        </Button>

      </div>
    </div>
  )
}

export default ClubJoinedCard