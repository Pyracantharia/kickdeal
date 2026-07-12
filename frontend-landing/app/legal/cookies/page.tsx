import type { Metadata } from 'next'
import ContentPage from '@/components/content/ContentPage'

export const metadata: Metadata = {
  title: 'Politique de gestion des cookies | KickDeal',
  description: 'Politique de gestion des cookies et traceurs de KickDeal.',
}

const SECTIONS = [
  {
    title: "Qu'est-ce qu'un cookie ?",
    body: [
      "Un cookie est un petit fichier texte déposé sur votre terminal, ordinateur, tablette ou smartphone, lors de la visite de notre plateforme.",
      "Il permet d'assurer le bon fonctionnement du site, d'en mesurer l'audience et de sécuriser vos transactions.",
    ],
  },
  {
    title: 'Les cookies strictement nécessaires',
    body: [
      'Ces traceurs sont indispensables au fonctionnement de la plateforme KickDeal et ne requièrent pas votre consentement préalable.',
      "Cookies d'authentification et de session : ils permettent de vous maintenir connecté à votre espace Club ou Agent.",
      'Cookies de sécurité, par exemple 2FA TOTP : ils permettent de sécuriser votre connexion.',
      'Cookies de monitoring technique : des outils tels que Sentry ou Uptime Kuma peuvent être utilisés exclusivement pour identifier les erreurs de code et garantir la stabilité du serveur, sans croisement de données.',
    ],
  },
  {
    title: "Les cookies de mesure d'audience",
    body: [
      "Nous utilisons des outils d'analyse, par exemple Matomo ou Plausible, pour comprendre comment notre plateforme est utilisée.",
      "Lorsque ces outils sont configurés pour anonymiser strictement votre adresse IP et que les données ne sont pas partagées avec des tiers, ils peuvent être exemptés de consentement.",
    ],
  },
  {
    title: 'Les cookies soumis à votre consentement',
    body: [
      'Certains outils tiers peuvent déposer des cookies nécessitant votre accord explicite.',
      'Prestataires de paiement, par exemple Stripe : notre partenaire de paiement peut déposer des traceurs à des fins de lutte antifraude globale, notamment lorsque ces traceurs croisent des données au-delà de notre site.',
    ],
  },
  {
    title: 'Gestion de vos préférences',
    body: [
      "Lors de votre première visite, un bandeau vous permet d'accepter ou de refuser les cookies non essentiels de manière globale ou granulaire.",
      'Il vous est aussi facile de tout refuser que de tout accepter.',
      'Vos choix sont conservés pour une durée maximale de 13 mois.',
      'Vous pouvez modifier vos préférences à tout moment en cliquant sur le lien "Gérer mes cookies" situé en bas de page.',
    ],
  },
]

export default function CookiesPage() {
  return (
    <ContentPage
      eyebrow="Legal"
      title="Politique de gestion des cookies"
      description="Cette politique explique quels cookies et traceurs peuvent être utilisés par KickDeal, pour quelles finalités, et comment gérer vos préférences."
      updatedAt="a compléter"
      sections={SECTIONS}
    />
  )
}
