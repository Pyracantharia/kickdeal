'use client'

import React from 'react'
import { Circle } from 'lucide-react'

import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import {
  getVisibleItems,
  MOCK_AGENT_CHAT_FEED,
  MOCK_INBOX_FEED,
  type AgentChatItem,
  type InboxItem,
  type NotificationFeed,
} from '@/features/notifications/mockNotifications'

const MAX_VISIBLE_ITEMS = 4

function NotificationsHub() {
  // TODO: replace mocks with notificationsManager.getInboxFeed() and getAgentChatFeed()
  const inboxFeed = MOCK_INBOX_FEED
  const agentChatFeed = MOCK_AGENT_CHAT_FEED

  return (
    <div className="auth-bg min-h-screen w-full pt-36 md:pt-40 pb-12 px-4">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <FeedColumn
            color="purple"
            title="Boîte de réception"
            subtitle={`${inboxFeed.unreadCount} e-mail(s) non lu(s)`}
            feed={inboxFeed}
            toLabel="Accéder à la boîte de réception"
            getItemKey={(item) => item.id}
            renderRow={(item) => (
              <FeedRow
                isUnread={item.isUnread}
                title={item.senderName}
                dateLabel={item.dateLabel}
                body={item.subject}
              />
            )}
          />

          <FeedColumn
            color="cyan"
            title="Chat avec agent"
            subtitle={`${agentChatFeed.unreadCount} message(s) non lu(s)`}
            feed={agentChatFeed}
            toLabel="Accéder à la messagerie"
            getItemKey={(item) => item.id}
            renderRow={(item) => (
              <FeedRow
                isUnread={item.isUnread}
                title={item.agentName}
                dateLabel={item.dateLabel}
                body={item.lastMessage}
              />
            )}
          />
        </div>
      </div>
    </div>
  )
}

function FeedColumn<T>({
  color,
  title,
  subtitle,
  feed,
  toLabel,
  getItemKey,
  renderRow,
}: {
  color: 'purple' | 'cyan'
  title: string
  subtitle: string
  feed: NotificationFeed<T>
  toLabel: string
  getItemKey: (item: T) => string
  renderRow: (item: T) => React.ReactNode
}) {
  const visibleItems = getVisibleItems(feed.items, MAX_VISIBLE_ITEMS)
  const isEmpty = visibleItems.length === 0

  return (
    <div className="flex flex-col items-center">
      <Card
        color={color}
        baseGradient={false}
        className={`w-full max-w-[460px] h-[460px] text-white px-6 py-6 bg-linear-to-b ${
          color === 'purple'
            ? 'from-brand-purple/35 from-0% to-transparent to-90%'
            : 'from-brand-cyan/35 from-0% to-transparent to-90%'
        }`}
      >
        <div className="h-full flex flex-col">
          <header className="text-center">
            <h2 className="text-3xl font-bold text-white">{title}</h2>
            <p className={`mt-1 text-lg font-semibold ${color === 'purple' ? 'text-brand-purple' : 'text-brand-cyan'}`}>
              {subtitle}
            </p>
          </header>

          <div className="mt-6 flex-1 overflow-hidden">
            {isEmpty ? (
              <div className="h-full rounded-xl border border-white/15 flex items-center justify-center px-6 text-center">
                <p className="text-white/85 text-base">
                  Aucun élément pour le moment.
                </p>
              </div>
            ) : (
              <ul className="h-full divide-y divide-white/20 border-y border-white/20">
                {visibleItems.map((item) => (
                  <li key={getItemKey(item)} className="py-4">
                    {renderRow(item)}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="mt-4 text-sm text-white/80 text-center">
            Total : {feed.totalCount} élément(s)
          </p>
        </div>
      </Card>

      <Button className="mt-6 min-w-[280px]" type="button">
        {toLabel}
      </Button>
    </div>
  )
}

function FeedRow({
  isUnread,
  title,
  dateLabel,
  body,
}: {
  isUnread: boolean
  title: string
  dateLabel: string
  body: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Circle className={`mt-1 h-2.5 w-2.5 ${isUnread ? 'fill-yellow-300 text-yellow-300' : 'fill-white/30 text-white/30'} shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-white text-lg font-semibold truncate">{title}</p>
          <span className="text-white/70 text-sm shrink-0">{dateLabel}</span>
        </div>
        <p className="mt-1 text-white/90 text-base truncate">{body}</p>
      </div>
    </div>
  )
}

export default NotificationsHub