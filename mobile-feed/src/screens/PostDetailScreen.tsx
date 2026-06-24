import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
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

import { colors, spacing } from '../constants/theme'
import { getFeedPost } from '../services/api'
import type { PublicFeedPostDetail } from '../types/feed'
import type { RootStackParamList } from '../types/navigation'

const backgroundImage = require('../../assets/images/app-bg.png')

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
      ['Championnat', post.league],
      ['Pays', post.country],
      ['Contrat jusqu’au', readDetail(post.details, 'contractUntil')],
      ['Durée', formatMonths(readDetail(post.details, 'durationMonths'))],
      ['Prime', readDetail(post.details, 'signingBonusLabel')],
      ['Clause libératoire', readDetail(post.details, 'releaseClauseLabel')],
      ['Statut', readDetail(post.details, 'status') ?? post.bucket],
    ].filter(([, value]) => Boolean(value))
  }, [post])

  return (
    <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.background}>
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.topTitle}>Détail mercato</Text>
        </View>

        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.cyan} size="large" />
            <Text style={styles.centerText}>Chargement...</Text>
          </View>
        ) : errorMessage || !post ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage ?? 'Actualité introuvable.'}</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.badge}>
              <Ionicons name={post.isOfficial ? 'checkmark-circle' : 'radio'} size={16} color={colors.cyan} />
              <Text style={styles.badgeText}>{post.bucket === 'official' ? 'OFFICIEL' : 'LIVE KICKDEAL'}</Text>
            </View>

            <Text style={styles.headline}>{post.headline ?? post.title}</Text>
            <Text style={styles.body}>{post.body ?? post.subtitle}</Text>

            <View style={styles.panel}>
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
                  <Text style={styles.timelineTitle}>Publication KickDeal</Text>
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
  if (Number.isNaN(date.getTime())) return 'Date inconnue'

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.background,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3,10,17,0.76)',
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
    borderColor: colors.border,
    backgroundColor: 'rgba(6,17,28,0.94)',
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(0,245,212,0.1)',
  },
  badgeText: {
    color: colors.cyan,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  headline: {
    color: colors.text,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
  },
  body: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 27,
    fontWeight: '700',
  },
  panel: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  rowLabel: {
    flex: 1,
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  rowValue: {
    flex: 1.2,
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'right',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    padding: spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    paddingTop: 0,
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
