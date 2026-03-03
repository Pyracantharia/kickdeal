'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Mail, Lock, ArrowRight } from 'lucide-react'

import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { loginSchema, type LoginFormData } from '@/features/auth/schemas/login.schema'
import { authManager } from '@/features/auth/auth'
import { useAuth } from '@/context/AuthProvider'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const { updateUser } = useAuth()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: LoginFormData) {
    try {
      const response = await authManager.login(data)

      if (!response.ok) {
        const errorData = response.data as unknown as Record<string, string>
        const serverMessage =
          errorData?.errorMessage ||
          errorData?.message ||
          errorData?.error ||
          'Identifiants invalides'

        setError('root', { message: serverMessage })
        return
      }
      updateUser(response.data.user)
      router.push('/dashboard')
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

      <div className="flex justify-end">
        <Link href="/auth/forgot-password" className="text-sm text-brand-purple transition-colors hover:opacity-80 focus:outline-none focus-visible:underline">
          Mot de passe oublié ?
        </Link>
      </div>

      <Button type="submit" isLoading={isSubmitting} icon={<ArrowRight className="h-4 w-4" />} className="w-full mt-1">
        Se connecter
      </Button>
    </form>
  )
}

export default LoginForm
