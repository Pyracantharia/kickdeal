'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { KeyRound, ArrowRight } from 'lucide-react'

import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { joinClubSchema, type JoinClubFormData } from '@/features/club/schemas/joinClub.schema'

function JoinClubForm() {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<JoinClubFormData>({
    resolver: zodResolver(joinClubSchema),
    defaultValues: {
      invitationCode: '',
    },
  })

  async function onSubmit(data: JoinClubFormData) {
    try {
      // TODO: Connect to backend via clubManager.joinClub(data.invitationCode)
      router.push(`/club/joined?code=${encodeURIComponent(data.invitationCode)}`)
    } catch {
      setError('root', {
        message: 'Une erreur est survenue. Veuillez réessayer.',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {errors.root && (
        <div
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400"
          role="alert"
        >
          {errors.root.message}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <Input
          label="CODE D'INVITATION"
          type="text"
          placeholder="EX: CLUB-ABC-123"
          icon={<KeyRound className="h-5 w-5" />}
          error={errors.invitationCode?.message}
          {...register('invitationCode')}
        />
        <p className="text-xs text-gray-400">
          Le code doit être fourni par le gestionnaire de votre club
        </p>
      </div>

      <div className="rounded-lg border border-brand-purple/30 bg-brand-purple/5 p-4">
        <p className="text-sm text-gray-300">
          <span className="font-semibold text-white">Important :</span> Une fois
          accepté, vous serez rattaché au club correspondant au code.
          Assurez-vous qu&apos;il s&apos;agit du bon club.
        </p>
      </div>

      <Button
        type="submit"
        isLoading={isSubmitting}
        icon={<ArrowRight className="h-4 w-4" />}
        className="w-full"
      >
        Rejoindre le club
      </Button>
    </form>
  )
}

export default JoinClubForm