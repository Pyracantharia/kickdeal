type LeagueDisplayConfig = {
  displayName: string
  logoUrl: string
  countryId: string
  countryName: string
  countryFlag: string
  countryCode: string
}

/**
 * Les clés correspondent aux noms exacts enregistrés en base de données.
 * Seules les ligues présentes ici sont proposées dans les filtres.
 */
export const LEAGUE_CONFIG: Record<string, LeagueDisplayConfig> = {
  'Ligue 1': {
    displayName: 'Ligue 1',
    logoUrl: '/images/leagues/logo-ligue1.png',
    countryId: 'France',
    countryName: 'France',
    countryFlag: 'FR',
    countryCode: 'FR',
  },
  'Premier League': {
    displayName: 'Premier League',
    logoUrl: '/images/leagues/logo-premier-league.png',
    countryId: 'England',
    countryName: 'Angleterre',
    countryFlag: 'GB',
    countryCode: 'GB',
  },
  Bundesliga: {
    displayName: 'Bundesliga',
    logoUrl: '/images/leagues/logo-bundesliga.png',
    countryId: 'Germany',
    countryName: 'Allemagne',
    countryFlag: 'DE',
    countryCode: 'DE',
  },
  'Primera Division': {
    displayName: 'La Liga',
    logoUrl: '/images/leagues/logo-laliga.png',
    countryId: 'Spain',
    countryName: 'Espagne',
    countryFlag: 'ES',
    countryCode: 'ES',
  },
  'Serie A': {
    displayName: 'Serie A',
    logoUrl: '/images/leagues/logo-serie-a.png',
    countryId: 'Italy',
    countryName: 'Italie',
    countryFlag: 'IT',
    countryCode: 'IT',
  },
  Eredivisie: {
    displayName: 'Eredivisie',
    logoUrl: '/images/leagues/logo-eredivisie.png',
    countryId: 'Netherlands',
    countryName: 'Pays-Bas',
    countryFlag: 'NL',
    countryCode: 'NL',
  },
  'Primeira Liga': {
    displayName: 'Liga Portugal',
    logoUrl: '/images/leagues/logo-liga-portugal.png',
    countryId: 'Portugal',
    countryName: 'Portugal',
    countryFlag: 'PT',
    countryCode: 'PT',
  },
}

export function getLeagueDisplayName(leagueName: string): string {
  return LEAGUE_CONFIG[leagueName]?.displayName ?? leagueName
}

export function isDisplayedLeague(leagueName: string): boolean {
  return Boolean(LEAGUE_CONFIG[leagueName])
}

export function getLeagueCountryId(leagueName: string): string | undefined {
  return LEAGUE_CONFIG[leagueName]?.countryId
}

export function getLeagueCountryCode(leagueName: string): string | undefined {
  return LEAGUE_CONFIG[leagueName]?.countryCode
}
