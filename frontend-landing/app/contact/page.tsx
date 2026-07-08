import type { Metadata } from 'next'
import { Mail, MapPin, MessageSquare } from 'lucide-react'
import AppFooter from '@/components/AppFooter'
import AppHeader from '@/components/AppHeader'

export const metadata: Metadata = {
  title: 'Contact | KickDeal',
  description: 'Contactez l equipe KickDeal.',
}

const CONTACT_BLOCKS = [
  {
    icon: Mail,
    title: 'Email',
    text: 'Emplacement prevu pour ajouter l adresse email de contact.',
  },
  {
    icon: MessageSquare,
    title: 'Demandes commerciales',
    text: 'Emplacement prevu pour expliquer comment les clubs et agents peuvent contacter KickDeal.',
  },
  {
    icon: MapPin,
    title: 'Adresse',
    text: 'Emplacement prevu pour ajouter l adresse de la societe, si necessaire.',
  },
]

export default function ContactPage() {
  return (
    <>
      <AppHeader />
      <main className="pt-28 sm:pt-32">
        <section className="px-4 pb-16 sm:pb-24">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-cyan">
                Contact
              </p>
              <h1 className="mt-4 text-4xl font-bold uppercase leading-tight tracking-wider text-white sm:text-5xl">
                Entrer en contact avec KickDeal
              </h1>
              <p className="mt-5 text-base leading-relaxed text-white/75 sm:text-lg">
                Cette page est prete a recevoir les informations de contact, les details commerciaux et les coordonnees officielles.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {CONTACT_BLOCKS.map(({ icon: Icon, title, text }) => (
                <article
                  key={title}
                  className="rounded-lg border border-white/10 bg-dark-900/70 p-6 backdrop-blur-sm"
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
                </article>
              ))}
            </div>

            <section className="mt-6 rounded-lg border border-white/10 bg-dark-900/70 p-6 backdrop-blur-sm sm:p-8">
              <h2 className="text-xl font-bold uppercase tracking-wider text-white">
                Formulaire de contact
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/70 sm:text-base">
                Emplacement prevu pour ajouter un formulaire, une integration CRM ou un lien vers une adresse email.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-dashed border-white/15 p-4 text-sm text-white/45">
                  Champ nom / organisation
                </div>
                <div className="rounded-lg border border-dashed border-white/15 p-4 text-sm text-white/45">
                  Champ email
                </div>
                <div className="rounded-lg border border-dashed border-white/15 p-4 text-sm text-white/45 sm:col-span-2">
                  Champ message
                </div>
              </div>
            </section>
          </div>
        </section>
      </main>
      <AppFooter />
    </>
  )
}
