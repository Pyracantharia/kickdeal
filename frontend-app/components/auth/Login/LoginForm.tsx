'use client'

import React from 'react'
import { Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react'

import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { authManager } from '@/features/auth/auth'
import Link from 'next/link'

type LoginFormData = {
  email: string
  password: string
  twoFactorCode: string
}

type LoginFormErrors = Partial<Record<keyof LoginFormData | 'root', string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function LoginForm() {
  const [requiresTwoFactor, setRequiresTwoFactor] = React.useState(false)
  const [formData, setFormData] = React.useState<LoginFormData>({
    email: '',
    password: '',
    twoFactorCode: '',
  })
  const [errors, setErrors] = React.useState<LoginFormErrors>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  function updateField(field: keyof LoginFormData, value: string) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      root: undefined,
    }))
  }

  function validateForm(data: LoginFormData): LoginFormErrors {
    const nextErrors: LoginFormErrors = {}

    if (!data.email.trim()) {
      nextErrors.email = 'Email requis'
    } else if (!EMAIL_PATTERN.test(data.email)) {
      nextErrors.email = 'Email invalide'
    }

    if (!data.password) {
      nextErrors.password = 'Mot de passe requis'
    }

    if (requiresTwoFactor && !data.twoFactorCode.trim()) {
      nextErrors.twoFactorCode = 'Code requis'
    }

    return nextErrors
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationErrors = validateForm(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        ...(requiresTwoFactor ? { twoFactorCode: formData.twoFactorCode } : {}),
      }
      const response = await authManager.login(payload)

      if (response.status === 202 && response.data.requiresTwoFactor) {
        setRequiresTwoFactor(true)
        setErrors({})
        return
      }

      if (!response.ok) {
        if (response.status === 429) {
          setErrors({
            root: 'Trop de tentatives de connexion echouees. Veuillez patienter quelques minutes avant de reessayer.',
          })
          return
        }

        const errorData = response.data as unknown as {
          errors?: Record<string, string>
          errorMessage?: string
          message?: string
          error?: string
        }

        if (errorData.errors?.twoFactorCode) {
          setRequiresTwoFactor(true)
          setErrors({ twoFactorCode: errorData.errors.twoFactorCode })
          return
        }

        const rawServerMessage =
          errorData?.errorMessage ||
          errorData?.message ||
          errorData?.error ||
          'Identifiants invalides'

        const serverMessage = getLoginErrorMessage(rawServerMessage)

        setErrors({ root: serverMessage })
        return
      }

      const requestedPlan = new URLSearchParams(window.location.search).get('plan')
      const invitationToken = new URLSearchParams(window.location.search).get('invitationToken')
      const payablePlans = ['agent_pro', 'club_pro', 'club_enterprise']
      if (invitationToken && response.data.user.roles.includes('ROLE_AGENT')) {
        const { transfersManager } = await import('@/features/market/transfers')

        await transfersManager.claimAgentInvitation(invitationToken)
        navigateAfterLogin('/negociations')
        return
      }

      navigateAfterLogin(response.data.user.passwordExpired
        ? '/account'
        : requestedPlan && payablePlans.includes(requestedPlan)
          ? `/subscription?plan=${requestedPlan}`
          : '/dashboard')
    } catch {
      setErrors({
        root: 'Une erreur est survenue. Veuillez réessayer.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {errors.root && (
        <div
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400"
          role="alert"
        >
          {errors.root}
        </div>
      )}

      <Input
        label="Email"
        type="email"
        placeholder="votre@email.com"
        icon={<Mail className="h-5 w-5" />}
        error={errors.email}
        autoComplete="email"
        autoFocus
        name="email"
        value={formData.email}
        onChange={(event) => updateField('email', event.target.value)}
      />

      <Input
        label="Mot de passe"
        type="password"
        placeholder="••••••••"
        icon={<Lock className="h-5 w-5" />}
        error={errors.password}
        autoComplete="current-password"
        name="password"
        value={formData.password}
        onChange={(event) => updateField('password', event.target.value)}
      />

      {requiresTwoFactor && (
        <Input
          label="Code 2FA"
          type="text"
          inputMode="numeric"
          placeholder="123456"
          icon={<ShieldCheck className="h-5 w-5" />}
          error={errors.twoFactorCode}
          autoComplete="one-time-code"
          autoFocus
          name="twoFactorCode"
          value={formData.twoFactorCode}
          onChange={(event) => updateField('twoFactorCode', event.target.value)}
        />
      )}

      <div className="flex justify-end">
        <Link href="/auth/forgot-password" className="text-sm font-semibold text-brand-purple transition-colors hover:opacity-80 focus:outline-none focus-visible:underline">
          Mot de passe oublié ?
        </Link>
      </div>

      <Button type="submit" isLoading={isSubmitting} icon={<ArrowRight className="h-4 w-4" />} className="w-full mt-1">
        {requiresTwoFactor ? 'Valider le code' : 'Se connecter'}
      </Button>
    </form>
  )
}

function navigateAfterLogin(path: string) {
  window.location.assign(path)
}

function getLoginErrorMessage(message: string): string {
  if (message === 'Invalid credentials.') {
    return 'Identifiants invalides.'
  }

  if (message.toLowerCase().includes('too many failed login attempts')) {
    return 'Trop de tentatives de connexion echouees. Veuillez reessayer dans 15 minutes.'
  }

  return message
}

export default LoginForm
