import React from 'react'
import Image from 'next/image'
import Card from '@/components/ui/Card'
import LoginForm from './LoginForm'
import Link from 'next/link'

function LoginCard() {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-8">
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
        <h2 className="text-2xl font-bold text-white">Connexion</h2>
        <p className="mt-1 text-sm text-gray-400">
          Accédez à votre compte KickDeal
        </p>
      </div>

      <Card className="w-full">
        <LoginForm />
      </Card>

      <p className="text-sm text-gray-400">
        Pas encore de compte ?{' '}
        <Link
          href="/auth/register"
          className="font-medium text-brand-purple transition-colors hover:opacity-80 focus:outline-none focus-visible:underline"
        >
          Créer un compte
        </Link>
      </p>
    </div>
  )
}

export default LoginCard