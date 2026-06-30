'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react'

import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { loginSchema, type LoginFormData } from '@/features/auth/schemas/login.schema'
import { authManager } from '@/features/auth/auth'
import { useAuth } from '@/context/AuthProvider'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const { updateUser } = useAuth()
  const [requiresTwoFactor, setRequiresTwoFactor] = React.useState(false)

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      twoFactorCode: '',
    },
  })

  async function onSubmit(data: LoginFormData) {
    try {
      const payload = {
        email: data.email,
        password: data.password,
        ...(requiresTwoFactor ? { twoFactorCode: data.twoFactorCode } : {}),
      }
      const response = await authManager.login(payload)

      if (response.status === 202 && response.data.requiresTwoFactor) {
        setRequiresTwoFactor(true)
        clearErrors('root')
        return
      }

      if (!response.ok) {
        if (response.status === 429) {
          setError('root', {
            message: 'Trop de tentatives de connexion echouees. Veuillez patienter quelques minutes avant de reessayer.',
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
          setError('twoFactorCode', { message: errorData.errors.twoFactorCode })
          return
        }

        const rawServerMessage =
          errorData?.errorMessage ||
          errorData?.message ||
          errorData?.error ||
          'Identifiants invalides'

        const serverMessage = getLoginErrorMessage(rawServerMessage)

        setError('root', { message: serverMessage })
        return
      }

      updateUser(response.data.user)
      const requestedPlan = new URLSearchParams(window.location.search).get('plan')
      const payablePlans = ['agent_pro', 'club_pro', 'club_enterprise']
      router.push(requestedPlan && payablePlans.includes(requestedPlan) ? `/subscription?plan=${requestedPlan}` : '/dashboard')
    } catch {
      setError('root', {
        message: 'Une erreur est survenue. Veuillez réessayer.',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {errors.root && (
        <div
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400"
          role="alert"
        >
          {errors.root.message}
        </div>
      )}

      <Input
        label="Email"
        type="email"
        placeholder="votre@email.com"
        icon={<Mail className="h-5 w-5" />}
        error={errors.email?.message}
        autoComplete="email"
        autoFocus
        {...register('email')}
      />

      <Input
        label="Mot de passe"
        type="password"
        placeholder="••••••••"
        icon={<Lock className="h-5 w-5" />}
        error={errors.password?.message}
        autoComplete="current-password"
        {...register('password')}
      />

      {requiresTwoFactor && (
        <Input
          label="Code 2FA"
          type="text"
          inputMode="numeric"
          placeholder="123456"
          icon={<ShieldCheck className="h-5 w-5" />}
          error={errors.twoFactorCode?.message}
          autoComplete="one-time-code"
          autoFocus
          {...register('twoFactorCode')}
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
