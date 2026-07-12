import React from 'react'
import { ClipboardList, KeyRound, Info, ChevronRight } from 'lucide-react'
import Link from 'next/link'

import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import JoinClubForm from './JoinClubForm'

const CREATE_CLUB_FEATURES = [
  'Choix depuis la base de clubs',
  'Vérification de votre légitimité',
  'Gestionnaire principal après validation',
]

const WHY_ITEMS = [
  'KickDeal est une plateforme professionnelle réservée aux clubs et agents licenciés',
  'Chaque utilisateur doit être rattaché à une entité vérifiée pour garantir la crédibilité des transactions',
  'Un club déjà revendiqué se rejoint uniquement avec un code transmis par son gestionnaire principal',
]

function ManageClubCard() {
  return (
    <div className="auth-bg min-h-screen w-full flex flex-col items-center pt-24 pb-12 px-4">
      <div className="text-center mb-6 w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-white uppercase tracking-widest mb-4">
          Gérer mon club
        </h1>
        <hr className="border-white/10 mb-4" />
        <p className="text-gray-300 text-sm">
          Pour accéder à KickDeal, vous devez être rattaché à un club.
        </p>
      </div>

      <div className="w-full max-w-2xl mb-8">
        <div className="rounded-xl border border-brand-cyan/40 bg-brand-cyan/5 p-4 flex gap-3 items-start">
          <Info className="h-5 w-5 text-brand-cyan shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-brand-cyan font-semibold text-sm mb-1">Accès limité</p>
            <p className="text-sm text-gray-300">
              Vous ne pouvez pas accéder au Marché, aux Joueurs ou aux Négociations
              tant que votre club n&apos;est pas validé.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card color="purple" className="p-6 text-white">
          <div className="flex flex-col gap-4 h-full">
            <div className="rounded-xl bg-brand-purple/20 p-3 border border-brand-purple w-fit">
              <ClipboardList className="h-8 w-8 text-brand-purple" />
            </div>

            <h2 className="text-lg font-bold uppercase">Revendiquer la gestion d’un club</h2>

            <p className="text-sm text-gray-300">
              Choisissez le club que vous représentez et demandez à devenir son
              gestionnaire principal sur KickDeal.
            </p>

            <ul className="space-y-2 flex-1">
              {CREATE_CLUB_FEATURES.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-300">
                  <ChevronRight className="h-4 w-4 text-brand-purple shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <Link href="/club/create">
              <Button className="w-full" icon={<ChevronRight className="h-4 w-4" />}>
                Choisir mon club
              </Button>
            </Link>
          </div>
        </Card>

        <Card color="purple" className="p-6 text-white">
          <div className="flex flex-col gap-4">
            <div className="rounded-xl bg-brand-purple/20 p-3 border border-brand-purple w-fit">
              <KeyRound className="h-8 w-8 text-brand-purple" />
            </div>

            <h2 className="text-lg font-bold uppercase">Rejoindre un club existant</h2>

            <p className="text-sm text-gray-300">
              Entrez un code fourni par l&apos;administrateur ou le gestionnaire du club.
            </p>

            <JoinClubForm />
          </div>
        </Card>
      </div>

      <div className="w-full max-w-2xl">
        <Card color="cyan" baseGradient={false} className="p-5 border-brand-cyan/30 bg-transparent">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
            Pourquoi cette étape ?
          </h3>
          <ul className="space-y-2">
            {WHY_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-gray-300">
                <span
                  className="mt-1.5 h-2 w-2 rounded-full bg-brand-cyan shrink-0"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>

    </div>
  )
}

export default ManageClubCard