'use client';
import { MessageCircle, Plus, Search } from 'lucide-react'
import Link from 'next/link';
import React from 'react'
import CreateDiscussionModal from './CreateDiscussionModal';
import { useAuth } from '@/context/AuthProvider';
import {
  DirectConversation,
  MessageEventPayload,
  formatMessageDate,
  getOtherParticipant,
  messagesManager,
} from '@/features/messages/messages';

interface ConversationsTableProps {
  selectedConversationId?: string | null
  unreadConversationIds?: Set<string>
  onSelectConversation?: (conversationId: string) => void
  onConversationCreated?: (conversation: DirectConversation) => void
  onIncomingMessage?: (payload: MessageEventPayload) => void
}

function upsertConversation(currentConversations: DirectConversation[], conversation: DirectConversation) {
  const withoutConversation = currentConversations.filter((item) => item.id !== conversation.id)

  return sortConversations([conversation, ...withoutConversation])
}

function sortConversations(items: DirectConversation[]) {
  return [...items].sort(
    (first, second) =>
      new Date(second.updatedAt ?? second.lastMessage?.createdAt ?? 0).getTime() -
      new Date(first.updatedAt ?? first.lastMessage?.createdAt ?? 0).getTime()
  )
}

function ConversationsTable({
  selectedConversationId = null,
  unreadConversationIds = new Set(),
  onSelectConversation,
  onConversationCreated,
  onIncomingMessage,
}: ConversationsTableProps) {
  const { user } = useAuth()
  const [conversations, setConversations] = React.useState<DirectConversation[]>([])
  const [searchTerm, setSearchTerm] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    let isMounted = true

    messagesManager.getConversations()
      .then((response) => {
        if (!isMounted) return

        if (response.ok) {
          setConversations(sortConversations(response.data.conversations))
          setErrorMessage(null)
          return
        }

        setErrorMessage('Impossible de charger les conversations.')
      })
      .catch(() => {
        if (isMounted) setErrorMessage('Impossible de charger les conversations.')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  React.useEffect(() => {
    if (!user) return

    let eventSource: EventSource | null = null
    let isActive = true

    messagesManager.prepareMercureSubscription()
      .then((response) => {
        if (!isActive || !response.ok || !response.data.hubUrl || !response.data.topic) return

        const url = new URL(response.data.hubUrl)
        url.searchParams.append('topic', response.data.topic)
        eventSource = new EventSource(url.toString(), { withCredentials: true })

        const handleEvent = (event: MessageEvent<string>) => {
          const payload = JSON.parse(event.data) as MessageEventPayload
          setConversations((current) => upsertConversation(current, payload.conversation))
          onIncomingMessage?.(payload)
        }

        eventSource.addEventListener('message.created', handleEvent as EventListener)
        eventSource.onmessage = handleEvent
      })
      .catch(() => undefined)

    return () => {
      isActive = false
      eventSource?.close()
    }
  }, [onIncomingMessage, user])

  const filteredConversations = React.useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase('fr')

    if (!user || normalizedSearchTerm === '') return conversations

    return conversations.filter((conversation) => {
      const otherParticipant = getOtherParticipant(conversation, user.id)
      const participantName = otherParticipant
        ? `${otherParticipant.firstName} ${otherParticipant.lastName}`.toLocaleLowerCase('fr')
        : ''
      const lastMessage = conversation.lastMessage?.content.toLocaleLowerCase('fr') ?? ''

      return participantName.includes(normalizedSearchTerm) || lastMessage.includes(normalizedSearchTerm)
    })
  }, [conversations, searchTerm, user])

  function handleConversationCreated(conversation: DirectConversation) {
    setConversations((current) => upsertConversation(current, conversation))
    onConversationCreated?.(conversation)
    setIsModalOpen(false)
  }

  const [isModalOpen, setIsModalOpen] = React.useState(false)

  function onCloseModal() {
    setIsModalOpen(false)
  }
  return (
    <>
      <CreateDiscussionModal isOpen={isModalOpen} onClose={onCloseModal} onConversationCreated={handleConversationCreated} />
      <div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/60" />
          <input
            type="text"
            placeholder="Rechercher une discussion..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 pl-12 pr-4 py-3 text-white placeholder-white/40 focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan/50"
          />
        </div>

        <div className="mt-4 flex items-center justify-end">
          <button
            className="flex min-h-10 items-center gap-2 rounded-lg bg-linear-to-r from-brand-purple to-brand-cyan px-3 py-2 text-sm font-medium text-white transition-colors duration-100 hover:bg-brand-purple/90 sm:px-4"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="font-semibold">Nouvelle discussion</span>
          </button>
        </div>

        <div className="mt-6">
          <ul className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
            {isLoading && (
              <li className="p-6 text-center text-white/60">Chargement des conversations...</li>
            )}

            {!isLoading && errorMessage && (
              <li className="p-6 text-center text-red-300">{errorMessage}</li>
            )}

            {!isLoading && !errorMessage && filteredConversations.length === 0 && (
              <li className="p-8 text-center text-white/60">
                <MessageCircle className="mx-auto mb-3 h-8 w-8 text-white/40" />
                Aucune conversation pour le moment.
              </li>
            )}

            {!isLoading && !errorMessage && user && filteredConversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation, user.id)
              const participantName = otherParticipant
                ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
                : 'Discussion'

              const isSelected = selectedConversationId === conversation.id
              const hasUnreadMessages = unreadConversationIds.has(conversation.id)
              const content = (
                <>
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-purple text-sm font-bold text-white">
                      {hasUnreadMessages && (
                        <span className="absolute -left-1 -top-1 h-3 w-3 rounded-full bg-sky-400 ring-2 ring-[#07111d]" />
                      )}
                      {participantName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <div className="min-w-0">
                        <p className={`truncate text-base font-semibold sm:text-lg ${hasUnreadMessages ? 'text-sky-100' : 'text-white'}`}>
                          {participantName}
                        </p>
                        <p className={`truncate text-sm ${hasUnreadMessages ? 'font-medium text-white/80' : 'text-white/60'}`}>
                          {conversation.lastMessage?.content ?? 'Nouvelle discussion'}
                        </p>
                      </div>
                      <span className="ml-3 shrink-0 text-xs text-white/60 sm:text-sm">{formatMessageDate(conversation.lastMessage?.createdAt ?? conversation.updatedAt)}</span>
                    </div>
                </>
              )

              return (
                <li
                  key={conversation.id}
                  className={`border-b border-white/10 last:border-b-0 transition-all duration-100 ${
                    isSelected ? 'bg-brand-cyan/10' : 'hover:bg-white/10'
                  }`}
                >
                  {onSelectConversation ? (
                    <button
                      type="button"
                      onClick={() => onSelectConversation(conversation.id)}
                      className="flex w-full items-center gap-4 p-4 text-left"
                      aria-current={isSelected ? 'page' : undefined}
                    >
                      {content}
                    </button>
                  ) : (
                    <Link href={`/messages/conversation/${conversation.id}`} className="flex items-center gap-4 p-4">
                      {content}
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </>
  )
}

export default ConversationsTable
