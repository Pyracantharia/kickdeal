'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { authManager } from '@/features/auth/auth'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RegisterManagerFormData, registerManagerSchema } from '@/features/auth/schemas/registerManager.schema'
import Input from '@/components/ui/Input'
import { ArrowRight, Building2, Mail, User } from 'lucide-react'
import Button from '@/components/ui/Button'
import PlanSelection from './PlanSelection'
import type { SubscriptionPlan } from '@/features/subscription/subscription'
import PasswordStrengthMeter from '@/components/account/PasswordStrengthMeter'
import CountrySelect from '@/components/country/CountrySelect'
import TermsAcceptance from './TermsAcceptance'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'

function RegisterManagerForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const invitationToken = searchParams.get('invitationToken')
  const isGoogleSignup = searchParams.get('google_signup') === '1'
  const [selectedPlan, setSelectedPlan] = React.useState<SubscriptionPlan>('agent_free')

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
    control,
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
      termsAccepted: false,
    },
  })
  const password = useWatch({ control, name: 'password' }) ?? ''
  const termsAccepted = useWatch({ control, name: 'termsAccepted' }) ?? false

  React.useEffect(() => {
    if (!isGoogleSignup) {
      return
    }

    setValue('firstName', searchParams.get('firstName') ?? '')
    setValue('lastName', searchParams.get('lastName') ?? '')
    setValue('email', searchParams.get('email') ?? '')
    setValue('password', 'GoogleSignup123!')
    setValue('confirmation', 'GoogleSignup123!')
    setValue('termsAccepted', true)
  }, [isGoogleSignup, searchParams, setValue])

  async function onSubmit(data: RegisterManagerFormData) {
    try {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        ...(isGoogleSignup ? { googleSignup: true } : {
          password: data.password,
          confirmation: data.confirmation,
        }),
        agencyName: data.agencyName,
        country: data.country,
        roles: ['ROLE_AGENT'],
        subscriptionPlan: selectedPlan,
        invitationToken: invitationToken ?? undefined,
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

      if (isGoogleSignup) {
        router.push(selectedPlan === 'agent_free' ? '/dashboard' : `/subscription?plan=${selectedPlan}`)
        return
      }

      const invitationQuery = invitationToken ? `&invitationToken=${encodeURIComponent(invitationToken)}` : ''
      router.push(selectedPlan === 'agent_free' ? `/auth/login?registered=true${invitationQuery}` : `/auth/login?registered=true&plan=${selectedPlan}${invitationQuery}`)
    } catch {
      setError('root', {
        message: 'Une erreur est survenue. Veuillez réessayer.',
      })
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl flex flex-col items-stretch justify-center text-white">
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {!isGoogleSignup ? (
          <>
            <GoogleSignInButton mode="register" accountType="agent" disabled={!termsAccepted}/><p className="-mt-4 text-center text-xs text-gray-500">Acceptez les conditions en bas du formulaire pour activer Google.</p><div className="flex items-center gap-3 text-xs uppercase text-gray-500"><span className="h-px flex-1 bg-white/10"/>ou remplir le formulaire<span className="h-px flex-1 bg-white/10"/></div>
          </>
        ) : (
          <div className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
            Vos informations Google ont été récupérées. Complétez les champs restants pour finaliser votre compte.
          </div>
        )}
        
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
                readOnly={isGoogleSignup}
                {...register('email')}
              />
            </div>

            {!isGoogleSignup && (
              <>
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
              </>
            )}
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
              <Controller
                control={control}
                name="country"
                render={({ field }) => (
                  <CountrySelect
                    label="Pays"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={errors.country?.message}
                    placeholder="Choisir le pays de votre agence"
                  />
                )}
              />
            </div>
          </div>
        </div>

        <PlanSelection audience="agent" selectedPlan={selectedPlan} onChange={setSelectedPlan} />

        <TermsAcceptance
          inputProps={register('termsAccepted')}
          error={errors.termsAccepted?.message}
        />

        <div>
          <Button type="submit" isLoading={isSubmitting} className='w-full' icon={<ArrowRight className="h-4 w-4" />}>
            {isGoogleSignup
              ? 'Finaliser mon compte Google'
              : selectedPlan === 'agent_free' ? 'Créer mon compte gratuit' : 'Créer mon compte puis choisir le paiement'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default RegisterManagerForm
