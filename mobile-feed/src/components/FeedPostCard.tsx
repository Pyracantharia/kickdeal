import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { getLeagueDisplayName } from '../constants/leagues'
import { colors, spacing } from '../constants/theme'
import type { PublicFeedPost, PublicFeedTeam } from '../types/feed'

const logoImage = require('../../assets/images/logo.png')

type FeedPostCardProps = {
  post: PublicFeedPost
  onPress?: () => void
}

function getPostType(post: PublicFeedPost) {
  return post.eventType ?? post.type ?? 'market_listing'
}

function getPostLabel(post: PublicFeedPost) {
  const type = getPostType(post)
  if (post.isOfficial || type === 'transfer_official' || type === 'official_transfer') return 'OFFICIEL'

  switch (type) {
    case 'agreement':
      return 'ACCORD VERBAL'
    case 'contract_signed':
      return 'SIGNATURE'
    case 'contract_renewal':
      return 'RENOUVELLEMENT'
    case 'loan':
      return 'PRÊT'
    case 'market_listing':
      return 'SUR LE MARCHÉ'
    case 'market_removal':
      return 'RETRAIT'
    case 'offer_accepted':
      return 'OFFRE ACCEPTÉE'
    case 'offer_refused':
      return 'OFFRE REFUSÉE'
    case 'offer_sent':
    case 'negotiation':
    case 'published_negotiation':
      return 'LIVE NÉGO'
  }
}

function getPostTone(post: PublicFeedPost) {
  const type = getPostType(post)
  if (post.isOfficial || type === 'transfer_official' || type === 'official_transfer') return 'HERE WE GO'
  if (type === 'contract_renewal') return 'CONTRAT'
  if (type === 'loan') return 'PRÊT FINALISÉ'
  if (type === 'market_listing') return 'JOUEUR DISPONIBLE'
  if (type === 'market_removal') return 'JOUEUR RETIRÉ'
  return 'INFO KICKDEAL'
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'maintenant'
  }

  const diff = Date.now() - date.getTime()
  const minutes = Math.max(0, Math.floor(diff / 60_000))
  if (minutes < 1) return 'maintenant'
  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h`

  return `${Math.floor(hours / 24)} j`
}

export function FeedPostCard({ post, onPress }: FeedPostCardProps) {
  const copy = getReadableCopy(post)
  const sellerTeam = normalizeTeam(post.sellerTeam, post.fromClubName)
  const buyerTeam = normalizeTeam(post.buyerTeam, post.toClubName)
  const teams = getConcernedTeams(sellerTeam, buyerTeam)
  const hasClubContext = teams.length > 0
  const leagueLabel = getLeagueDisplayName(post.league)

  return (
    <Pressable style={styles.post} onPress={onPress}>
      <View style={styles.avatarColumn}>
        <Image source={logoImage} style={styles.avatar} />
        <View style={styles.threadLine} />
      </View>

      <View style={styles.content}>
        <View style={styles.authorRow}>
          <Text style={styles.author} numberOfLines={1}>KickDeal Feed</Text>
          <Ionicons name="checkmark-circle" size={15} color={colors.cyan} />
          <Text style={styles.handle} numberOfLines={1}>@kickdeal</Text>
          <Text style={styles.time}>· {formatDate(post.publishedAt)}</Text>
        </View>

        <View style={styles.labelRow}>
          <Text style={styles.label}>{getPostLabel(post)}</Text>
          <Text style={styles.tone}>{getPostTone(post)}</Text>
        </View>

        <Text style={styles.headline}>{copy.headline}</Text>
        {copy.body ? <Text style={styles.body}>{copy.body}</Text> : null}

        {hasClubContext ? (
          <View style={styles.mediaCard}>
            <View style={styles.mediaGlow} />
            {teams.length > 1 ? (
              <View style={styles.clubRoute}>
                <TeamIdentity team={teams[0]} align="left" />
                <View style={styles.swapMark}>
                  <Ionicons name="arrow-forward" size={18} color={colors.text} />
                </View>
                <TeamIdentity team={teams[1]} align="right" />
              </View>
            ) : (
              <View style={styles.singleClubRoute}>
                <TeamIdentity team={teams[0]} align="left" variant="large" />
              </View>
            )}
            <View style={[styles.mediaFooter, teams.length === 1 && styles.mediaFooterSingle]}>
              <Text
                style={[styles.playerName, teams.length === 1 && styles.playerNameSingle]}
                numberOfLines={1}
              >
                {post.playerName ?? 'Breaking mercato'}
              </Text>
              {post.amountLabel ? (
                <Text style={[styles.amount, teams.length === 1 && styles.amountSingle]}>
                  {post.amountLabel}
                </Text>
              ) : null}
            </View>
          </View>
        ) : post.amountLabel || post.playerName ? (
          <View style={styles.quickMeta}>
            {post.playerName ? <Text style={styles.playerName}>{post.playerName}</Text> : null}
            {post.amountLabel ? <Text style={styles.amount}>{post.amountLabel}</Text> : null}
          </View>
        ) : null}

        <View style={styles.footer}>
          <View style={styles.footerAction}>
            <Ionicons name="chatbubble-outline" size={16} color={colors.subtle} />
            <Text style={styles.footerText}>Détail</Text>
          </View>
          <View style={styles.footerAction}>
            <Ionicons name="stats-chart-outline" size={16} color={colors.subtle} />
            <Text style={styles.footerText}>{[leagueLabel, post.country].filter(Boolean).join(' · ') || 'Live'}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  )
}

function TeamIdentity({
  team,
  align,
  variant = 'default',
}: {
  team: PublicFeedTeam
  align: 'left' | 'right'
  variant?: 'default' | 'large'
}) {
  return (
    <View
      style={[
        styles.teamIdentity,
        variant === 'large' && styles.teamIdentityLarge,
        align === 'right' && styles.teamIdentityRight,
      ]}
    >
      <ClubLogo team={team} variant={variant} />
      <Text
        style={[
          styles.teamName,
          variant === 'large' && styles.teamNameLarge,
          align === 'right' && styles.teamNameRight,
        ]}
        numberOfLines={2}
      >
        {team.name}
      </Text>
    </View>
  )
}

function ClubLogo({ team, variant = 'default' }: { team: PublicFeedTeam; variant?: 'default' | 'large' }) {
  const logoStyle = variant === 'large' ? styles.clubLogoLarge : styles.clubLogo

  if (team.logoUrl) {
    return <Image source={{ uri: team.logoUrl }} style={logoStyle} resizeMode="contain" />
  }

  return (
    <View style={[styles.clubLogoFallback, variant === 'large' && styles.clubLogoFallbackLarge]}>
      <Text style={styles.clubLogoText}>{getInitials(team.name)}</Text>
    </View>
  )
}

function normalizeTeam(team?: PublicFeedTeam | null, fallbackName?: string | null): PublicFeedTeam {
  return {
    id: team?.id ?? null,
    name: team?.name ?? fallbackName ?? null,
    logoUrl: team?.logoUrl ?? null,
    league: team?.league ?? null,
    country: team?.country ?? null,
  }
}

function getConcernedTeams(sellerTeam: PublicFeedTeam, buyerTeam: PublicFeedTeam) {
  const teams = [sellerTeam, buyerTeam].filter((team) => Boolean(team.name))
  const seen = new Set<string>()

  return teams.filter((team) => {
    const key = team.id ?? team.name
    if (!key || seen.has(key)) return false
    seen.add(key)

    return true
  })
}

function getReadableCopy(post: PublicFeedPost) {
  const rawHeadline = (post.headline ?? post.title ?? '').trim()
  const rawBody = (post.body ?? post.subtitle ?? '').trim()
  const normalizedHeadline = rawHeadline
    .replace(/[!,.]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()

  if (
    rawBody
    && ['OFFICIEL HERE WE GO', 'SUR LE MARCHE', 'SUR LE MARCHÉ', 'RENOUVELLEMENT'].includes(normalizedHeadline)
  ) {
    const sentenceMatch = rawBody.match(/^(.+?[.!?])\s+(.*)$/)

    return {
      headline: sentenceMatch?.[1] ?? rawBody,
      body: sentenceMatch?.[2] ?? '',
    }
  }

  return {
    headline: rawHeadline || rawBody || 'Actualité KickDeal',
    body: rawHeadline ? rawBody : '',
  }
}

function getInitials(value?: string | null) {
  return (value ?? 'KD')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

const styles = StyleSheet.create({
  post: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  avatarColumn: {
    alignItems: 'center',
    width: 42,
  },
  avatar: {
    width: 42,
    height: 42,
  },
  threadLine: {
    flex: 1,
    width: 2,
    marginTop: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  content: {
    flex: 1,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  author: {
    maxWidth: 116,
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  handle: {
    color: colors.subtle,
    fontSize: 14,
    fontWeight: '700',
  },
  time: {
    color: colors.subtle,
    fontSize: 14,
    fontWeight: '700',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    color: colors.cyan,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  tone: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
    opacity: 0.82,
  },
  headline: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 24,
  },
  body: {
    color: 'rgba(248,251,255,0.86)',
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '500',
  },
  mediaCard: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 22,
    backgroundColor: 'rgba(6,17,28,0.92)',
    marginTop: spacing.xs,
  },
  mediaGlow: {
    height: 5,
    backgroundColor: colors.cyan,
    opacity: 0.86,
  },
  clubRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  singleClubRoute: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    alignItems: 'center',
  },
  teamIdentity: {
    flex: 1,
    gap: spacing.xs,
  },
  teamIdentityLarge: {
    alignItems: 'center',
  },
  teamIdentityRight: {
    alignItems: 'flex-end',
  },
  teamName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 16,
  },
  teamNameRight: {
    textAlign: 'right',
  },
  teamNameLarge: {
    textAlign: 'center',
    fontSize: 17,
    lineHeight: 21,
  },
  clubLogo: {
    width: 48,
    height: 48,
  },
  clubLogoLarge: {
    width: 66,
    height: 66,
  },
  clubLogoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(155,93,229,0.28)',
  },
  clubLogoFallbackLarge: {
    width: 66,
    height: 66,
    borderRadius: 18,
  },
  clubLogoText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  swapMark: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  mediaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: spacing.md,
  },
  mediaFooterSingle: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  quickMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
  },
  playerName: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  playerNameSingle: {
    flex: 0,
    textAlign: 'center',
  },
  amount: {
    color: colors.cyan,
    fontSize: 14,
    fontWeight: '900',
  },
  amountSingle: {
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerText: {
    color: colors.subtle,
    fontSize: 12,
    fontWeight: '800',
  },
})
