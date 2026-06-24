import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { colors, spacing } from '../constants/theme'
import type { FeedFilter, PublicFeedPostType } from '../types/feed'

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
  onChange: (filters: FeedFilter) => void
  onClose: () => void
  onReset: () => void
}

export function FeedFiltersModal({ visible, filters, onChange, onClose, onReset }: FeedFiltersModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Filtres du feed</Text>
            <Pressable style={styles.iconButton} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

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

          <FilterInput label="Championnat" value={filters.league} onChangeText={(league) => onChange({ ...filters, league })} />
          <FilterInput label="Pays" value={filters.country} onChangeText={(country) => onChange({ ...filters, country })} />
          <FilterInput label="Club" value={filters.club} onChangeText={(club) => onChange({ ...filters, club })} />
          <FilterInput label="Joueur" value={filters.player} onChangeText={(player) => onChange({ ...filters, player })} />

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

type FilterInputProps = {
  label: string
  value?: string
  onChangeText: (value: string) => void
}

function FilterInput({ label, value, onChangeText }: FilterInputProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value ?? ''}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor={colors.subtle}
        style={styles.input}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
    borderColor: colors.borderStrong,
    backgroundColor: 'rgba(0,245,212,0.12)',
  },
  chipText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  chipTextActive: {
    color: colors.cyan,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    color: colors.text,
    backgroundColor: colors.cardStrong,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
    borderRadius: 14,
    paddingVertical: spacing.md,
  },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
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
