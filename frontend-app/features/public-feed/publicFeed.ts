import httpClient from '@/features/api'

export type PublicFeedTab = 'featured' | 'official' | 'live'

export type PublicFeedTeam = {
  id: string | null
  name: string | null
  logoUrl?: string | null
  league?: string | null
  country?: string | null
}

export type PublicFeedPost = {
  id: string
  eventType?: string
  type?: string
  bucket?: PublicFeedTab | 'official' | 'live'
  isFeatured?: boolean
  headline?: string
  title?: string
  body?: string
  subtitle?: string
  playerName?: string
  fromClubName?: string | null
  toClubName?: string | null
  sellerTeam?: PublicFeedTeam | null
  buyerTeam?: PublicFeedTeam | null
  amount?: number | null
  amountLabel?: string | null
  currency?: string
  league?: string | null
  country?: string | null
  publishedAt: string
  isOfficial?: boolean
  clubLogos?: string[]
}

type PublicFeedResponse = {
  posts: PublicFeedPost[]
  nextCursor?: string | null
}

type PublicFeedRequest = {
  tab?: PublicFeedTab
  type?: string
  limit?: number
}

function buildFeedQuery({ tab = 'featured', type, limit = 3 }: PublicFeedRequest) {
  const params = new URLSearchParams()
  params.set('tab', tab)
  params.set('limit', String(limit))
  if (type) {
    params.set('type', type)
  }

  return params.toString()
}

const OFFICIAL_FEED_TYPES = ['transfer_official', 'contract_signed', 'contract_renewal', 'loan']

class PublicFeedManager {
  async getPosts(request: PublicFeedRequest = {}) {
    return httpClient.get<PublicFeedResponse>(`/public-feed?${buildFeedQuery(request)}`)
  }

  async getImportantPosts(limit = 3): Promise<PublicFeedPost[]> {
    const responses = await Promise.all(
      OFFICIAL_FEED_TYPES.map((type) => this.getPosts({ tab: 'official', type, limit })),
    )
    const postsById = new Map<string, PublicFeedPost>()

    for (const response of responses) {
      if (!response.ok) {
        continue
      }

      for (const post of response.data.posts ?? []) {
        postsById.set(post.id, post)
      }
    }

    return Array.from(postsById.values())
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, limit)
  }
}

export const publicFeedManager = new PublicFeedManager()
