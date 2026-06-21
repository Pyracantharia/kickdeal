const POSITION_LABELS: Record<string, string> = {
  'Attacking Midfield': 'Milieu offensif',
  'Central Midfield': 'Milieu central',
  'Centre-Back': 'Défenseur central',
  'Centre-Forward': 'Avant-centre',
  Coach: 'Entraîneur',
  Defence: 'Défenseur',
  'Defensive Midfield': 'Milieu défensif',
  Goalkeeper: 'Gardien',
  'Left Midfield': 'Milieu gauche',
  'Left Winger': 'Ailier gauche',
  'Left-Back': 'Arrière gauche',
  Midfield: 'Milieu',
  Offence: 'Attaquant',
  'Right Midfield': 'Milieu droit',
  'Right Winger': 'Ailier droit',
  'Right-Back': 'Arrière droit',
}

export function getPositionDisplayName(position?: string | null): string {
  if (!position) return 'Poste inconnu'

  return POSITION_LABELS[position] ?? position
}
