import Card from '@/components/ui/Card'
import Image from 'next/image'
import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import RegisterManagerForm from './RegisterManagerForm'

function RegisterManagerCard() {
  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <div className="relative h-16 w-16">
          <Image
            src="/images/logo.png"
            alt="KickDeal logo"
            fill
            sizes="64px"
            className="object-contain"
            priority
          />
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">KickDeal</h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-cyan">
            Football Transfers
          </p>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">Inscription</h2>
        <p className="mt-1 text-sm text-gray-400">
          Créez votre compte KickDeal
        </p>
      </div>

      <div className="w-full">
        <Link
          href="/auth/register"
          className="inline-flex items-center gap-2 text-sm text-gray-300 transition-colors hover:text-white focus:outline-none focus-visible:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
      </div>

      <Card color="purple" className="w-full p-5">
        <RegisterManagerForm />
      </Card>

      <p className="text-sm font-semibold text-gray-300">
        Pas encore de compte ?{' '}
        <Link
          href="/auth/register"
          className="font-bold text-brand-purple transition-colors hover:opacity-80 focus:outline-none focus-visible:underline"
        >
          Créer un compte
        </Link>
      </p>
    </div>
  )
}

export default RegisterManagerCard