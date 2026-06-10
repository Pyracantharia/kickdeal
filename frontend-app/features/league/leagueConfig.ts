type LeagueDisplayConfig = {
  displayName: string
  logoUrl: string
  countryId: string
  countryName: string
  countryFlag: string
}

/**
 * Les clés correspondent aux noms exacts enregistrés en base de données.
 * Seules les ligues présentes ici sont proposées dans les filtres.
 */
export const LEAGUE_CONFIG: Record<string, LeagueDisplayConfig> = {
  'Ligue 1': {
    displayName: 'Ligue 1',
    logoUrl: '/images/leagues/logo-ligue1.svg',
    countryId: 'France',
    countryName: 'France',
    countryFlag: '🇫🇷',
  },
  'Premier League': {
    displayName: 'Premier League',
    logoUrl: '/images/leagues/logo-premier-league.png',
    countryId: 'England',
    countryName: 'Angleterre',
    countryFlag: '🇬🇧',
  },
  Bundesliga: {
    displayName: 'Bundesliga',
    logoUrl: '/images/leagues/logo-bundesliga.png',
    countryId: 'Germany',
    countryName: 'Allemagne',
    countryFlag: '🇩🇪',
  },
  'Primera Division': {
    displayName: 'La Liga',
    logoUrl: '/images/leagues/logo-laliga.png',
    countryId: 'Spain',
    countryName: 'Espagne',
    countryFlag: '🇪🇸',
  },
  'Serie A': {
    displayName: 'Serie A',
    logoUrl: '/images/leagues/logo-serie-a.png',
    countryId: 'Italy',
    countryName: 'Italie',
    countryFlag: '🇮🇹',
  },
  Eredivisie: {
    displayName: 'Eredivisie',
    logoUrl: '/images/leagues/logo-eredivisie.png',
    countryId: 'Netherlands',
    countryName: 'Pays-Bas',
    countryFlag: '🇳🇱',
  },
  'Primeira Liga': {
    displayName: 'Liga Portugal',
    logoUrl: '/images/leagues/logo-liga-portugal.png',
    countryId: 'Portugal',
    countryName: 'Portugal',
    countryFlag: '🇵🇹',
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
