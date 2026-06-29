export const PASSWORD_POLICY_MESSAGE =
  'Le mot de passe doit contenir au moins 12 caracteres, une minuscule, une majuscule, un chiffre et un caractere special.'

export type PasswordRequirement = {
  id: 'length' | 'lowercase' | 'uppercase' | 'number' | 'special'
  label: string
  isMet: boolean
}

export function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    {
      id: 'length',
      label: '12 caracteres minimum',
      isMet: password.length >= 12,
    },
    {
      id: 'lowercase',
      label: 'Une minuscule',
      isMet: /[a-z]/.test(password),
    },
    {
      id: 'uppercase',
      label: 'Une majuscule',
      isMet: /[A-Z]/.test(password),
    },
    {
      id: 'number',
      label: 'Un chiffre',
      isMet: /\d/.test(password),
    },
    {
      id: 'special',
      label: 'Un caractere special',
      isMet: /[^A-Za-z0-9]/.test(password),
    },
  ]
}

export function isStrongPassword(password: string): boolean {
  return getPasswordRequirements(password).every((requirement) => requirement.isMet)
}

export function getPasswordStrength(password: string): { score: number; label: string; tone: string } {
  const score = getPasswordRequirements(password).filter((requirement) => requirement.isMet).length

  if (!password) {
    return { score, label: 'Non renseigne', tone: 'bg-white/10' }
  }

  if (score <= 2) {
    return { score, label: 'Faible', tone: 'bg-red-400' }
  }

  if (score <= 4) {
    return { score, label: 'Moyen', tone: 'bg-amber-300' }
  }

  return { score, label: 'Fort', tone: 'bg-emerald-400' }
}
