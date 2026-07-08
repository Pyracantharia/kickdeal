'use client'

import type { UseFormRegisterReturn } from 'react-hook-form'

type TermsAcceptanceProps = {
  inputProps: UseFormRegisterReturn<'termsAccepted'>
  error?: string
}

const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL ?? 'http://localhost:3001'

function TermsAcceptance({ inputProps, error }: TermsAcceptanceProps) {
  return (
    <div>
      <label className={`flex gap-3 rounded-lg border bg-white/5 p-4 text-sm leading-relaxed transition-colors ${error ? 'border-red-500' : 'border-white/10'}`}>
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 rounded border-white/20 bg-white/10 accent-brand-purple"
          aria-invalid={!!error}
          aria-describedby={error ? 'terms-accepted-error' : undefined}
          {...inputProps}
        />
        <span className="text-gray-200">
          J&apos;accepte les{' '}
          <a
            href={`${LANDING_URL}/legal/cgu`}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-brand-cyan underline-offset-4 hover:underline"
          >
            Conditions Générales d&apos;Utilisation
          </a>{' '}
          et la{' '}
          <a
            href={`${LANDING_URL}/legal/confidentialite`}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-brand-cyan underline-offset-4 hover:underline"
          >
            Politique de Confidentialité
          </a>
          .
        </span>
      </label>
      {error ? (
        <p id="terms-accepted-error" className="mt-1.5 text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export default TermsAcceptance
