import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText, LockKeyhole, Settings } from 'lucide-react'
import AppFooter from '@/components/AppFooter'
import AppHeader from '@/components/AppHeader'

export const metadata: Metadata = {
  title: 'Legal | KickDeal',
  description: 'Pages legales de KickDeal.',
}

const LEGAL_PAGES = [
  {
    href: '/legal/confidentialite',
    icon: LockKeyhole,
    title: 'Confidentialite',
    text: 'Emplacement pour la politique de confidentialite et la protection des donnees.',
  },
  {
    href: '/legal/cgu',
    icon: FileText,
    title: 'Conditions generales d utilisation',
    text: 'Emplacement pour les regles d utilisation du site et de la plateforme.',
  },
  {
    href: '/legal/cookies',
    icon: Settings,
    title: 'Cookies',
    text: 'Emplacement pour la politique de cookies et la gestion du consentement.',
  },
]

export default function LegalPage() {
  return (
    <>
      <AppHeader />
      <main className="pt-28 sm:pt-32">
        <section className="px-4 pb-16 sm:pb-24">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-cyan">
                Legal
              </p>
              <h1 className="mt-4 text-4xl font-bold uppercase leading-tight tracking-wider text-white sm:text-5xl">
                Informations legales
              </h1>
              <p className="mt-5 text-base leading-relaxed text-white/75 sm:text-lg">
                Cette page regroupe les documents juridiques du landing KickDeal et les emplacements prevus pour leur contenu final.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {LEGAL_PAGES.map(({ href, icon: Icon, title, text }) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-lg border border-white/10 bg-dark-900/70 p-6 backdrop-blur-sm transition-colors hover:border-brand-cyan/40 hover:bg-dark-800/80"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-5 text-lg font-bold uppercase tracking-wider text-white">
                    {title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">
                    {text}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <AppFooter />
    </>
  )
}
