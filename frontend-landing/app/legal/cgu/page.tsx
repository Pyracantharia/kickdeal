import type { Metadata } from 'next'
import ContentPage from '@/components/content/ContentPage'

export const metadata: Metadata = {
  title: 'CGU et CGV | KickDeal',
  description: 'Conditions générales d’utilisation et de vente de KickDeal.',
}

const SECTIONS = [
  {
    title: 'Objet et nature du service',
    body: [
      'KickDeal est une plateforme SaaS logicielle dédiée à la mise en relation et à la facilitation des négociations entre les clubs de football professionnels et les agents sportifs.',
      "KickDeal agit exclusivement en tant que fournisseur de technologie. La plateforme n'exerce aucune activité de courtage ou d'agent sportif, ne perçoit aucune commission sur les transferts, et n'homologue aucune transaction. La finalisation d'un transfert demeure la prérogative exclusive des fédérations sportives compétentes et nécessite l'utilisation des systèmes institutionnels, par exemple FIFA TMS.",
    ],
  },
  {
    title: 'Inscription et vérification des profils',
    body: [
      "L'accès aux fonctionnalités actives de la plateforme est conditionné à une procédure de vérification rigoureuse.",
      "Agents : obligation de fournir une licence valide, FIFA ou FFF. L'exercice illégal de la profession d'agent est passible de sanctions pénales. KickDeal se réserve le droit de suspendre tout compte dont la licence serait expirée ou révoquée.",
      "Clubs : obligation de fournir un mandat ou une attestation prouvant la capacité à représenter légalement l'entité sportive.",
    ],
  },
  {
    title: 'Valeur des documents générés',
    body: [
      "Les documents PDF générés par la plateforme à l'issue d'une négociation constituent des récapitulatifs, accords de principe ou lettres d'intention. Ils n'ont pas valeur de contrat de travail ou de convention de mutation définitive tant qu'ils ne sont pas validés par les instances officielles.",
    ],
  },
  {
    title: "Engagements de l'utilisateur et propriété intellectuelle",
    body: [
      "L'utilisateur s'engage à ne publier que des informations dont il détient les droits. Il garantit à KickDeal détenir l'intégralité des autorisations nécessaires, droits d'auteur et droit à l'image, pour toute photographie de joueur ou logo de club téléversé manuellement sur la plateforme.",
    ],
  },
  {
    title: 'Abonnements professionnels et absence de droit de rétractation',
    body: [
      "Les services de KickDeal s'adressent exclusivement à un public professionnel, B2B, pour les besoins de leur activité principale. Par conséquent, conformément à l'article L. 221-3 du Code de la consommation, aucun droit de rétractation légal n'est applicable aux souscriptions d'abonnements payants sur la plateforme. Tout abonnement souscrit est ferme et définitif.",
    ],
  },
]

export default function TermsPage() {
  return (
    <ContentPage
      eyebrow="Legal"
      title="Conditions générales d'utilisation et de vente"
      description="Les conditions applicables à l'utilisation du site, de la plateforme KickDeal et des abonnements professionnels."
      updatedAt="a compléter"
      sections={SECTIONS}
    />
  )
}
