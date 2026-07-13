import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  adminManager,
  type ClubRequest,
  type MessageReport,
  type PlayerAgentRequest,
} from '@/features/admin/admin'
import { type DirectConversation, getOtherParticipant, messagesManager } from '@/features/messages/messages'
import { isSupportSwitching, SUPPORT_SWITCH_EVENT } from '@/features/support/supportSwitch'

export type AdminNotificationKind = 'club_requests' | 'player_agent_requests' | 'message_reports' | 'support_messages'
export type AdminNotificationFilter = 'all' | 'unread' | AdminNotificationKind

export type AdminNotificationItem = {
  id: string
  kind: AdminNotificationKind
  sourceId?: string
  title: string
  body: string
  createdAt?: string | null
  href: string
}

export const ADMIN_NOTIFICATION_CHANGED_EVENT = 'admin-notifications:changed'

const STORAGE_KEY = 'kickdeal.adminNotifications.readIds'

export async function loadAdminNotificationItems(limit = 50): Promise<AdminNotificationItem[]> {
  const [clubResponse, agentResponse, reportResponse, supportResponse] = await Promise.all([
    adminManager.getClubPendingRequests(limit),
    adminManager.getPendingPlayerAgentRequests(limit),
    adminManager.getMessageReports('pending'),
    messagesManager.getSupportConversations(),
  ])

  if (!clubResponse.ok || !agentResponse.ok || !reportResponse.ok || !supportResponse.ok) {
    throw new Error('Unable to load admin notifications')
  }

  return buildAdminNotificationItems(
    clubResponse.data.pendingRequests,
    agentResponse.data.pendingRequests,
    reportResponse.data.reports.slice(0, limit),
    supportResponse.data.conversations.slice(0, limit),
  )
}

export function buildAdminNotificationItems(
  clubRequests: ClubRequest[],
  agentRequests: PlayerAgentRequest[],
  reports: MessageReport[],
  supportConversations: DirectConversation[] = [],
): AdminNotificationItem[] {
  return [
    ...clubRequests.map((request) => ({
      id: adminNotificationId('club_requests', request.id),
      kind: 'club_requests' as const,
      title: `Nouvelle demande de gestion club : ${request.team.name}`,
      body: `${formatClubRequester(request.requester)} souhaite gérer ce club sur KickDeal.`,
      createdAt: request.createdAt,
      href: `/admin/club-requests/${request.id}`,
    })),
    ...agentRequests.map((request) => ({
      id: adminNotificationId('player_agent_requests', request.id),
      kind: 'player_agent_requests' as const,
      title: request.type === 'agent_handover' ? 'Demande de passation agent' : 'Demande de représentation joueur',
      body: `${request.requestingAgent?.name ?? 'Un agent'} demande à intervenir sur ${request.player.firstName} ${request.player.lastName}.`,
      createdAt: request.createdAt,
      href: `/admin/player-agent-requests/${request.id}`,
    })),
    ...reports.map((report) => ({
      id: adminNotificationId('message_reports', report.id),
      kind: 'message_reports' as const,
      sourceId: report.id,
      title: 'Nouveau signalement de message',
      body: report.reason ? `Motif : ${report.reason}` : `Message signalé par ${formatReportUser(report.reporter)}.`,
      createdAt: report.createdAt,
      href: '/admin/message-reports',
    })),
    ...supportConversations
      .filter((conversation) => conversation.lastMessage)
      .map((conversation) => {
        const requester = supportRequester(conversation)
        const requesterName = requester ? `${requester.firstName} ${requester.lastName}`.trim() || requester.email : 'Un utilisateur'

        return {
          id: adminNotificationId('support_messages', conversation.id),
          kind: 'support_messages' as const,
          sourceId: conversation.id,
          title: `Nouveau message d’assistance de ${requesterName}`,
          body: conversation.lastMessage?.content ?? 'Une demande d’assistance attend une réponse.',
          createdAt: conversation.lastMessage?.createdAt ?? conversation.updatedAt,
          href: `/admin/support?conversation=${conversation.id}`,
        }
      }),
  ].sort((left, right) => new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime())
}

export function getReadAdminNotificationIds(): Set<string> {
  if (typeof window === 'undefined') {
    return new Set()
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')
    return new Set(Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [])
  } catch {
    return new Set()
  }
}

export function markAdminNotificationRead(id: string) {
  const readIds = getReadAdminNotificationIds()
  readIds.add(id)
  saveReadIds(readIds)
}

export function markAdminNotificationsRead(ids: string[]) {
  const readIds = getReadAdminNotificationIds()
  ids.forEach((id) => readIds.add(id))
  saveReadIds(readIds)
}

export function useAdminNotificationsSummary(enabled = true) {
  const [items, setItems] = useState<AdminNotificationItem[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(() => getReadAdminNotificationIds())
  const [refreshTick, setRefreshTick] = useState(0)

  const refresh = useCallback(async () => {
    if (!enabled || isSupportSwitching()) {
      setItems([])
      return
    }

    const nextItems = await loadAdminNotificationItems(80)
    setItems(nextItems)
    setReadIds(getReadAdminNotificationIds())
  }, [enabled])

  useEffect(() => {
    if (!enabled) return

    void refresh().catch(() => undefined)

    const handleChange = () => setReadIds(getReadAdminNotificationIds())
    const handleRefreshRequest = () => setRefreshTick((current) => current + 1)
    const handleSupportSwitch = () => {
      setItems([])
      setRefreshTick((current) => current + 1)
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isSupportSwitching()) {
        void refresh().catch(() => undefined)
      }
    }
    const intervalId = window.setInterval(() => {
      if (isSupportSwitching()) return
      void refresh().catch(() => undefined)
    }, 10_000)

    window.addEventListener('storage', handleChange)
    window.addEventListener(ADMIN_NOTIFICATION_CHANGED_EVENT, handleChange)
    window.addEventListener(ADMIN_NOTIFICATION_CHANGED_EVENT, handleRefreshRequest)
    window.addEventListener(SUPPORT_SWITCH_EVENT, handleSupportSwitch)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('storage', handleChange)
      window.removeEventListener(ADMIN_NOTIFICATION_CHANGED_EVENT, handleChange)
      window.removeEventListener(ADMIN_NOTIFICATION_CHANGED_EVENT, handleRefreshRequest)
      window.removeEventListener(SUPPORT_SWITCH_EVENT, handleSupportSwitch)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
    }
  }, [enabled, refresh])

  useEffect(() => {
    if (!enabled || refreshTick === 0) return
    void refresh().catch(() => undefined)
  }, [enabled, refresh, refreshTick])

  return useMemo(() => {
    const unreadItems = items.filter((item) => !readIds.has(item.id))
    const unreadCounts = unreadItems.reduce<Record<string, number>>((acc, item) => {
      acc[item.kind] = (acc[item.kind] ?? 0) + 1
      acc.all = (acc.all ?? 0) + 1
      return acc
    }, {})

    return {
      items,
      unreadCount: unreadItems.length,
      unreadCounts,
      refresh,
    }
  }, [items, readIds, refresh])
}

function saveReadIds(readIds: Set<string>) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(readIds)))
  window.dispatchEvent(new Event(ADMIN_NOTIFICATION_CHANGED_EVENT))
}

function adminNotificationId(kind: AdminNotificationKind, id: string) {
  return `${kind}:${id}`
}

function formatClubRequester(user: ClubRequest['requester']) {
  return `${user.firstName} ${user.lastName}`.trim() || user.email
}

function formatReportUser(user: MessageReport['reporter']) {
  if (!user) return 'un utilisateur'
  return `${user.firstName} ${user.lastName}`.trim() || user.email
}

function supportRequester(conversation: DirectConversation) {
  const adminParticipant = conversation.participants.find((participant) => participant.roles?.includes('ROLE_ADMIN'))

  if (adminParticipant) {
    return getOtherParticipant(conversation, adminParticipant.id)
  }

  return conversation.otherParticipant ?? conversation.participants.find((participant) => !participant.roles?.includes('ROLE_ADMIN')) ?? null
}
