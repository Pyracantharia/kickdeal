import type { Metadata } from 'next'
import ContentPage from '@/components/content/ContentPage'

export const metadata: Metadata = {
  title: 'Politique de confidentialité | KickDeal',
  description: 'Politique de confidentialité et de protection des données personnelles de KickDeal.',
}

const SECTIONS = [
  {
    title: 'Responsable de traitement',
    body: [
      'La société [Nom de votre société], éditrice de la plateforme KickDeal, agit en tant que responsable de traitement pour les données collectées.',
    ],
  },
  {
    title: 'Données collectées et finalités',
    body: [
      'Nous collectons des données à caractère personnel dans un cadre strictement professionnel, B2B, pour les finalités suivantes.',
      'Création et gestion des comptes : nom, prénom, adresse e-mail professionnelle, rôle, Club ou Agent. Base légale : exécution du contrat.',
      "Vérification d'identité, KYC, et de capacité professionnelle : numéro de licence FFF/FIFA, pièces d'identité, attestations de fonction. Base légale : intérêt légitime et respect des obligations légales de lutte contre l'exercice illégal de la profession d'agent.",
      'Mise en relation et négociation : échanges via la messagerie interne, offres, propositions salariales. Base légale : exécution du contrat.',
      'Publication sur le flux public, Feed : informations de transferts. Base légale : consentement explicite des parties concernées.',
    ],
  },
  {
    title: 'Durées de conservation',
    body: [
      'Vos données sont conservées uniquement le temps nécessaire aux finalités poursuivies.',
      'Justificatifs d’identité et de licences : supprimés immédiatement après la validation manuelle par nos équipes ; seul le statut "Vérifié" est conservé.',
      'Comptes inactifs : conservés pendant 3 ans à compter de votre dernière connexion ou du dernier contact.',
      'Historique des négociations finalisées : archivage intermédiaire pendant 5 ans à des fins de preuve commerciale.',
      'Journaux techniques, Logs : conservés pendant 12 mois conformément aux obligations légales.',
    ],
  },
  {
    title: 'Confidentialité des messageries',
    body: [
      "Les échanges au sein de la messagerie interne sont protégés par le secret des correspondances.",
      "Les administrateurs de KickDeal n'ont pas accès à vos messages privés, sauf en cas de signalement explicite de votre part, modération, ou de réquisition judiciaire.",
    ],
  },
  {
    title: 'Vos droits RGPD',
    body: [
      "Vous disposez d'un droit d'accès, de rectification, de portabilité, d'effacement de vos données, ainsi que d'un droit d'opposition et de limitation du traitement.",
      "En cas de suspension d'un compte pour non-respect des règles, certaines données d'identification peuvent être conservées en archivage pour empêcher le contournement de la sanction.",
    ],
  },
]

export default function PrivacyPage() {
  return (
    <ContentPage
      eyebrow="Legal"
      title="Politique de confidentialité"
      description="Cette politique décrit les données personnelles collectées par KickDeal, leurs finalités, leurs durées de conservation et les droits dont vous disposez."
      updatedAt="a compléter"
      sections={SECTIONS}
    />
  )
}
