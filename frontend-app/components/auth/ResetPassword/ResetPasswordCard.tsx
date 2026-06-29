import Image from 'next/image'
import Link from 'next/link'

import Card from '@/components/ui/Card'
import ResetPasswordForm from './ResetPasswordForm'

function ResetPasswordCard({ token }: { token: string }) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <div className="relative h-16 w-16">
          <Image src="/images/logo.png" alt="KickDeal logo" fill sizes="64px" className="object-contain" priority />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">KickDeal</h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-cyan">Football Transfers</p>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">Nouveau mot de passe</h2>
        <p className="mt-1 text-sm text-gray-400">Choisissez un mot de passe fort pour securiser votre compte.</p>
      </div>

      <Card color="purple" className="w-full p-5">
        <ResetPasswordForm token={token} />
      </Card>

      <Link
        href="/auth/login"
        className="text-sm font-bold text-brand-purple transition-colors hover:opacity-80 focus:outline-none focus-visible:underline"
      >
        Retour a la connexion
      </Link>
    </div>
  )
}

export default ResetPasswordCard
