'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/context/AuthProvider'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { clubManager } from '@/features/club/club'
import Stepper from './Stepper'
import StepSelectClub from './StepSelectClub'
import StepClubManager from './StepClubManager'
import StepVerification from './StepVerification'
import type { ClubOption, VerificationMethod } from '@/features/club/types/createClub'

const TOTAL_STEPS = 3

function CreateClubStepper() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedClub, setSelectedClub] = useState<ClubOption | null>(null)
  const [verifications, setVerifications] = useState<VerificationMethod[]>([])
  const [clubs, setClubs] = useState<ClubOption[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/auth/login')
    }
  }, [isLoading, user, router])

  useEffect(() => {
    async function loadClubs() {
      try {
        const response = await clubManager.searchClubs('')
        if (response.ok && response.data?.clubs) {
          setClubs(response.data.clubs)
          return
        }

        setErrorMessage('Impossible de charger les clubs pour le moment.')
      } catch {
        setClubs([])
        setErrorMessage('Impossible de charger les clubs pour le moment.')
      }
    }

    loadClubs()
  }, [])

  const selectedEmailVerification = useMemo(
    () => verifications.find((verification) => verification.type === 'email'),
    [verifications],
  )

  const selectedMessageVerification = useMemo(
    () => verifications.find((verification) => verification.type === 'message'),
    [verifications],
  )

  const selectedDocumentVerification = useMemo(
    () => verifications.find((verification) => verification.type === 'document'),
    [verifications],
  )

  function canContinue(): boolean {
    if (currentStep === 1) return selectedClub !== null
    if (currentStep === 2) return true
    if (currentStep === 3) return verifications.length >= 1
    return false
  }

  async function handleContinue() {
    setErrorMessage(null)

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((s) => s + 1)
    } else {
      if (!selectedClub) {
        setErrorMessage('Veuillez sélectionner un club avant de soumettre la demande.')

        return
      }

      setIsSubmitting(true)

      try {
        const response = await clubManager.createClubRequest({
          teamId: selectedClub.id,
          clubName: selectedClub.name,
          league: selectedClub.league,
          country: selectedClub.country,
          verificationEmail: selectedEmailVerification?.type === 'email' ? selectedEmailVerification.email : undefined,
          verificationMessage: selectedMessageVerification?.type === 'message' ? selectedMessageVerification.message : undefined,
          verificationDocument: selectedDocumentVerification?.type === 'document' ? selectedDocumentVerification.file : undefined,
        })

        if (!response.ok) {
          if (response.status === 401) {
            setErrorMessage('Votre session a expiré. Veuillez vous reconnecter.')
            router.replace('/auth/login')

            return
          }

          const apiError = response.data as { errorMessage?: string; clubRequest?: unknown }

          if (apiError.clubRequest) {
            router.push('/club/pending')
            return
          }

          setErrorMessage(apiError.errorMessage ?? 'Impossible de soumettre la demande pour le moment.')

          return
        }

        setSuccessMessage('Demande soumise avec succès. Elle doit maintenant être validée par un administrateur.')
        router.push('/club/pending')
      } catch {
        setErrorMessage('Une erreur est survenue. Veuillez réessayer.')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1)
    } else {
      router.push('/club')
    }
  }

  return (
    <div className="auth-bg min-h-screen flex flex-col items-center pt-24 pb-12 px-4 w-full">
      <div className="text-center mb-6 w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-white uppercase tracking-widest mb-4">
          Revendiquer mon club
        </h1>
        <hr className="border-white/10 mb-4" />
        <p className="text-sm text-gray-300">
          Choisissez le club que vous représentez. Votre demande de gestion sera vérifiée avant validation.
        </p>
      </div>

      <div className="w-full max-w-sm mb-8">
        <Stepper currentStep={currentStep} totalSteps={TOTAL_STEPS} />
      </div>

      <Card color="cyan" className="w-full max-w-2xl p-6 mb-6">
        {errorMessage && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400 mb-4" role="alert">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-400 mb-4" role="status">
            {successMessage}
          </div>
        )}

        {currentStep === 1 && (
          <StepSelectClub
            clubs={clubs}
            selectedClub={selectedClub}
            onSelect={setSelectedClub}
          />
        )}
        {currentStep === 2 && (
          <StepClubManager
            selectedClub={selectedClub!}
            userEmail={user?.email ?? 'john.doe@example.com'}
          />
        )}
        {currentStep === 3 && (
          <StepVerification verifications={verifications} onChange={setVerifications} />
        )}
      </Card>

      <div className={`flex w-full max-w-2xl gap-4 ${currentStep === 1 ? 'justify-end' : 'justify-between'}`}>
        {currentStep > 1 && (
          <Button type="button" variant="secondary" onClick={handleBack} className="flex-1">
            Retour
          </Button>
        )}

        {currentStep === 1 && (
          <Button type="button" onClick={handleContinue} disabled={!canContinue()} icon={<ArrowRight className="h-4 w-4" />} className="w-full">
            Continuer
          </Button>
        )}

        {currentStep === 2 && (
          <Button type="button" onClick={handleContinue} icon={<ArrowRight className="h-4 w-4" />} className="flex-1">
            Continuer
          </Button>
        )}

        {currentStep === 3 && (
          <Button type="button" onClick={handleContinue} isLoading={isSubmitting} disabled={!canContinue() || isSubmitting} icon={<Send className="h-4 w-4" />} className="flex-1">
            Soumettre la demande
          </Button>
        )}
      </div>
    </div>
  )
}

export default CreateClubStepper