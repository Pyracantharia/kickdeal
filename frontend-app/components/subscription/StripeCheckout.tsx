'use client'

import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { X } from 'lucide-react'
import { useState } from 'react'

import Button from '@/components/ui/Button'

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = publishableKey ? loadStripe(publishableKey) : null

interface StripeCheckoutProps {
  clientSecret: string
  planLabel: string
  onComplete: () => Promise<void>
  onClose: () => void
}

export default function StripeCheckout(props: StripeCheckoutProps) {

  if (!stripePromise) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020712]/80 p-4 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-2xl border border-red-400/50 bg-[#0c1a25] p-6 text-white">
          <p className="font-bold text-red-300">
            Impossible de charger Stripe.
          </p>

          <p className="mt-2 text-sm text-white/70">
            La clé publique Stripe est absente de la configuration frontend.
          </p>

          <button
            type="button"
            onClick={props.onClose}
            className="mt-5 rounded-lg border border-white/20 px-4 py-2 text-sm"
          >
            Fermer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020712]/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-brand-purple/50 bg-[#0c1a25] p-6 shadow-2xl shadow-brand-purple/20">
        <button type="button" aria-label="Fermer" onClick={props.onClose} className="absolute right-4 top-4 text-white/60 hover:text-white">
          <X className="h-5 w-5" />
        </button>
        <p className="text-sm font-bold uppercase tracking-widest text-brand-cyan">Paiement sécurisé</p>
        <h2 className="mt-2 pr-8 text-2xl font-bold text-white">{props.planLabel}</h2>
        <p className="mt-2 text-sm text-white/65">Votre abonnement est renouvelé chaque mois. Vous pouvez le résilier depuis votre espace client.</p>
        <Elements stripe={stripePromise} options={{ clientSecret: props.clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#00e5d4', colorBackground: '#0c1a25', colorText: '#ffffff' } } }}>
          <StripePaymentForm onComplete={props.onComplete} />
        </Elements>
      </div>
    </div>
  )
}

function StripePaymentForm({ onComplete }: { onComplete: () => Promise<void> }) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!stripe || !elements) return

    setIsSubmitting(true)
    setError(null)
    const result = await stripe.confirmPayment({ elements, redirect: 'if_required' })
    if (result.error) {
      setError(result.error.message ?? 'Le paiement a été refusé.')
      setIsSubmitting(false)
      return
    }

    try {
      await onComplete()
    } catch (completionError) {
      setError(completionError instanceof Error ? completionError.message : 'Paiement confirmé, actualisation de l’abonnement en cours.')
      setIsSubmitting(false)
    }
  }

  return (
    <form className="mt-6" onSubmit={handleSubmit}>
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && <p className="mt-4 rounded-lg border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-100">{error}</p>}
      <Button type="submit" className="mt-6 w-full" isLoading={isSubmitting} disabled={!stripe || !elements}>
        Confirmer le paiement
      </Button>
    </form>
  )
}
