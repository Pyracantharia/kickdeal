export type PublicFeedPostType =
  | 'agreement'
  | 'contract_signed'
  | 'official_transfer'
  | 'transfer_official'
  | 'market_listing'
  | 'market_removal'
  | 'loan'
  | 'contract_renewal'
  | 'negotiation'
  | 'offer_accepted'
  | 'offer_refused'
  | 'offer_sent'
  | 'published_negotiation'

export type FeedTab = 'featured' | 'official' | 'live'

export type FeedFilter = {
  type?: PublicFeedPostType | ''
  league?: string
  country?: string
  club?: string
  player?: string
}

export type PublicFeedTeam = {
  id: string | null
  name: string | null
  logoUrl?: string | null
  league?: string | null
  country?: string | null
}

export type PublicFeedPlayer = {
  id: string | null
  name?: string | null
  position?: string | null
  nationality?: string | null
  photoUrl?: string | null
  contractEndDate?: string | null
}

export type PublicFeedPost = {
  id: string
  eventType?: PublicFeedPostType
  type?: PublicFeedPostType
  bucket?: FeedTab | 'official' | 'live'
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
  player?: PublicFeedPlayer | null
  amount?: number | null
  amountLabel?: string | null
  currency?: string
  league?: string | null
  country?: string | null
  publishedAt: string
  isOfficial?: boolean
}

export type PublicFeedPostDetail = PublicFeedPost & {
  details?: Record<string, unknown> | null
  history?: Array<Record<string, unknown>> | null
}

export type PublicFeedResponse = {
  posts: PublicFeedPost[]
  nextCursor?: string | null
}

export type PublicFeedDetailResponse = {
  post: PublicFeedPostDetail
}
