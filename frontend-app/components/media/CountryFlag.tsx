import Flag from 'react-world-flags'

import { getCountryCode } from '@/features/country/countryCodes'

type CountryFlagProps = {
  country?: string | null
  code?: string | null
  label?: string
  className?: string
}

export function CountryFlag({ country, code, label, className = 'h-4 w-6' }: CountryFlagProps) {
  const countryCode = code ?? getCountryCode(country)

  if (!countryCode) {
    return (
      <span
        aria-hidden="true"
        className={`inline-block rounded-[3px] border border-white/20 bg-white/10 ${className}`}
      />
    )
  }

  return (
    <Flag
      code={countryCode}
      alt={label ?? country ?? countryCode}
      title={label ?? country ?? countryCode}
      className={`inline-block rounded-[3px] object-cover shadow-sm shadow-black/30 ${className}`}
      fallback={(
        <span
          aria-hidden="true"
          className={`inline-block rounded-[3px] border border-white/20 bg-white/10 ${className}`}
        />
      )}
    />
  )
}

export { getCountryCode }
