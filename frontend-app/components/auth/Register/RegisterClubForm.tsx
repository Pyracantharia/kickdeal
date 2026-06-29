'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { authManager } from '@/features/auth/auth'
import { useAuth } from '@/context/AuthProvider'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import Input from '@/components/ui/Input'
import { ArrowRight, Briefcase, Mail, Phone, User } from 'lucide-react'
import Button from '@/components/ui/Button'
import { RegisterClubFormData, registerClubSchema } from '@/features/auth/schemas/registerClub.schemea'
import PlanSelection from './PlanSelection'
import type { SubscriptionPlan } from '@/features/subscription/subscription'
import PasswordStrengthMeter from '@/components/account/PasswordStrengthMeter'

function RegisterClubForm() {
  const router = useRouter()
  const { updateUser } = useAuth()
  const [selectedPlan, setSelectedPlan] = React.useState<SubscriptionPlan>('club_free')

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
    control,
  } = useForm<RegisterClubFormData>({
    resolver: zodResolver(registerClubSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmation: '',
      jobTitle: '',
      professionalContact: '',
    },
  })
  const password = useWatch({ control, name: 'password' }) ?? ''

  async function onSubmit(data: RegisterClubFormData) {
    try {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        confirmation: data.confirmation,
        roles: ['ROLE_CLUB'],
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
            setError(field as keyof RegisterClubFormData, { 
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

      const loginResponse = await authManager.login({
        email: payload.email,
        password: payload.password,
      })

      if (!loginResponse.ok) {
        setError('root', {
          message: "Compte créé, mais connexion automatique impossible. Veuillez vous connecter.",
        })

        router.push('/auth/login')

        return
      }

      updateUser(loginResponse.data.user)

      router.push(selectedPlan === 'club_free' ? '/club' : `/subscription?plan=${selectedPlan}`)
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
              <PasswordStrengthMeter password={password} />
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
                label="Titre du poste *"
                type="text"
                placeholder="Ex: Responsable recrutement"
                icon={<Briefcase className="h-5 w-5" />}
                error={errors.jobTitle?.message}
                autoComplete="organization-title"
                {...register('jobTitle')}
              />
            </div>

            <div>
              <Input
                label="Contact professionnel"
                type="text"
                placeholder="Email ou téléphone professionnel"
                icon={<Phone className="h-5 w-5" />}
                error={errors.professionalContact?.message}
                autoComplete="off"
                {...register('professionalContact')}
              />
            </div>
          </div>
        </div>

        <PlanSelection audience="club" selectedPlan={selectedPlan} onChange={setSelectedPlan} />
        
        <div>
          <Button type="submit" isLoading={isSubmitting} className='w-full' icon={<ArrowRight className="h-4 w-4" />}>
            {selectedPlan === 'club_free' ? 'Créer mon compte gratuit' : 'Créer mon compte puis choisir le paiement'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default RegisterClubForm
