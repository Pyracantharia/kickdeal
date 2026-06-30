'use client'

import React, { useEffect, useState } from 'react'
import { KeyRound, QrCode, ShieldCheck, ShieldOff } from 'lucide-react'

import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import PasswordStrengthMeter from '@/components/account/PasswordStrengthMeter'
import { accountManager, type TwoFactorSetup } from '@/features/account/account'
import { isStrongPassword } from '@/features/account/passwordPolicy'
import { authManager } from '@/features/auth/auth'
import { useAuth } from '@/context/AuthProvider'

type FieldErrors = Record<string, string>

function AccountSecurityPage() {
  const { user, updateUser } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    newPasswordConfirm: '',
  })
  const [disablePassword, setDisablePassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<FieldErrors>({})
  const [twoFactorErrors, setTwoFactorErrors] = useState<FieldErrors>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isSettingUp2fa, setIsSettingUp2fa] = useState(false)
  const [isConfirming2fa, setIsConfirming2fa] = useState(false)
  const [isDisabling2fa, setIsDisabling2fa] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadSecurity() {
      try {
        const response = await accountManager.getSecurity()

        if (isMounted && response.ok) {
          setTwoFactorEnabled(response.data.twoFactorEnabled)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadSecurity()

    return () => {
      isMounted = false
    }
  }, [])

  function readErrors(data: unknown, fallback: string): FieldErrors {
    if (typeof data === 'object' && data !== null && 'errors' in data) {
      const errors = (data as { errors?: unknown }).errors

      if (typeof errors === 'object' && errors !== null) {
        return Object.fromEntries(
          Object.entries(errors as Record<string, unknown>).map(([field, message]) => [
            field,
            typeof message === 'string' ? message : fallback,
          ]),
        )
      }
    }

    if (typeof data === 'object' && data !== null && 'errorMessage' in data) {
      const message = (data as { errorMessage?: unknown }).errorMessage
      return { root: typeof message === 'string' ? message : fallback }
    }

    return { root: fallback }
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordErrors({})
    setSuccessMessage(null)

    if (passwordForm.newPassword !== passwordForm.newPasswordConfirm) {
      setPasswordErrors({ newPasswordConfirm: 'Les mots de passe ne correspondent pas.' })
      return
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordErrors({ newPassword: 'Le nouveau mot de passe doit etre different de l ancien.' })
      return
    }

    if (!isStrongPassword(passwordForm.newPassword)) {
      setPasswordErrors({
        newPassword: 'Le mot de passe doit contenir au moins 12 caracteres, une minuscule, une majuscule, un chiffre et un caractere special.',
      })
      return
    }

    setIsChangingPassword(true)

    try {
      const response = await accountManager.changePassword(passwordForm)

      if (!response.ok) {
        setPasswordErrors(readErrors(response.data, 'Impossible de modifier le mot de passe.'))
        return
      }

      setPasswordForm({ currentPassword: '', newPassword: '', newPasswordConfirm: '' })
      const meResponse = await authManager.me()

      if (meResponse.ok) {
        updateUser(meResponse.data)
      }

      setSuccessMessage('Mot de passe modifie avec succes.')
    } catch {
      setPasswordErrors({ root: 'Impossible de modifier le mot de passe.' })
    } finally {
      setIsChangingPassword(false)
    }
  }

  async function handleSetup2fa() {
    setTwoFactorErrors({})
    setSuccessMessage(null)
    setIsSettingUp2fa(true)

    try {
      const response = await accountManager.setupTwoFactor()

      if (!response.ok) {
        setTwoFactorErrors(readErrors(response.data, 'Impossible de preparer la 2FA.'))
        return
      }

      setSetup(response.data)
      setVerificationCode('')
    } catch {
      setTwoFactorErrors({ root: 'Impossible de preparer la 2FA.' })
    } finally {
      setIsSettingUp2fa(false)
    }
  }

  async function handleConfirm2fa(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTwoFactorErrors({})
    setSuccessMessage(null)
    setIsConfirming2fa(true)

    try {
      const response = await accountManager.confirmTwoFactor(verificationCode)

      if (!response.ok) {
        setTwoFactorErrors(readErrors(response.data, 'Code de verification invalide.'))
        return
      }

      setTwoFactorEnabled(true)
      setSetup(null)
      setVerificationCode('')
      setSuccessMessage('Authentification a deux facteurs activee.')
    } catch {
      setTwoFactorErrors({ root: 'Impossible de confirmer la 2FA.' })
    } finally {
      setIsConfirming2fa(false)
    }
  }

  async function handleDisable2fa(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTwoFactorErrors({})
    setSuccessMessage(null)
    setIsDisabling2fa(true)

    try {
      const response = await accountManager.disableTwoFactor(disablePassword)

      if (!response.ok) {
        setTwoFactorErrors(readErrors(response.data, 'Impossible de desactiver la 2FA.'))
        return
      }

      setTwoFactorEnabled(false)
      setDisablePassword('')
      setSuccessMessage('Authentification a deux facteurs desactivee.')
    } catch {
      setTwoFactorErrors({ root: 'Impossible de desactiver la 2FA.' })
    } finally {
      setIsDisabling2fa(false)
    }
  }

  if (isLoading) {
    return (
      <div className="auth-bg flex min-h-screen w-full items-center justify-center px-4 pt-28">
        <p className="text-white/60">Chargement des reglages...</p>
      </div>
    )
  }

  return (
    <div className="auth-bg min-h-screen w-full px-4 pb-12 pt-28 md:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase text-brand-cyan">Compte</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Securite du compte</h1>
        </header>

        {successMessage && (
          <div className="mb-6 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            {successMessage}
          </div>
        )}

        {user?.passwordExpired && (
          <div className="mb-6 rounded-lg border border-amber-300/35 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
            Votre mot de passe a expiré. Veuillez le modifier pour continuer a utiliser votre compte.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.85fr)]">
          <section className="rounded-lg border border-white/10 bg-[#071722]/88 p-6">
            <div className="mb-5 flex items-center gap-3">
              <KeyRound className="h-5 w-5 text-brand-cyan" />
              <h2 className="text-xl font-bold text-white">Mot de passe</h2>
            </div>

            {passwordErrors.root && (
              <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {passwordErrors.root}
              </p>
            )}

            <form className="space-y-4" onSubmit={handlePasswordSubmit}>
              <Input
                label="Mot de passe actuel"
                type="password"
                autoComplete="current-password"
                value={passwordForm.currentPassword}
                error={passwordErrors.currentPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
              />
              <div>
                <Input
                  label="Nouveau mot de passe"
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.newPassword}
                  error={passwordErrors.newPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                />
                <PasswordStrengthMeter password={passwordForm.newPassword} />
              </div>
              <Input
                label="Confirmer le nouveau mot de passe"
                type="password"
                autoComplete="new-password"
                value={passwordForm.newPasswordConfirm}
                error={passwordErrors.newPasswordConfirm}
                onChange={(event) => setPasswordForm((current) => ({ ...current, newPasswordConfirm: event.target.value }))}
              />
              <Button type="submit" isLoading={isChangingPassword} className="w-full sm:w-auto">
                Modifier le mot de passe
              </Button>
            </form>
          </section>

          <section className="rounded-lg border border-white/10 bg-[#071722]/88 p-6">
            <div className="mb-5 flex items-center gap-3">
              {twoFactorEnabled ? (
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
              ) : (
                <QrCode className="h-5 w-5 text-brand-cyan" />
              )}
              <h2 className="text-xl font-bold text-white">Authentification 2FA</h2>
            </div>

            {twoFactorErrors.root && (
              <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {twoFactorErrors.root}
              </p>
            )}

            <div className="mb-5 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-sm font-semibold text-white">
                {twoFactorEnabled ? '2FA activee' : '2FA inactive'}
              </p>
              <p className="mt-1 text-sm text-white/60">
                {twoFactorEnabled
                  ? 'Votre compte possede une cle TOTP valide.'
                  : 'Scannez un QR code avec Google Authenticator pour preparer la protection.'}
              </p>
            </div>

            {!twoFactorEnabled && !setup && (
              <Button type="button" onClick={handleSetup2fa} isLoading={isSettingUp2fa} className="w-full">
                Generer un QR code
              </Button>
            )}

            {!twoFactorEnabled && setup && (
              <form className="space-y-4" onSubmit={handleConfirm2fa}>
                <div className="rounded-lg bg-white p-3" dangerouslySetInnerHTML={{ __html: setup.qrCodeSvg }} />
                <Input
                  label="Code a 6 chiffres"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={verificationCode}
                  error={twoFactorErrors.code}
                  onChange={(event) => setVerificationCode(event.target.value)}
                />
                <Button type="submit" isLoading={isConfirming2fa} className="w-full">
                  Activer la 2FA
                </Button>
              </form>
            )}

            {twoFactorEnabled && (
              <form className="space-y-4" onSubmit={handleDisable2fa}>
                <Input
                  label="Mot de passe actuel"
                  type="password"
                  autoComplete="current-password"
                  value={disablePassword}
                  error={twoFactorErrors.currentPassword}
                  onChange={(event) => setDisablePassword(event.target.value)}
                />
                <Button
                  type="submit"
                  variant="secondary"
                  isLoading={isDisabling2fa}
                  icon={<ShieldOff className="h-4 w-4" />}
                  className="w-full"
                >
                  Desactiver la 2FA
                </Button>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export default AccountSecurityPage
