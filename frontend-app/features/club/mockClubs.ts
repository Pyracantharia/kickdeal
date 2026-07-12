export type Club = {
  id: string
  name: string
  league: string
  country: string
}

export type VerificationMethod =
  | { type: 'document'; file: File }
  | { type: 'email'; email: string }
  | { type: 'message'; message: string }

export type JoinResult = {
  club: Club & { memberCount: number }
  inviter: {
    firstname: string
    lastname: string
    email: string
    role: string
  }
  yourRole: string
  joinedAt: string
}

const MOCK_INVITERS = [
  { firstname: 'Thomas', lastname: 'Bernard', email: 'thomas.bernard@kickdeal.com', role: 'Directeur sportif' },
  { firstname: 'Sophie', lastname: 'Martin', email: 'sophie.martin@kickdeal.com', role: 'Gestionnaire principal' },
  { firstname: 'Lucas', lastname: 'Dubois', email: 'lucas.dubois@kickdeal.com', role: 'Responsable des transferts' },
]

export function getMockJoinResult(code: string): JoinResult {
  const hash = code.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const club = MOCK_CLUBS[hash % MOCK_CLUBS.length]
  const inviter = MOCK_INVITERS[hash % MOCK_INVITERS.length]
  return {
    club: { ...club, memberCount: 4 + (hash % 12) },
    inviter,
    yourRole: 'Membre',
    joinedAt: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
  }
}

export const MOCK_CLUBS: Club[] = [
  { id: '1', name: 'Paris Saint-Germain', league: 'Ligue 1', country: 'France' },
  { id: '2', name: 'Real Madrid', league: 'La Liga', country: 'Espagne' },
  { id: '3', name: 'Manchester United', league: 'Premier League', country: 'Angleterre' },
  { id: '4', name: 'Manchester City', league: 'Premier League', country: 'Angleterre' },
  { id: '5', name: 'FC Barcelona', league: 'La Liga', country: 'Espagne' },
  { id: '6', name: 'Olympique de Marseille', league: 'Ligue 1', country: 'France' },
  { id: '7', name: 'Olympique Lyonnais', league: 'Ligue 1', country: 'France' },
  { id: '8', name: 'Bayern Munich', league: 'Bundesliga', country: 'Allemagne' },
  { id: '9', name: 'Borussia Dortmund', league: 'Bundesliga', country: 'Allemagne' },
  { id: '10', name: 'Juventus', league: 'Serie A', country: 'Italie' },
  { id: '11', name: 'AC Milan', league: 'Serie A', country: 'Italie' },
  { id: '12', name: 'Chelsea FC', league: 'Premier League', country: 'Angleterre' },
  { id: '13', name: 'Arsenal FC', league: 'Premier League', country: 'Angleterre' },
  { id: '14', name: 'Liverpool FC', league: 'Premier League', country: 'Angleterre' },
  { id: '15', name: 'Atlético de Madrid', league: 'La Liga', country: 'Espagne' },
  { id: '16', name: 'AS Monaco', league: 'Ligue 1', country: 'France' },
  { id: '17', name: 'Inter Milan', league: 'Serie A', country: 'Italie' },
  { id: '18', name: 'Tottenham Hotspur', league: 'Premier League', country: 'Angleterre' },
]