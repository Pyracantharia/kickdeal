'use client'

import React from 'react'
import { ArrowRight, Mail } from 'lucide-react'

import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { authManager } from '@/features/auth/auth'

function ForgotPasswordForm() {
  const [email, setEmail] = React.useState('')
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!email.trim()) {
      setErrorMessage("L'email est requis.")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await authManager.forgotPassword(email.trim())

      if (!response.ok) {
        const data = response.data as { errorMessage?: string; message?: string }
        setErrorMessage(data.errorMessage ?? data.message ?? "Impossible d'envoyer l'email.")
        return
      }

      setSuccessMessage(response.data.message ?? 'Un email de reinitialisation vient de vous etre envoye.')
    } catch {
      setErrorMessage("Impossible d'envoyer l'email.")
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

      <Input
        label="Email"
        type="email"
        placeholder="votre@email.com"
        icon={<Mail className="h-5 w-5" />}
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoFocus
      />

      <Button type="submit" isLoading={isSubmitting} icon={<ArrowRight className="h-4 w-4" />} className="w-full">
        Envoyer le lien
      </Button>
    </form>
  )
}

export default ForgotPasswordForm
