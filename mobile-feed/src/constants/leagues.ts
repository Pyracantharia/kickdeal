const LEAGUE_DISPLAY_NAMES: Record<string, string> = {
  Bundesliga: 'Bundesliga',
  Eredivisie: 'Eredivisie',
  'Ligue 1': 'Ligue 1',
  'Premier League': 'Premier League',
  'Primera Division': 'La Liga',
  'Primeira Liga': 'Liga Portugal',
  'Serie A': 'Serie A',
}

export function getLeagueDisplayName(leagueName?: string | null) {
  if (!leagueName) return null

  return LEAGUE_DISPLAY_NAMES[leagueName] ?? leagueName
}
