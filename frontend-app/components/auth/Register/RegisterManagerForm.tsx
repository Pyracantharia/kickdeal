'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { authManager } from '@/features/auth/auth'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RegisterManagerFormData, registerManagerSchema } from '@/features/auth/schemas/registerManager.schema'
import Input from '@/components/ui/Input'
import { ArrowRight, Building2, Mail, MapPin, User } from 'lucide-react'
import Button from '@/components/ui/Button'
import PlanSelection from './PlanSelection'
import type { SubscriptionPlan } from '@/features/subscription/subscription'

function RegisterManagerForm() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = React.useState<SubscriptionPlan>('agent_free')

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterManagerFormData>({
    resolver: zodResolver(registerManagerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmation: '',
      agencyName: '',
      country: '',
    },
  })

  async function onSubmit(data: RegisterManagerFormData) {
    try {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        agencyName: data.agencyName,
        country: data.country,
        roles: ['ROLE_AGENT'],
        subscriptionPlan: selectedPlan,
      }

      const response = await authManager.register(payload)

      if (!response.ok) {
        const errorData = response.data as {
          errors?: Record<string, string>
          errorMessage?: string
          message?: string
        }
        
        if (errorData.errors) {
          Object.entries(errorData.errors).forEach(([field, message]) => {
            setError(field as keyof RegisterManagerFormData, { 
              message: message as string 
            })
          })
          return
        }

        const serverMessage =
          errorData?.errorMessage ||
          errorData?.message ||
          "Une erreur est survenue lors de l'inscription"

        setError('root', { message: serverMessage })
        return
      }

      router.push('/auth/login?registered=true')
    } catch {
      setError('root', {
        message: 'Une erreur est survenue. Veuillez réessayer.',
      })
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl flex flex-col items-stretch justify-center text-white">
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        
        {errors.root && (
          <div
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400"
            role="alert"
          >
            {errors.root.message}
          </div>
        )}

        <div>
          <h2 className="mb-3 text-xl font-semibold">Informations personnelles</h2>

          <div className="fields space-y-4">
            <div>
              <Input
                label="Prénom *"
                type="text"
                placeholder="Jean"
                icon={<User className="h-5 w-5" />}
                error={errors.firstName?.message}
                autoComplete="given-name"
                autoFocus
                {...register('firstName')}
              />
            </div>

            <div>
              <Input
                label="Nom *"
                type="text"
                placeholder="Dupont"
                icon={<User className="h-5 w-5" />}
                error={errors.lastName?.message}
                autoComplete="family-name"
                {...register('lastName')}
              />
            </div>

            <div>
              <Input
                label="Email *"
                type="email"
                placeholder="votre@email.com"
                icon={<Mail className="h-5 w-5" />}
                error={errors.email?.message}
                autoComplete="email"
                {...register('email')}
              />
            </div>

            <div>
              <Input
                label="Mot de passe *"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                autoComplete="new-password"
                {...register('password')}
              />
            </div>

            <div>
              <Input
                label="Confirmation du mot de passe *"
                type="password"
                placeholder="••••••••"
                error={errors.confirmation?.message}
                autoComplete="new-password"
                {...register('confirmation')}
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-semibold">Informations professionnelles</h2>

          <div className="fields space-y-4">
            <div>
              <Input
                label="Nom de l'agence"
                type="text"
                placeholder="Nom de l'agence"
                icon={<Building2 className="h-5 w-5" />}
                error={errors.agencyName?.message}
                autoComplete="organization"
                {...register('agencyName')}
              />
            </div>

            <div>
              <Input
                label="Pays"
                type="text"
                placeholder="Pays"
                icon={<MapPin className="h-5 w-5" />}
                error={errors.country?.message}
                autoComplete="country"
                {...register('country')}
              />
            </div>
          </div>
        </div>

        <PlanSelection audience="agent" selectedPlan={selectedPlan} onChange={setSelectedPlan} />

        <div>
          <Button type="submit" isLoading={isSubmitting} className='w-full' icon={<ArrowRight className="h-4 w-4" />}>
            {selectedPlan === 'agent_free' ? 'Créer mon compte gratuit' : 'Créer mon compte et activer ce plan'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default RegisterManagerForm
