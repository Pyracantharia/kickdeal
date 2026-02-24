'use client'

import React, { useState } from 'react'
import { RegisterDTO } from '../../../features/auth/register.dto'
import { useRouter } from 'next/navigation'
import { authManager } from '@/features/auth/auth'

function RegisterForm() {
  const [formData, setFormData] = useState<RegisterDTO>({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    confirmation: '',
  })

  const [errors, setErrors] = useState<Partial<RegisterDTO>>({})
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [responseError, setResponseError] = useState('');
  const router = useRouter();

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterDTO> = {}

    if (!formData.firstname.trim()) {
      newErrors.firstname = 'Le prénom est requis'
    }

    if (!formData.lastname.trim()) {
      newErrors.lastname = 'Le nom est requis'
    }

    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "L'email est invalide"
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères'
    }

    if (!formData.confirmation) {
      newErrors.confirmation = 'La confirmation du mot de passe est requise'
    } else if (formData.password !== formData.confirmation) {
      newErrors.confirmation = 'Les mots de passe ne correspondent pas'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    // Clear error for this field when user starts typing
    if (errors[name as keyof RegisterDTO]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSuccessMessage('')

    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      // TODO: Implement API call to register user
      const registerResponse = await authManager.register(formData);
      if(!registerResponse.ok) {
        setResponseError(registerResponse.data.message || "Une erreur est survenue lors de l'inscription.");
        return;
      }

      console.log('Form submitted:', formData)
      setSuccessMessage('Inscription réussie!')
      setFormData({
        firstname: '',
        lastname: '',
        email: '',
        password: '',
        confirmation: '',
      });
      router.push('/auth/login');
    } catch (error) {
      console.error('Registration error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-white">
      <div className="w-full max-w-md">
        
        {successMessage && (
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">{successMessage}</p>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Prénom */}
          <div>
            <label htmlFor="firstname" className="block text-sm font-medium text-gray-700">
              Prénom
            </label>
            <input
              type="text"
              id="firstname"
              name="firstname"
              value={formData.firstname}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border ${
                errors.firstname ? 'border-red-500' : 'border-gray-300'
              } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
              placeholder="Jean"
            />
            {errors.firstname && (
              <p className="mt-1 text-sm text-red-600">{errors.firstname}</p>
            )}
          </div>

          {/* Nom */}
          <div>
            <label htmlFor="lastname" className="block text-sm font-medium text-gray-700">
              Nom
            </label>
            <input
              type="text"
              id="lastname"
              name="lastname"
              value={formData.lastname}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border ${
                errors.lastname ? 'border-red-500' : 'border-gray-300'
              } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
              placeholder="Dupont"
            />
            {errors.lastname && (
              <p className="mt-1 text-sm text-red-600">{errors.lastname}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
              placeholder="jean@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Mot de passe */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Confirmation mot de passe */}
          <div>
            <label htmlFor="confirmation" className="block text-sm font-medium text-gray-700">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              id="confirmation"
              name="confirmation"
              value={formData.confirmation}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border ${
                errors.confirmation ? 'border-red-500' : 'border-gray-300'
              } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
              placeholder="••••••••"
            />
            {errors.confirmation && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmation}</p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 py-2 px-4 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Inscription en cours...' : "S'inscrire"}
          </button>
          {responseError && (
            <p className="mt-1 text-sm text-red-600">{responseError}</p>
          )}
        </form>
      </div>
    </div>
  )
}

export default RegisterForm