import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { colors, spacing } from '../constants/theme'
import type { PublicFeedPost } from '../types/feed'

type FeedPostCardProps = {
  post: PublicFeedPost
  onPress?: () => void
}

function getPostType(post: PublicFeedPost) {
  return post.eventType ?? post.type ?? 'market_listing'
}

function getPostIcon(type: NonNullable<PublicFeedPost['type']>) {
  switch (type) {
    case 'agreement':
      return 'hand-left'
    case 'contract_signed':
      return 'create'
    case 'official_transfer':
    case 'transfer_official':
      return 'swap-horizontal'
    case 'market_removal':
      return 'remove-circle'
    case 'market_listing':
      return 'megaphone'
    case 'loan':
      return 'time'
    case 'contract_renewal':
      return 'document-text'
    case 'negotiation':
    case 'offer_accepted':
    case 'offer_refused':
    case 'offer_sent':
    case 'published_negotiation':
      return 'chatbubbles'
  }
}

function getPostLabel(type: NonNullable<PublicFeedPost['type']>, isOfficial?: boolean) {
  if (isOfficial || type === 'transfer_official' || type === 'official_transfer') return 'OFFICIEL'

  switch (type) {
    case 'agreement':
      return 'ACCORD'
    case 'contract_signed':
      return 'CONTRAT'
    case 'contract_renewal':
      return 'RENOUVELLEMENT'
    case 'loan':
      return 'PRET'
    case 'market_listing':
      return 'MARCHE'
    case 'market_removal':
      return 'RETRAIT'
    case 'offer_accepted':
      return 'OFFRE ACCEPTEE'
    case 'offer_refused':
      return 'OFFRE REFUSEE'
    case 'offer_sent':
    case 'negotiation':
    case 'published_negotiation':
      return 'NEGOCIATION'
  }
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Maintenant'
  }

  const diff = Date.now() - date.getTime()
  const minutes = Math.max(0, Math.floor(diff / 60_000))
  if (minutes < 1) return 'A l’instant'
  if (minutes < 60) return `Il y a ${minutes} min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours} h`

  return `${Math.floor(hours / 24)} j`
}

export function FeedPostCard({ post, onPress }: FeedPostCardProps) {
  const type = getPostType(post)
  const headline = post.headline ?? post.title ?? 'Actualite KickDeal'
  const body = post.body ?? post.subtitle ?? ''
  const sellerName = post.sellerTeam?.name ?? post.fromClubName
  const buyerName = post.buyerTeam?.name ?? post.toClubName

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name={getPostIcon(type)} size={18} color={colors.cyan} />
        </View>
        <View style={styles.headerText}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>{getPostLabel(type, post.isOfficial)}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.date}>{formatDate(post.publishedAt)}</Text>
          </View>
          <Text style={styles.title}>{headline}</Text>
          {body ? <Text style={styles.subtitle}>{body}</Text> : null}
        </View>
      </View>

      <View style={styles.metaRow}>
        {post.playerName ? <Text style={styles.player}>{post.playerName}</Text> : null}
        {post.amountLabel ? <Text style={styles.amount}>{post.amountLabel}</Text> : null}
      </View>

      {sellerName || buyerName ? (
        <View style={styles.clubLine}>
          <Text style={styles.clubText} numberOfLines={1}>
            {[sellerName, buyerName].filter(Boolean).join(' → ')}
          </Text>
        </View>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.context} numberOfLines={1}>
          {[post.league, post.country].filter(Boolean).join(' · ') || 'KickDeal live'}
        </Text>
        {post.isOfficial ? (
          <View style={styles.badge}>
            <Ionicons name="checkmark-circle" size={14} color={colors.cyan} />
            <Text style={styles.badgeText}>Officialisé</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.2,
    lineHeight: 24,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  player: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  amount: {
    color: colors.cyan,
    fontSize: 14,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  date: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    color: colors.cyan,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  dot: {
    color: colors.subtle,
    fontSize: 12,
    fontWeight: '900',
  },
  clubLine: {
    borderLeftWidth: 2,
    borderLeftColor: colors.borderStrong,
    paddingLeft: spacing.sm,
  },
  clubText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  context: {
    flex: 1,
    color: colors.subtle,
    fontSize: 12,
    fontWeight: '700',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: 'rgba(0, 245, 212, 0.08)',
  },
  badgeText: {
    color: colors.cyan,
    fontSize: 12,
    fontWeight: '800',
  },
})
