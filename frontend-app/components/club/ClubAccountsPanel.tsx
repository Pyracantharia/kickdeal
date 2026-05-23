'use client'

import React, { useState } from 'react'
import { Check, Copy, Crown, Mail, ShieldCheck, UserPlus } from 'lucide-react'

import Button from '@/components/ui/Button'
import type { ClubAccounts } from '@/features/club/types/club'

function ClubAccountsPanel({ accounts }: { accounts: ClubAccounts }) {
  const [notice, setNotice] = useState<string | null>(null)
  const seatsValue = accounts.seats.unlimited
    ? `${accounts.seats.used} membres · illimité`
    : `${accounts.seats.used} / ${accounts.seats.included ?? 0} comptes utilisés`
  const seatsRemaining = accounts.seats.unlimited
    ? 'Vous pouvez inviter autant de membres que nécessaire.'
    : `${accounts.seats.remaining ?? 0} place${(accounts.seats.remaining ?? 0) > 1 ? 's' : ''} restante${(accounts.seats.remaining ?? 0) > 1 ? 's' : ''}.`

  async function copyInvitationCode() {
    try {
      await navigator.clipboard.writeText(accounts.invitationCode)
      setNotice('Code d’invitation copié.')
    } catch {
      setNotice('Impossible de copier automatiquement le code.')
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-brand-cyan/30 bg-[#071722]/95 p-6 shadow-2xl shadow-brand-cyan/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-cyan">Places club</p>
            <p className="mt-2 text-3xl font-bold text-white">{seatsValue}</p>
            <p className="mt-1 text-sm text-white/60">{seatsRemaining}</p>
          </div>
          <div className="rounded-full border border-brand-purple/40 bg-brand-purple/15 px-4 py-2 text-sm font-bold text-white">
            {accounts.seats.unlimited ? 'Enterprise' : 'Places limitées'}
          </div>
        </div>
      </section>

      {accounts.canManage && (
        <section className="rounded-2xl border border-brand-purple/35 bg-[#111827]/95 p-6 shadow-2xl shadow-brand-purple/10">
          <div className="flex items-center gap-3">
            <UserPlus className="h-6 w-6 text-brand-purple" />
            <div>
              <p className="text-lg font-semibold text-white">Inviter un membre</p>
              <p className="text-sm text-white/60">Le nouvel utilisateur devra saisir ce code depuis l’écran pour rejoindre un club existant.</p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <code className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/25 px-4 py-3 text-sm font-semibold text-brand-cyan">
              {accounts.invitationCode}
            </code>
            <Button type="button" variant="secondary" className="shrink-0 bg-[#172033]" onClick={copyInvitationCode}>
              <Copy className="h-4 w-4" />
              Copier
            </Button>
          </div>
          {notice && (
            <p className="mt-3 rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-2 text-sm text-white">
              {notice}
            </p>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-[#071722]/92 p-6 shadow-2xl shadow-black/20">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-lg font-semibold text-white">Comptes rattachés</p>
          <span className="text-sm text-white/55">{accounts.members.length} membre{accounts.members.length > 1 ? 's' : ''}</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {accounts.members.map((member) => (
            <div key={member.id} className="rounded-xl border border-white/10 bg-[#0c1a25] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-cyan/35 bg-brand-cyan/10 text-sm font-bold text-brand-cyan">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-white">{member.name}</p>
                      {member.isPrimary && <Crown className="h-4 w-4 text-brand-purple" />}
                    </div>
                    {member.email && (
                      <p className="mt-1 flex items-center gap-1 truncate text-xs text-white/55">
                        <Mail className="h-3.5 w-3.5" />
                        {member.email}
                      </p>
                    )}
                  </div>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-cyan/25 bg-brand-cyan/10 px-3 py-1 text-xs font-semibold text-brand-cyan">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {member.roleLabel}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default ClubAccountsPanel