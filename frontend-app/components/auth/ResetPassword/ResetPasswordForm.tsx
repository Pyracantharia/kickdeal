'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

import PasswordStrengthMeter from '@/components/account/PasswordStrengthMeter'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { authManager } from '@/features/auth/auth'
import { isStrongPassword, PASSWORD_POLICY_MESSAGE } from '@/features/account/passwordPolicy'

function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [newPassword, setNewPassword] = React.useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = React.useState('')
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!token) {
      setErrorMessage('Lien de reinitialisation invalide.')
      return
    }

    if (newPassword !== newPasswordConfirm) {
      setErrorMessage('Les mots de passe ne correspondent pas.')
      return
    }

    if (!isStrongPassword(newPassword)) {
      setErrorMessage(PASSWORD_POLICY_MESSAGE)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await authManager.resetPassword(token, { newPassword, newPasswordConfirm })

      if (!response.ok) {
        const data = response.data as { errors?: Record<string, string>; errorMessage?: string; message?: string }
        setErrorMessage(data.errors?.newPassword ?? data.errorMessage ?? data.message ?? 'Impossible de modifier le mot de passe.')
        return
      }

      setSuccessMessage(response.data.message ?? 'Mot de passe modifie avec succes.')
      setTimeout(() => router.push('/auth/login'), 1400)
    } catch {
      setErrorMessage('Impossible de modifier le mot de passe.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      {errorMessage && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400" role="alert">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-center text-sm text-emerald-200" role="status">
          {successMessage}
        </div>
      )}

      <div>
        <Input
          label="Nouveau mot de passe"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          autoFocus
        />
        <PasswordStrengthMeter password={newPassword} />
      </div>

      <Input
        label="Confirmer le mot de passe"
        type="password"
        placeholder="••••••••"
        autoComplete="new-password"
        value={newPasswordConfirm}
        onChange={(event) => setNewPasswordConfirm(event.target.value)}
      />

      <Button type="submit" isLoading={isSubmitting} icon={<ArrowRight className="h-4 w-4" />} className="w-full">
        Modifier le mot de passe
      </Button>
    </form>
  )
}

export default ResetPasswordForm
