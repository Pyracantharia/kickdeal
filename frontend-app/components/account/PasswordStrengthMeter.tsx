'use client'

import { Check, X } from 'lucide-react'

import { getPasswordRequirements, getPasswordStrength } from '@/features/account/passwordPolicy'

function PasswordStrengthMeter({ password }: { password: string }) {
  const requirements = getPasswordRequirements(password)
  const strength = getPasswordStrength(password)
  const width = `${(strength.score / requirements.length) * 100}%`

  return (
    <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase text-white/60">Force du mot de passe</span>
        <span className="text-sm font-semibold text-white">{strength.label}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full transition-all ${strength.tone}`} style={{ width }} />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {requirements.map((requirement) => (
          <div
            key={requirement.id}
            className={`flex items-center gap-2 text-xs ${
              requirement.isMet ? 'text-emerald-300' : 'text-white/50'
            }`}
          >
            {requirement.isMet ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
            <span>{requirement.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PasswordStrengthMeter
