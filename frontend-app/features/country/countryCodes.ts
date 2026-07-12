import countries from 'i18n-iso-countries'
import enLocale from 'i18n-iso-countries/langs/en.json'
import frLocale from 'i18n-iso-countries/langs/fr.json'

countries.registerLocale(enLocale)
countries.registerLocale(frLocale)

const FOOTBALL_COUNTRY_ALIASES: Record<string, string> = {
  angleterre: 'GB',
  england: 'GB',
  ecosse: 'GB',
  scotland: 'GB',
  pays_de_galles: 'GB',
  wales: 'GB',
  northern_ireland: 'GB',
  irlande_du_nord: 'GB',
  uk: 'GB',
  united_kingdom: 'GB',
  royaume_uni: 'GB',
  usa: 'US',
  etats_unis: 'US',
  cote_d_ivoire: 'CI',
  ivory_coast: 'CI',
  curacao: 'CW',
}

export function getCountryCode(country?: string | null): string | undefined {
  if (!country) return undefined

  const trimmed = country.trim()

  if (/^[a-z]{2}$/i.test(trimmed)) {
    return trimmed.toUpperCase()
  }

  const normalized = normalizeCountryName(trimmed)
  const aliasCode = FOOTBALL_COUNTRY_ALIASES[normalized]
  if (aliasCode) return aliasCode

  return countries.getAlpha2Code(trimmed, 'en') ?? countries.getAlpha2Code(trimmed, 'fr')
}

function normalizeCountryName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()
}
