import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { getLeagueDisplayName } from '../constants/leagues'
import { colors, spacing } from '../constants/theme'
import { getFeedPost } from '../services/api'
import type { PublicFeedPostDetail, PublicFeedTeam } from '../types/feed'
import type { RootStackParamList } from '../types/navigation'

const backgroundImage = require('../../assets/images/app-bg.webp')
const logoImage = require('../../assets/images/logo.png')

type PostDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'PostDetail'>

export function PostDetailScreen({ navigation, route }: PostDetailScreenProps) {
  const [post, setPost] = useState<PublicFeedPostDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadPost() {
      try {
        const nextPost = await getFeedPost(route.params.postId)
        if (isMounted) {
          setPost(nextPost)
        }
      } catch {
        if (isMounted) {
          setErrorMessage('Impossible de charger cette actualité.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadPost()

    return () => {
      isMounted = false
    }
  }, [route.params.postId])

  const detailRows = useMemo(() => {
    if (!post) return []

    return [
      ['Joueur', post.playerName],
      ['Club vendeur', post.sellerTeam?.name ?? post.fromClubName],
      ['Club acheteur', post.buyerTeam?.name ?? post.toClubName],
      ['Montant', post.amountLabel],
      ['Championnat', getLeagueDisplayName(post.league)],
      ['Pays', post.country],
      ['Contrat jusqu’au', readDetail(post.details, 'contractUntil')],
      ['Durée', formatMonths(readDetail(post.details, 'durationMonths'))],
      ['Prime', readDetail(post.details, 'signingBonusLabel')],
      ['Clause libératoire', readDetail(post.details, 'releaseClauseLabel')],
      ['Statut', readDetail(post.details, 'status') ?? post.bucket],
    ].filter(([, value]) => Boolean(value))
  }, [post])

  const teams = post
    ? getConcernedTeams(
      normalizeTeam(post.sellerTeam, post.fromClubName),
      normalizeTeam(post.buyerTeam, post.toClubName),
    )
    : []
  const copy = post ? getReadableCopy(post) : null

  return (
    <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.background}>
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <View>
            <Text style={styles.topTitle}>Post</Text>
            <Text style={styles.topSubtitle}>Détail KickDeal Feed</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.cyan} size="large" />
            <Text style={styles.centerText}>Chargement...</Text>
          </View>
        ) : errorMessage || !post || !copy ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage ?? 'Actualité introuvable.'}</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.postPanel}>
              <View style={styles.authorRow}>
                <Image source={logoImage} style={styles.avatar} />
                <View style={styles.authorText}>
                  <View style={styles.authorNameRow}>
                    <Text style={styles.author}>KickDeal Feed</Text>
                    <Ionicons name="checkmark-circle" size={16} color={colors.cyan} />
                  </View>
                  <Text style={styles.handle}>@kickdeal · {formatDate(post.publishedAt)}</Text>
                </View>
              </View>

              <View style={styles.badgeRow}>
                <Text style={styles.badge}>{post.bucket === 'official' ? 'OFFICIEL' : 'LIVE'}</Text>
                <Text style={styles.badgeMuted}>{getEventLabel(post)}</Text>
              </View>

              <Text style={styles.headline}>{copy.headline}</Text>
              {copy.body ? <Text style={styles.body}>{copy.body}</Text> : null}

              {teams.length > 0 ? (
                <View style={styles.clubPanel}>
                  <View style={styles.clubGlow} />
                  {teams.length > 1 ? (
                    <View style={styles.clubRoute}>
                      <TeamBlock team={teams[0]} />
                      <View style={styles.swapMark}>
                        <Ionicons name="arrow-forward" size={20} color={colors.text} />
                      </View>
                      <TeamBlock team={teams[1]} align="right" />
                    </View>
                  ) : (
                    <View style={styles.singleClub}>
                      <TeamBlock team={teams[0]} variant="large" />
                    </View>
                  )}
                  <View style={[styles.clubFooter, teams.length === 1 && styles.clubFooterSingle]}>
                    <Text
                      style={[styles.playerName, teams.length === 1 && styles.playerNameSingle]}
                      numberOfLines={1}
                    >
                      {post.playerName ?? 'Actualité mercato'}
                    </Text>
                    {post.amountLabel ? (
                      <Text style={[styles.amount, teams.length === 1 && styles.amountSingle]}>
                        {post.amountLabel}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ) : null}
            </View>

            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Informations publiques</Text>
              {detailRows.map(([label, value]) => (
                <View key={label} style={styles.row}>
                  <Text style={styles.rowLabel}>{label}</Text>
                  <Text style={styles.rowValue}>{String(value)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Historique public</Text>
              <View style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineText}>
                  <Text style={styles.timelineTitle}>Publication sur KickDeal Feed</Text>
                  <Text style={styles.timelineDate}>{formatDate(post.publishedAt)}</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </ImageBackground>
  )
}

function TeamBlock({
  team,
  align = 'left',
  variant = 'default',
}: {
  team: PublicFeedTeam
  align?: 'left' | 'right'
  variant?: 'default' | 'large'
}) {
  return (
    <View
      style={[
        styles.teamBlock,
        variant === 'large' && styles.teamBlockLarge,
        align === 'right' && styles.teamBlockRight,
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

function readDetail(details: PublicFeedPostDetail['details'], key: string) {
  const value = details?.[key]
  return typeof value === 'string' || typeof value === 'number' ? value : null
}

function formatMonths(value: string | number | null) {
  if (!value) return null
  const months = Number(value)
  if (!Number.isFinite(months)) return null
  return `${months} mois`
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'date inconnue'

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
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

function getReadableCopy(post: PublicFeedPostDetail) {
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

function getEventLabel(post: PublicFeedPostDetail) {
  switch (post.eventType ?? post.type) {
    case 'transfer_official':
    case 'official_transfer':
      return 'HERE WE GO'
    case 'contract_renewal':
      return 'Renouvellement'
    case 'contract_signed':
      return 'Contrat signé'
    case 'loan':
      return 'Prêt'
    case 'market_listing':
      return 'Joueur sur le marché'
    case 'market_removal':
      return 'Retrait du marché'
    case 'negotiation':
    case 'offer_sent':
      return 'Négociation'
    case 'offer_accepted':
      return 'Offre acceptée'
    case 'offer_refused':
      return 'Offre refusée'
    default:
      return 'Actualité mercato'
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
  background: {
    flex: 1,
    backgroundColor: colors.background,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.11)',
    backgroundColor: 'rgba(0,0,0,0.82)',
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  topTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
  },
  topSubtitle: {
    color: colors.subtle,
    fontSize: 12,
    fontWeight: '800',
  },
  content: {
    paddingBottom: spacing.xl,
  },
  postPanel: {
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.11)',
    backgroundColor: 'rgba(0,0,0,0.42)',
    padding: spacing.lg,
    gap: spacing.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 46,
    height: 46,
  },
  authorText: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  author: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  handle: {
    color: colors.subtle,
    fontSize: 13,
    fontWeight: '800',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    color: colors.cyan,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  badgeMuted: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
  },
  headline: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 33,
    fontWeight: '900',
  },
  body: {
    color: 'rgba(248,251,255,0.86)',
    fontSize: 18,
    lineHeight: 27,
    fontWeight: '500',
  },
  clubPanel: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 24,
    backgroundColor: 'rgba(6,17,28,0.94)',
  },
  clubGlow: {
    height: 5,
    backgroundColor: colors.cyan,
  },
  clubRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  singleClub: {
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  teamBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  teamBlockLarge: {
    alignItems: 'center',
  },
  teamBlockRight: {
    alignItems: 'flex-end',
  },
  clubLogo: {
    width: 54,
    height: 54,
  },
  clubLogoLarge: {
    width: 78,
    height: 78,
  },
  clubLogoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: 'rgba(155,93,229,0.28)',
  },
  clubLogoFallbackLarge: {
    width: 78,
    height: 78,
    borderRadius: 22,
  },
  clubLogoText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  teamName: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '900',
  },
  teamNameRight: {
    textAlign: 'right',
  },
  teamNameLarge: {
    textAlign: 'center',
    fontSize: 20,
    lineHeight: 24,
  },
  swapMark: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  clubFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: spacing.md,
  },
  clubFooterSingle: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  playerName: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  playerNameSingle: {
    flex: 0,
    textAlign: 'center',
  },
  amount: {
    color: colors.cyan,
    fontSize: 16,
    fontWeight: '900',
  },
  amountSingle: {
    textAlign: 'center',
  },
  panel: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.38)',
    overflow: 'hidden',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    padding: spacing.md,
  },
  rowLabel: {
    flex: 1,
    color: colors.subtle,
    fontSize: 13,
    fontWeight: '800',
  },
  rowValue: {
    flex: 1.25,
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'right',
  },
  timelineItem: {
    flexDirection: 'row',
    gap: spacing.md,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    padding: spacing.md,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    backgroundColor: colors.cyan,
  },
  timelineText: {
    flex: 1,
    gap: 3,
  },
  timelineTitle: {
    color: colors.text,
    fontWeight: '900',
  },
  timelineDate: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  centerText: {
    color: colors.muted,
    fontWeight: '800',
  },
  errorBox: {
    margin: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,107,122,0.34)',
    borderRadius: 18,
    backgroundColor: 'rgba(255,107,122,0.1)',
    padding: spacing.lg,
  },
  errorText: {
    color: colors.text,
    fontWeight: '800',
  },
})
