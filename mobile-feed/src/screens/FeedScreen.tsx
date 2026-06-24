import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { FeedFiltersModal } from '../components/FeedFiltersModal'
import { FeedPostCard } from '../components/FeedPostCard'
import { colors, spacing } from '../constants/theme'
import { getFeedPreview } from '../services/api'
import type { FeedFilter, FeedTab, PublicFeedPost } from '../types/feed'
import type { RootStackParamList } from '../types/navigation'

const backgroundImage = require('../../assets/images/app-bg.png')
const logoImage = require('../../assets/images/logo.png')

const FEED_TABS: Array<{ value: FeedTab; label: string }> = [
  { value: 'featured', label: 'À la une' },
  { value: 'official', label: 'Officiel' },
  { value: 'live', label: 'Live' },
]

const MOCK_POSTS: PublicFeedPost[] = [
  {
    id: 'mock-1',
    eventType: 'transfer_official',
    bucket: 'official',
    headline: 'OFFICIEL ! HERE WE GO',
    body: 'Kylian Mbappé rejoint Liverpool FC. Montant : 180 M EUR. Contrat jusqu’en 2030.',
    playerName: 'Kylian Mbappé',
    fromClubName: 'Real Madrid CF',
    toClubName: 'Liverpool FC',
    amountLabel: '180 M EUR',
    league: 'Premier League',
    country: 'Angleterre',
    publishedAt: new Date().toISOString(),
    isOfficial: true,
  },
  {
    id: 'mock-2',
    eventType: 'negotiation',
    bucket: 'live',
    headline: 'NEGOCIATION',
    body: 'Manchester City a transmis une offre de 120 M EUR pour Jude Bellingham.',
    playerName: 'Jude Bellingham',
    fromClubName: 'Real Madrid CF',
    toClubName: 'Manchester City',
    amountLabel: '120 M EUR',
    league: 'Premier League',
    publishedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: 'mock-3',
    eventType: 'contract_renewal',
    bucket: 'official',
    headline: 'RENOUVELLEMENT',
    body: 'Vinicius Junior prolonge avec le Real Madrid jusqu’en 2031.',
    playerName: 'Vinicius Junior',
    toClubName: 'Real Madrid CF',
    publishedAt: new Date(Date.now() - 1000 * 60 * 52).toISOString(),
    isOfficial: true,
  },
]

type FeedScreenProps = NativeStackScreenProps<RootStackParamList, 'Feed'>

export function FeedScreen({ navigation }: FeedScreenProps) {
  const [activeTab, setActiveTab] = useState<FeedTab>('featured')
  const [filters, setFilters] = useState<FeedFilter>({})
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [posts, setPosts] = useState<PublicFeedPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isEndpointAvailable, setIsEndpointAvailable] = useState(true)

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((value) => Boolean(String(value ?? '').trim())).length,
    [filters],
  )

  const loadFeed = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setErrorMessage(null)

    try {
      const result = await getFeedPreview({ tab: activeTab, filters })
      setPosts(result.posts)
      setIsEndpointAvailable(result.isEndpointAvailable)
    } catch {
      setErrorMessage('Impossible de joindre le backend KickDeal pour le moment.')
      setPosts([])
      setIsEndpointAvailable(true)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [activeTab, filters])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  const usesMockPosts = !isLoading && !errorMessage && !isEndpointAvailable
  const isEmpty = !isLoading && !errorMessage && isEndpointAvailable && posts.length === 0
  const visiblePosts = usesMockPosts ? MOCK_POSTS : posts

  return (
    <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.background}>
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.hero}>
          <View style={styles.brandRow}>
            <Image source={logoImage} style={styles.logo} />
            <View style={styles.brandText}>
              <Text style={styles.brand}>KickDeal Feed</Text>
              <Text style={styles.brandCaption}>Actualités publiques du marché</Text>
            </View>
            <Pressable style={styles.filterButton} onPress={() => setIsFilterOpen(true)}>
              <Ionicons name="options" size={18} color={colors.text} />
              {activeFilterCount > 0 ? (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>

          <Text style={styles.title}>Mercato live</Text>
          <Text style={styles.subtitle}>
            Transferts officialisés, accords et signaux publics générés par KickDeal.
          </Text>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <Pressable style={styles.retryButton} onPress={() => loadFeed()}>
                <Ionicons name="refresh" size={16} color={colors.text} />
                <Text style={styles.retryText}>Réessayer</Text>
              </Pressable>
            </View>
          ) : null}

          {usesMockPosts ? (
            <View style={styles.noticeBox}>
              <Text style={styles.noticeTitle}>Aperçu média de démonstration</Text>
              <Text style={styles.noticeText}>
                L’endpoint public n’est pas encore disponible sur cet environnement.
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.tabsBar}>
          {FEED_TABS.map((tab) => {
            const isActive = tab.value === activeTab
            return (
              <Pressable
                key={tab.value}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab.value)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
              </Pressable>
            )
          })}
        </View>

        {isEmpty ? (
          <View style={styles.emptyBox}>
            <Ionicons name="file-tray-outline" size={26} color={colors.cyan} />
            <Text style={styles.emptyTitle}>Aucune actualité publique</Text>
            <Text style={styles.emptyText}>
              Les prochains transferts, prêts et renouvellements publiés apparaîtront ici.
            </Text>
          </View>
        ) : null}

        <FlatList
          data={isLoading ? [] : visiblePosts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadFeed(true)}
              tintColor={colors.cyan}
            />
          }
          ListFooterComponent={<View style={styles.footerSpace} />}
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.centerState}>
                <ActivityIndicator color={colors.cyan} size="large" />
                <Text style={styles.centerText}>Connexion au feed public...</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <FeedPostCard
              post={item}
              onPress={() => {
                if (!item.id.startsWith('mock-')) {
                  navigation.navigate('PostDetail', { postId: item.id })
                }
              }}
            />
          )}
          ItemSeparatorComponent={null}
        />

        <FeedFiltersModal
          visible={isFilterOpen}
          filters={filters}
          onChange={setFilters}
          onClose={() => setIsFilterOpen(false)}
          onReset={() => setFilters({})}
        />
      </SafeAreaView>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.background,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 10, 17, 0.72)',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logo: {
    width: 42,
    height: 42,
  },
  brandText: {
    flex: 1,
  },
  brand: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  brandCaption: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  filterButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  filterBadge: {
    position: 'absolute',
    right: -2,
    top: -2,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.cyan,
  },
  filterBadgeText: {
    color: colors.background,
    fontSize: 11,
    fontWeight: '900',
  },
  title: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  tabsBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(6,17,28,0.96)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 999,
    paddingVertical: spacing.sm,
  },
  tabActive: {
    backgroundColor: 'rgba(0,245,212,0.14)',
  },
  tabText: {
    color: colors.muted,
    fontWeight: '900',
  },
  tabTextActive: {
    color: colors.cyan,
  },
  errorBox: {
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 122, 0.34)',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 107, 122, 0.1)',
    padding: spacing.md,
    gap: spacing.sm,
  },
  errorText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: spacing.sm,
  },
  retryText: {
    color: colors.text,
    fontWeight: '900',
  },
  noticeBox: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 245, 212, 0.08)',
    padding: spacing.md,
    gap: 4,
  },
  noticeTitle: {
    color: colors.cyan,
    fontSize: 14,
    fontWeight: '900',
  },
  noticeText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  emptyBox: {
    margin: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.cardStrong,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
    gap: spacing.md,
  },
  centerText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '700',
  },
  footerSpace: {
    height: spacing.xl,
  },
})
