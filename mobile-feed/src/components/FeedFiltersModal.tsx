import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { getLeagueDisplayName } from '../constants/leagues'
import { colors, spacing } from '../constants/theme'
import type { FeedFilter, FeedFilterOptions, PublicFeedPostType } from '../types/feed'

const EVENT_TYPES: Array<{ value: PublicFeedPostType | ''; label: string }> = [
  { value: '', label: 'Tous' },
  { value: 'transfer_official', label: 'Transferts' },
  { value: 'contract_renewal', label: 'Renouvellements' },
  { value: 'loan', label: 'Prêts' },
  { value: 'market_listing', label: 'Marché' },
  { value: 'negotiation', label: 'Négociations' },
]

type FeedFiltersModalProps = {
  visible: boolean
  filters: FeedFilter
  options?: FeedFilterOptions | null
  onChange: (filters: FeedFilter) => void
  onClose: () => void
  onReset: () => void
}

export function FeedFiltersModal({
  visible,
  filters,
  options,
  onChange,
  onClose,
  onReset,
}: FeedFiltersModalProps) {
  const clubs = options?.clubs ?? []
  const leagues = options?.leagues ?? []
  const countries = options?.countries ?? []
  const displayLeagues = Object.values(
    leagues.reduce<Record<string, { rawName: string; displayName: string; clubCount: number }>>((acc, league) => {
      const displayName = getLeagueDisplayName(league.name) ?? league.name
      const clubCount = league.clubCount ?? 0
      const current = acc[displayName]

      acc[displayName] = {
        rawName: current && current.clubCount > clubCount ? current.rawName : league.name,
        displayName,
        clubCount: (current?.clubCount ?? 0) + clubCount,
      }

      return acc
    }, {}),
  )
  const filteredClubs = filters.league
    ? clubs.filter((club) => club.league === filters.league)
    : clubs

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.kicker}>Explorer le mercato</Text>
              <Text style={styles.title}>Filtres</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable style={styles.clearAllButton} onPress={onReset}>
                <Text style={styles.clearAllText}>Tout effacer</Text>
              </Pressable>
              <Pressable style={styles.iconButton} onPress={onClose}>
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Type d’actualité</Text>
            <View style={styles.chips}>
              {EVENT_TYPES.map((eventType) => {
                const isActive = (filters.type ?? '') === eventType.value
                return (
                  <Pressable
                    key={eventType.value || 'all'}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => onChange({ ...filters, type: eventType.value })}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {eventType.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>

            <View style={styles.selectorHeader}>
              <Text style={styles.label}>Championnat</Text>
              {filters.league ? (
                <Pressable onPress={() => onChange({ ...filters, league: undefined, club: undefined })}>
                  <Text style={styles.clearText}>Tout voir</Text>
                </Pressable>
              ) : null}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {displayLeagues.length === 0 ? (
                <EmptyPill label="Aucune ligue disponible" />
              ) : (
                displayLeagues.map((league) => {
                  const isActive = getLeagueDisplayName(filters.league) === league.displayName
                  return (
                    <Pressable
                      key={league.displayName}
                      style={[styles.leaguePill, isActive && styles.leaguePillActive]}
                      onPress={() => onChange({ ...filters, league: league.rawName, club: undefined })}
                    >
                      <Text style={[styles.leagueName, isActive && styles.activeText]}>
                        {league.displayName}
                      </Text>
                      <Text style={styles.leagueMeta}>
                        {league.clubCount} club{league.clubCount > 1 ? 's' : ''}
                      </Text>
                    </Pressable>
                  )
                })
              )}
            </ScrollView>

            <View style={styles.selectorHeader}>
              <Text style={styles.label}>Club</Text>
              {filters.club ? (
                <Pressable onPress={() => onChange({ ...filters, club: undefined })}>
                  <Text style={styles.clearText}>Retirer</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.clubList}>
              {filteredClubs.length === 0 ? (
                <Text style={styles.emptyText}>Choisis une autre ligue pour voir les clubs disponibles.</Text>
              ) : (
                filteredClubs.slice(0, 36).map((club) => {
                  const isActive = filters.club === club.name
                  return (
                    <Pressable
                      key={club.id ?? club.name ?? 'club'}
                      style={[styles.clubOption, isActive && styles.clubOptionActive]}
                      onPress={() => onChange({ ...filters, club: club.name ?? undefined })}
                    >
                      <ClubLogo logoUrl={club.logoUrl} name={club.name} />
                      <View style={styles.clubText}>
                        <Text style={[styles.clubName, isActive && styles.activeText]} numberOfLines={1}>
                          {club.name}
                        </Text>
                        <Text style={styles.clubMeta} numberOfLines={1}>
                          {[getLeagueDisplayName(club.league), club.country].filter(Boolean).join(' · ') || 'KickDeal'}
                        </Text>
                      </View>
                      {isActive ? <Ionicons name="checkmark-circle" size={18} color={colors.cyan} /> : null}
                    </Pressable>
                  )
                })
              )}
            </View>

            <Text style={styles.label}>Pays</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              <Pressable
                style={[styles.chip, !filters.country && styles.chipActive]}
                onPress={() => onChange({ ...filters, country: undefined })}
              >
                <Text style={[styles.chipText, !filters.country && styles.chipTextActive]}>Tous</Text>
              </Pressable>
              {countries.map((country) => {
                const isActive = filters.country === country.name
                return (
                  <Pressable
                    key={country.name}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => onChange({ ...filters, country: country.name })}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{country.name}</Text>
                  </Pressable>
                )
              })}
            </ScrollView>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Joueur</Text>
              <TextInput
                value={filters.player ?? ''}
                onChangeText={(player) => onChange({ ...filters, player })}
                placeholder="Rechercher un joueur"
                placeholderTextColor={colors.subtle}
                style={styles.input}
              />
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Pressable style={styles.secondaryButton} onPress={onReset}>
              <Text style={styles.secondaryText}>Réinitialiser</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={onClose}>
              <Text style={styles.primaryText}>Appliquer</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

function ClubLogo({ logoUrl, name }: { logoUrl?: string | null; name?: string | null }) {
  if (logoUrl) {
    return <Image source={{ uri: logoUrl }} style={styles.clubLogo} resizeMode="contain" />
  }

  return (
    <View style={styles.clubLogoFallback}>
      <Text style={styles.clubLogoText}>{getInitials(name)}</Text>
    </View>
  )
}

function EmptyPill({ label }: { label: string }) {
  return (
    <View style={styles.emptyPill}>
      <Text style={styles.emptyPillText}>{label}</Text>
    </View>
  )
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
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.66)',
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#05080d',
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  clearAllButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  clearAllText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  kicker: {
    color: colors.cyan,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  scrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  selectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  clearText: {
    color: colors.cyan,
    fontSize: 13,
    fontWeight: '900',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  horizontalList: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipActive: {
    borderColor: colors.cyan,
    backgroundColor: 'rgba(0,245,212,0.13)',
  },
  chipText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  chipTextActive: {
    color: colors.cyan,
  },
  leaguePill: {
    minWidth: 138,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.cardStrong,
    padding: spacing.md,
    gap: 4,
  },
  leaguePillActive: {
    borderColor: colors.cyan,
    backgroundColor: 'rgba(0,245,212,0.12)',
  },
  leagueName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  leagueMeta: {
    color: colors.subtle,
    fontSize: 12,
    fontWeight: '800',
  },
  activeText: {
    color: colors.cyan,
  },
  clubList: {
    gap: spacing.sm,
  },
  clubOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: spacing.sm,
  },
  clubOptionActive: {
    borderColor: colors.cyan,
    backgroundColor: 'rgba(0,245,212,0.1)',
  },
  clubLogo: {
    width: 34,
    height: 34,
  },
  clubLogoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(155,93,229,0.22)',
  },
  clubLogoText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '900',
  },
  clubText: {
    flex: 1,
  },
  clubName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  clubMeta: {
    color: colors.subtle,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyPill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  emptyPillText: {
    color: colors.subtle,
    fontWeight: '800',
  },
  inputGroup: {
    gap: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    color: colors.text,
    backgroundColor: colors.cardStrong,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: spacing.md,
  },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cyan,
    borderRadius: 16,
    backgroundColor: 'rgba(0,245,212,0.16)',
    paddingVertical: spacing.md,
  },
  secondaryText: {
    color: colors.muted,
    fontWeight: '900',
  },
  primaryText: {
    color: colors.cyan,
    fontWeight: '900',
  },
})
