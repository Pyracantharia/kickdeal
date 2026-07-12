import { API_URL, PUBLIC_FEED_ENDPOINT } from '../constants/api'
import type {
  FeedFilter,
  FeedFilterOptions,
  FeedTab,
  PublicFeedDetailResponse,
  PublicFeedPost,
  PublicFeedPostDetail,
  PublicFeedResponse,
} from '../types/feed'

export type FeedPreviewResult = {
  posts: PublicFeedPost[]
  isEndpointAvailable: boolean
}

function buildUrl(path: string) {
  return `${API_URL.replace(/\/$/, '')}${path}`
}

type FeedRequest = {
  tab?: FeedTab
  filters?: FeedFilter
  cursor?: string | null
}

function buildFeedQuery({ tab = 'featured', filters = {}, cursor }: FeedRequest = {}) {
  const params = new URLSearchParams()
  params.set('tab', tab)
  params.set('limit', '30')

  if (cursor) params.set('cursor', cursor)
  if (filters.type) params.set('type', filters.type)
  if (filters.league?.trim()) params.set('league', filters.league.trim())
  if (filters.country?.trim()) params.set('country', filters.country.trim())
  if (filters.club?.trim()) params.set('club', filters.club.trim())
  if (filters.player?.trim()) params.set('player', filters.player.trim())

  return params.toString()
}

export async function getFeedPreview(request: FeedRequest = {}): Promise<FeedPreviewResult> {
  const query = buildFeedQuery(request)
  const response = await fetch(buildUrl(`${PUBLIC_FEED_ENDPOINT}?${query}`), {
    headers: {
      Accept: 'application/json',
    },
  })

  if (response.status === 404) {
    return {
      posts: [],
      isEndpointAvailable: false,
    }
  }

  if (!response.ok) {
    throw new Error(`Erreur API ${response.status}`)
  }

  const payload = (await response.json()) as PublicFeedResponse | PublicFeedPost[]

  return {
    posts: Array.isArray(payload) ? payload : payload.posts,
    isEndpointAvailable: true,
  }
}

export async function getFeedPost(postId: string): Promise<PublicFeedPostDetail> {
  const response = await fetch(buildUrl(`${PUBLIC_FEED_ENDPOINT}/${postId}`), {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Erreur API ${response.status}`)
  }

  const payload = (await response.json()) as PublicFeedDetailResponse

  return payload.post
}

export async function getFeedFilterOptions(): Promise<FeedFilterOptions> {
  const response = await fetch(buildUrl(`${PUBLIC_FEED_ENDPOINT}/filters/options`), {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Erreur API ${response.status}`)
  }

  return (await response.json()) as FeedFilterOptions
}
