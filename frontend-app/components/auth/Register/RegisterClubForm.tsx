'use client'

import React, { useState } from 'react'
import { RegisterDTO } from '../../../features/auth/register.dto'
import { useRouter } from 'next/navigation'
import { authManager } from '@/features/auth/auth'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import Input from '@/components/ui/Input'
import { ArrowRight, Building2, File, Mail, MapPin, Phone, Upload, User } from 'lucide-react'
import Button from '@/components/ui/Button'
import { RegisterClubFormData, registerClubSchema } from '@/features/auth/schemas/registerClub.schemea'

function RegisterClubForm() {
    const {
      register,
      handleSubmit,
      setError,
      formState: { errors, isSubmitting },
    } = useForm<RegisterClubFormData>({
      resolver: zodResolver(registerClubSchema),
        defaultValues: {
          email: '',
          password: '',
          firstname: '',
          lastname: '',
          confirmation: ''

      },
    })

  // const [errors, setErrors] = useState<Partial<RegisterDTO>>({})
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [responseError, setResponseError] = useState('');
  const router = useRouter();

  // const validateForm = (): boolean => {
  //   const newErrors: Partial<RegisterDTO> = {}

  //   if (!formData.firstname.trim()) {
  //     newErrors.firstname = 'Le prénom est requis'
  //   }

  //   if (!formData.lastname.trim()) {
  //     newErrors.lastname = 'Le nom est requis'
  //   }

  //   if (!formData.email.trim()) {
  //     newErrors.email = "L'email est requis"
  //   } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
  //     newErrors.email = "L'email est invalide"
  //   }

  //   if (!formData.password) {
  //     newErrors.password = 'Le mot de passe est requis'
  //   } else if (formData.password.length < 8) {
  //     newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères'
  //   }

  //   if (!formData.confirmation) {
  //     newErrors.confirmation = 'La confirmation du mot de passe est requise'
  //   } else if (formData.password !== formData.confirmation) {
  //     newErrors.confirmation = 'Les mots de passe ne correspondent pas'
  //   }

  //   setErrors(newErrors)
  //   return Object.keys(newErrors).length === 0
  // }

  // const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const { name, value } = e.target
  //   setFormData(prev => ({
  //     ...prev,
  //     [name]: value,
  //   }))
  //   // Clear error for this field when user starts typing
  //   if (errors[name as keyof RegisterDTO]) {
  //     setErrors(prev => ({
  //       ...prev,
  //       [name]: undefined,
  //     }))
  //   }
  // }

  // const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault()
  //   setSuccessMessage('')

  //   if (!validateForm()) {
  //     return
  //   }

  //   setLoading(true)
  //   try {
  //     // TODO: Implement API call to register user
  //     const registerResponse = await authManager.register(formData);
  //     if(!registerResponse.ok) {
  //       setResponseError(registerResponse.data.message || "Une erreur est survenue lors de l'inscription.");
  //       return;
  //     }

  //     console.log('Form submitted:', formData)
  //     setSuccessMessage('Inscription réussie!')
  //     setFormData({
  //       firstname: '',
  //       lastname: '',
  //       email: '',
  //       password: '',
  //       confirmation: '',
  //     });
  //     router.push('/auth/login');
  //   } catch (error) {
  //     console.error('Registration error:', error)
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  return (
    <div className="w-full max-w-2xl flex flex-col items-stretch justify-center text-white">
      <form className="space-y-6" onSubmit={() => {}}>

        <div className="flex flex-col gap-6 md:flex-row md:gap-12">
          <div className="left md:basis-1/2">
            <h2 className="mb-3 text-xl font-semibold">Information personnelles</h2>

            {successMessage && (
              <div className="rounded-md bg-green-50 p-4">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            )}

            {/* Prénom */}
            <div className="fields space-y-4">
              <div>
                <Input
                  label="Prénom *"
                  type="text"
                  placeholder="Jean"
                  icon={<User className="h-5 w-5" />}
                  error={errors.firstname?.message}
                  autoComplete="given-name"
                  autoFocus
                  {...register('firstname')}
                />
              </div>

              {/* Nom */}
              <div>
                <Input
                  label="Nom *"
                  type="text"
                  placeholder="Dupont"
                  icon={<User className="h-5 w-5" />}
                  error={errors.lastname?.message}
                  autoComplete="family-name"
                  autoFocus
                  {...register('lastname')}
                />
              </div>

              {/* Email */}
              <div>
                <Input
                  label="Email *"
                  type="email"
                  placeholder="votre@email.com"
                  icon={<Mail className="h-5 w-5" />}
                  error={errors.email?.message}
                  autoComplete="email"
                  autoFocus
                  {...register('email')}
                />
              </div>

              {/* Mot de passe */}
              <div>
                <Input
                  label="Mot de passe *"
                  type="password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  autoComplete="new-password"
                  autoFocus
                  {...register('password')}
                />
              </div>

              {/* Confirmation mot de passe */}
              <div>
                <Input
                  label="Confirmation du mot de passe *"
                  type="password"
                  placeholder="••••••••"
                  error={errors.confirmation?.message}
                  autoComplete="new-password"
                  autoFocus
                  {...register('confirmation')}
                />
              </div>
            </div>
          </div>

          <hr className='block w-full my-1 text-white/5 md:hidden'/>

          <div className="right md:basis-1/2 md:mt-0">
            <div>
              <h2 className="mb-3 text-xl font-semibold">Information professionnelles</h2>
            </div>

            <div className="fields space-y-4">
              <div>
                <Input
                  label="Rôle au sein du club *"
                  type="text"
                  placeholder="Rôle dans le club"
                  icon={<Building2 className="h-5 w-5" />}
                  error={errors.roleInCLub?.message}
                  autoComplete="organization"
                  autoFocus
                  {...register('roleInCLub')}
                />
              </div>

              <div>
                <Input
                  label="Nom du club *"
                  type="text"
                  placeholder="Nom du club"
                  icon={<Building2 className="h-5 w-5" />}
                  error={errors.clubName?.message}
                  autoComplete="organization"

                  autoFocus
                  {...register('clubName')}
                />
              </div>

              <div>
                <Input
                  label="Pays du club *"
                  type="text"
                  placeholder="Pays du club"
                  icon={<MapPin className="h-5 w-5" />}
                  error={errors.clubCountry?.message}
                  autoComplete="country"
                  autoFocus
                  {...register('clubCountry')}
                />
              </div>

              <div>
                <Input
                  label="Numéro de téléphone du club *"
                  type="number"
                  placeholder="Numéro de téléphone du club"
                  icon={<Phone className="h-5 w-5" />}
                  error={errors.clubPhoneNumber?.message}
                  autoComplete="tel"
                  autoFocus
                  {...register('clubPhoneNumber')}
                />
              </div>
            </div>
          </div>
        </div>
        
        

        {/* Submit button */}
        <div>
          <Button type="submit" disabled={loading} className='w-full' icon={<ArrowRight className="h-4 w-4" />}>
            {loading ? 'Inscription en cours...' : "S'inscrire"}
          </Button>
        </div>
        {responseError && (
          <p className="mt-1 text-sm text-red-600">{responseError}</p>
        )}
      </form>
    </div>
  )
}

export default RegisterClubForm