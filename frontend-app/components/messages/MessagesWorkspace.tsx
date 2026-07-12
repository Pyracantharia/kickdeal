'use client'

import { MessageCircle, PanelLeftOpen, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import React from 'react'
import ChatSection from './ChatSection'
import ConversationsTable from './ConversationsTable'
import { useMessagesUnread } from '@/context/MessagesUnreadProvider'
import { useNotifications } from '@/context/NotificationsProvider'
import { messagesManager, type DirectConversation } from '@/features/messages/messages'

function MessagesWorkspace() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedConversationId = searchParams.get('conversation')
  const [isSidebarVisible, setIsSidebarVisible] = React.useState(true)
  const [isLargeScreen, setIsLargeScreen] = React.useState(false)
  const { hasUnreadMessages, markConversationRead, setActiveConversationId, unreadConversationIds } = useMessagesUnread()
  const { refreshSummary } = useNotifications()

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)')
    const updateScreenSize = () => setIsLargeScreen(mediaQuery.matches)

    updateScreenSize()
    mediaQuery.addEventListener('change', updateScreenSize)

    return () => mediaQuery.removeEventListener('change', updateScreenSize)
  }, [])

  React.useEffect(() => {
    setActiveConversationId(selectedConversationId)

    return () => setActiveConversationId(null)
  }, [selectedConversationId, setActiveConversationId])

  React.useEffect(() => {
    if (!selectedConversationId) return

    let isActive = true

    messagesManager.markConversationRead(selectedConversationId)
      .then(async (response) => {
        if (!isActive || !response.ok) return

        markConversationRead(selectedConversationId)
        await refreshSummary()
      })
      .catch(() => undefined)

    return () => {
      isActive = false
    }
  }, [markConversationRead, refreshSummary, selectedConversationId])

  function selectConversation(conversationId: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('conversation', conversationId)
    markConversationRead(conversationId)
    router.replace(`/messages?${params.toString()}`, { scroll: false })
    if (!isLargeScreen) setIsSidebarVisible(false)
  }

  function handleConversationCreated(conversation: DirectConversation) {
    selectConversation(conversation.id)
  }

  return (
    <div className="auth-bg flex h-screen w-full overflow-hidden pt-20">
      {isSidebarVisible && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setIsSidebarVisible(false)}
          aria-label="Fermer la liste des conversations"
        />
      )}

      <aside
        className={`fixed bottom-0 left-0 top-20 z-40 flex w-[min(24rem,calc(100vw-1.5rem))] flex-col border-r border-white/10 bg-[#07111d]/95 shadow-2xl transition-transform duration-200 lg:static lg:z-auto lg:w-96 lg:shrink-0 lg:shadow-none ${
          isSidebarVisible ? 'translate-x-0' : '-translate-x-full lg:hidden'
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-white">Messages</h1>
            <p className="text-sm text-white/60">Conversations</p>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarVisible(false)}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10"
            aria-label="Fermer la liste des conversations"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <ConversationsTable
            selectedConversationId={selectedConversationId}
            unreadConversationIds={unreadConversationIds}
            onSelectConversation={selectConversation}
            onConversationCreated={handleConversationCreated}
          />
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        {selectedConversationId ? (
          <ChatSection
            conversationId={selectedConversationId}
            onBack={() => setIsSidebarVisible(true)}
            onOpenSidebar={isSidebarVisible ? undefined : () => setIsSidebarVisible(true)}
            hasUnreadMessages={hasUnreadMessages}
          />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center gap-3 border-y border-white/10 bg-black/30 px-3 py-3 sm:px-4 sm:py-4">
              {!isSidebarVisible && (
                <button
                  type="button"
                  onClick={() => setIsSidebarVisible(true)}
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10"
                  aria-label="Ouvrir la liste des conversations"
                >
                  {hasUnreadMessages && (
                    <span className="absolute -left-1 -top-1 h-3 w-3 rounded-full bg-sky-400 ring-2 ring-[#07111d]" />
                  )}
                  <PanelLeftOpen className="h-5 w-5" />
                </button>
              )}
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-white sm:text-2xl md:text-3xl">Messagerie</h1>
                <p className="text-sm text-white/60">Sélectionnez une conversation</p>
              </div>
            </div>
            <div className="flex flex-1 items-center justify-center px-4">
              <div className="max-w-sm text-center">
                <MessageCircle className="mx-auto mb-4 h-12 w-12 text-white/40" />
                <p className="text-lg font-semibold text-white">Aucune conversation ouverte</p>
                <p className="mt-2 text-sm text-white/60">
                  Choisissez une discussion dans la liste pour afficher le chat ici.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default MessagesWorkspace
