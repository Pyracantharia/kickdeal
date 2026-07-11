'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, LifeBuoy, MessageCircle, Search } from 'lucide-react'

import CircleImage from '@/components/media/CircleImage'
import ChatSection from '@/components/messages/ChatSection'
import { useMessagesUnread } from '@/context/MessagesUnreadProvider'
import { DirectConversation, MessageUser, formatMessageDate, getOtherParticipant, messagesManager } from '@/features/messages/messages'
import { useAuth } from '@/context/AuthProvider'

export default function AdminSupportCenterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedConversationId = searchParams.get('conversation')
  const { user } = useAuth()
  const { unreadConversationIds, markConversationRead, setActiveConversationId, hasUnreadMessages } = useMessagesUnread()
  const [conversations, setConversations] = useState<DirectConversation[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    setActiveConversationId(selectedConversationId)
    return () => setActiveConversationId(null)
  }, [selectedConversationId, setActiveConversationId])

  useEffect(() => {
    if (!selectedConversationId) return

    messagesManager.markConversationRead(selectedConversationId)
      .then((response) => {
        if (response.ok) {
          markConversationRead(selectedConversationId)
        }
      })
      .catch(() => undefined)
  }, [markConversationRead, selectedConversationId])

  useEffect(() => {
    let isMounted = true

    messagesManager.getSupportConversations()
      .then((response) => {
        if (!isMounted) return

        if (!response.ok) {
          setErrorMessage('Impossible de charger les demandes d’assistance.')
          return
        }

        setConversations(sortConversations(response.data.conversations))
        setErrorMessage(null)
      })
      .catch(() => {
        if (isMounted) setErrorMessage('Impossible de charger les demandes d’assistance.')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
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
          const payload = JSON.parse(event.data)
          const conversation = payload.conversation as DirectConversation
          if (conversation.type !== 'support') return
          setConversations((current) => upsertConversation(current, conversation))
        }

        eventSource.addEventListener('message.created', handleEvent as EventListener)
        eventSource.onmessage = handleEvent
      })
      .catch(() => undefined)

    return () => {
      isActive = false
      eventSource?.close()
    }
  }, [user])

  const filteredConversations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('fr')
    if (!user || normalizedSearch === '') return conversations

    return conversations.filter((conversation) => {
      const participant = getSupportUser(conversation, user.id)
      const participantName = participant ? `${participant.firstName} ${participant.lastName}`.toLocaleLowerCase('fr') : ''
      const clubName = participant?.clubName?.toLocaleLowerCase('fr') ?? ''
      const agencyName = participant?.agencyName?.toLocaleLowerCase('fr') ?? ''
      const lastMessage = conversation.lastMessage?.content.toLocaleLowerCase('fr') ?? ''

      return participantName.includes(normalizedSearch) || clubName.includes(normalizedSearch) || agencyName.includes(normalizedSearch) || lastMessage.includes(normalizedSearch)
    })
  }, [conversations, searchTerm, user])

  function selectConversation(conversationId: string) {
    markConversationRead(conversationId)
    setIsSidebarOpen(false)
    router.replace(`/admin/support?conversation=${conversationId}`, { scroll: false })
  }

  return (
    <div className="auth-bg min-h-screen px-4 pb-10 pt-28">
      <main className="mx-auto flex h-[calc(100vh-8rem)] min-h-[680px] w-full max-w-7xl flex-col">
        <Link href="/dashboard" className="mb-5 inline-flex items-center gap-2 text-gray-300 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Retour administration
        </Link>

        <div className="mb-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-brand-cyan">Centre d’aide</p>
          <h1 className="text-3xl font-bold uppercase tracking-wide text-white md:text-4xl">Demandes d’assistance</h1>
          <p className="mt-2 text-sm text-gray-400">Conversations support ouvertes par les clubs et agents.</p>
        </div>

        <div className="relative flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#071722]/85 shadow-2xl shadow-black/25">
          <aside className={`${isSidebarOpen ? 'absolute inset-y-0 left-0 z-20 flex w-full max-w-md' : 'hidden'} min-h-0 border-r border-white/10 bg-[#071722] p-4 lg:relative lg:flex lg:w-96 lg:max-w-none lg:flex-col`}>
            <SupportConversationList
              conversations={filteredConversations}
              selectedConversationId={selectedConversationId}
              unreadConversationIds={unreadConversationIds}
              searchTerm={searchTerm}
              isLoading={isLoading}
              errorMessage={errorMessage}
              currentUserId={user?.id}
              onSearch={setSearchTerm}
              onSelect={selectConversation}
            />
          </aside>

          <section className="min-w-0 flex-1">
            {selectedConversationId ? (
              <ChatSection
                conversationId={selectedConversationId}
                onBack={() => router.replace('/admin/support', { scroll: false })}
                onOpenSidebar={() => setIsSidebarOpen(true)}
                hasUnreadMessages={hasUnreadMessages}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <LifeBuoy className="mb-4 h-14 w-14 text-brand-cyan/70" />
                <h2 className="text-2xl font-bold text-white">Sélectionnez une demande</h2>
                <p className="mt-2 max-w-md text-gray-400">Ouvrez une conversation support pour répondre à un club ou un agent.</p>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="btn-secondary mt-5 text-white lg:hidden"
                >
                  Voir les demandes
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

function SupportConversationList({
  conversations,
  selectedConversationId,
  unreadConversationIds,
  searchTerm,
  isLoading,
  errorMessage,
  currentUserId,
  onSearch,
  onSelect,
}: {
  conversations: DirectConversation[]
  selectedConversationId: string | null
  unreadConversationIds: Set<string>
  searchTerm: string
  isLoading: boolean
  errorMessage: string | null
  currentUserId?: string
  onSearch: (value: string) => void
  onSelect: (conversationId: string) => void
}) {
  return (
    <div className="flex min-h-0 w-full flex-col">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/60" />
        <input
          type="text"
          placeholder="Rechercher une demande..."
          value={searchTerm}
          onChange={(event) => onSearch(event.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-white placeholder-white/40 focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan/50"
        />
      </div>

      <ul className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-lg border border-white/10 bg-white/5">
        {isLoading && <li className="p-6 text-center text-white/60">Chargement des demandes...</li>}
        {!isLoading && errorMessage && <li className="p-6 text-center text-red-300">{errorMessage}</li>}
        {!isLoading && !errorMessage && conversations.length === 0 && (
          <li className="p-8 text-center text-white/60">
            <MessageCircle className="mx-auto mb-3 h-8 w-8 text-white/40" />
            Aucune demande d’assistance.
          </li>
        )}
        {!isLoading && !errorMessage && conversations.map((conversation) => {
          const participant = currentUserId ? getSupportUser(conversation, currentUserId) : conversation.otherParticipant
          const participantName = participant ? `${participant.firstName} ${participant.lastName}`.trim() : 'Utilisateur'
          const label = participant?.clubName ?? participant?.agencyName ?? participant?.email ?? 'Compte KickDeal'
          const isSelected = selectedConversationId === conversation.id
          const hasUnreadMessages = unreadConversationIds.has(conversation.id)

          return (
            <li key={conversation.id} className={`border-b border-white/10 last:border-b-0 ${isSelected ? 'bg-brand-cyan/10' : 'hover:bg-white/10'}`}>
              <button type="button" onClick={() => onSelect(conversation.id)} className="flex w-full items-center gap-4 p-4 text-left">
                <div className="relative shrink-0">
                  {hasUnreadMessages && <span className="absolute -left-1 -top-1 h-3 w-3 rounded-full bg-sky-400 ring-2 ring-[#07111d]" />}
                  <CircleImage
                    src={participant?.clubLogoUrl}
                    alt={label}
                    sizes="40px"
                    imageClassName="object-cover"
                    className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-purple text-sm font-bold text-white"
                    fallback={participantName.charAt(0).toUpperCase()}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className={`truncate font-semibold ${hasUnreadMessages ? 'text-sky-100' : 'text-white'}`}>{participantName || 'Utilisateur'}</p>
                    <span className="shrink-0 text-xs text-white/50">{formatMessageDate(conversation.lastMessage?.createdAt ?? conversation.updatedAt)}</span>
                  </div>
                  <p className="truncate text-xs text-brand-cyan/80">{label}</p>
                  <p className={`truncate text-sm ${hasUnreadMessages ? 'font-medium text-white/80' : 'text-white/60'}`}>
                    {conversation.lastMessage?.content ?? 'Nouvelle demande d’assistance'}
                  </p>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function getSupportUser(conversation: DirectConversation, currentUserId: string): MessageUser | null {
  const nonCurrent = getOtherParticipant(conversation, currentUserId)
  if (nonCurrent && !nonCurrent.roles?.includes('ROLE_ADMIN')) return nonCurrent
  return conversation.participants.find((participant) => participant.id !== currentUserId && !participant.roles?.includes('ROLE_ADMIN')) ?? conversation.otherParticipant
}

function upsertConversation(current: DirectConversation[], conversation: DirectConversation) {
  return sortConversations([conversation, ...current.filter((item) => item.id !== conversation.id)])
}

function sortConversations(items: DirectConversation[]) {
  return [...items].sort(
    (first, second) =>
      new Date(second.updatedAt ?? second.lastMessage?.createdAt ?? 0).getTime() -
      new Date(first.updatedAt ?? first.lastMessage?.createdAt ?? 0).getTime(),
  )
}
