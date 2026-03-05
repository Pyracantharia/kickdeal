'use client'

import React, { useState } from 'react'
import { ArrowLeft, ArrowRight, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/context/AuthProvider'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Stepper from './Stepper'
import StepSelectClub from './StepSelectClub'
import StepClubManager from './StepClubManager'
import StepVerification from './StepVerification'
import { MOCK_CLUBS, type Club, type VerificationMethod } from '@/features/club/mockClubs'

const TOTAL_STEPS = 3

function CreateClubStepper() {
  const { user } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedClub, setSelectedClub] = useState<Club | null>(null)
  const [verifications, setVerifications] = useState<VerificationMethod[]>([])

  function canContinue(): boolean {
    if (currentStep === 1) return selectedClub !== null
    if (currentStep === 2) return true
    if (currentStep === 3) return verifications.length >= 1
    return false
  }

  function handleContinue() {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((s) => s + 1)
    } else {
      // TODO: Connect to backend — submit selectedClub + verifications
      console.log('Submit request:', { selectedClub, verifications })
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
    <div className="auth-bg min-h-screen flex flex-col items-center py-12 px-4 w-full">
      <div className="text-center mb-6 w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-white uppercase tracking-widest mb-4">
          Créer mon club
        </h1>
        <hr className="border-white/10 mb-4" />
        <p className="text-sm text-gray-300">
          Les informations du club seront vérifiées par un administrateur avant validation.
        </p>
      </div>

      <div className="w-full max-w-sm mb-8">
        <Stepper currentStep={currentStep} totalSteps={TOTAL_STEPS} />
      </div>

      <Card color="cyan" className="w-full max-w-2xl p-6 mb-6">
        {currentStep === 1 && (
          <StepSelectClub
            clubs={MOCK_CLUBS}
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
          <Button type="button" onClick={handleContinue} disabled={!canContinue()} icon={<Send className="h-4 w-4" />} className="flex-1">
            Soumettre la demande
          </Button>
        )}
      </div>
    </div>
  )
}

export default CreateClubStepper