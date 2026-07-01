'use client';
import { ArrowLeft, PanelLeftOpen, SendHorizonal } from 'lucide-react'
import CircleImage from '@/components/media/CircleImage';
import { useAuth } from '@/context/AuthProvider';
import {
  DirectConversation,
  DirectMessage,
  MessageEventPayload,
  formatMessageDate,
  getOtherParticipant,
  messagesManager,
} from '@/features/messages/messages';
import Link from 'next/link';
import React from 'react'

interface ChatSectionProps {
  conversationId: string
  onBack?: () => void
  onOpenSidebar?: () => void
  hasUnreadMessages?: boolean
}

function ChatSection({ conversationId, onBack, onOpenSidebar, hasUnreadMessages = false }: ChatSectionProps) {
  const { user } = useAuth()
  const [conversation, setConversation] = React.useState<DirectConversation | null>(null)
  const [masterMessagesList, setMasterMessagesList] = React.useState<DirectMessage[]>([])
  const [newMessageContent, setNewMessageContent] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSending, setIsSending] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const messagesContainerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    let isMounted = true

    messagesManager.getConversation(conversationId)
      .then((response) => {
        if (!isMounted) return

        if (response.ok) {
          setConversation(response.data.conversation)
          setMasterMessagesList(response.data.messages)
          setErrorMessage(null)
          return
        }

        setErrorMessage('Impossible de charger la conversation.')
      })
      .catch(() => {
        if (isMounted) setErrorMessage('Impossible de charger la conversation.')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [conversationId])

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

          if (payload.message.conversationId !== conversationId) return

          setConversation(payload.conversation)
          setMasterMessagesList((current) => {
            if (current.some((message) => message.id === payload.message.id)) return current

            return [...current, payload.message]
          })
        }

        eventSource.addEventListener('message.created', handleEvent as EventListener)
        eventSource.onmessage = handleEvent
      })
      .catch(() => undefined)

    return () => {
      isActive = false
      eventSource?.close()
    }
  }, [conversationId, user])

  React.useEffect(() => {
    const container = messagesContainerRef.current

    if (!container) return

    container.scrollTop = container.scrollHeight
  }, [masterMessagesList])

  async function handleSendMessage(){
    if (newMessageContent.trim() === '') return;

    setIsSending(true)
    setErrorMessage(null)

    try {
      const response = await messagesManager.sendMessage(conversationId, newMessageContent)

      if (!response.ok) {
        setErrorMessage('Impossible d’envoyer le message.')
        return
      }

      setConversation(response.data.conversation)
      setMasterMessagesList((current) => {
        if (current.some((message) => message.id === response.data.message.id)) return current

        return [...current, response.data.message]
      })
      setNewMessageContent('')
    } catch {
      setErrorMessage('Impossible d’envoyer le message.')
    } finally {
      setIsSending(false)
    }
  }

  const otherParticipant = conversation && user ? getOtherParticipant(conversation, user.id) : null
  const participantName = otherParticipant ? `${otherParticipant.firstName} ${otherParticipant.lastName}` : 'Discussion'

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col items-stretch">
      <div className="flex w-full items-center gap-3 border-y border-white/10 bg-black/30 px-3 py-3 sm:px-4 sm:py-4">
        {onOpenSidebar && (
          <button
            type="button"
            onClick={onOpenSidebar}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10"
            aria-label="Ouvrir la liste des conversations"
          >
            {hasUnreadMessages && (
              <span className="absolute -left-1 -top-1 h-3 w-3 rounded-full bg-sky-400 ring-2 ring-[#07111d]" />
            )}
            <PanelLeftOpen className="h-5 w-5" />
          </button>
        )}
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10 lg:hidden"
            aria-label="Retour aux conversations"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <Link
            href="/messages"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10"
            aria-label="Retour aux conversations"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        )}
        <CircleImage
          src={otherParticipant?.clubLogoUrl}
          alt={otherParticipant?.clubName ? `Logo ${otherParticipant.clubName}` : participantName}
          sizes="44px"
          imageClassName="object-cover"
          className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-purple text-base font-bold text-white"
          fallback={participantName.charAt(0).toUpperCase()}
        />
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-xl font-bold text-white sm:text-2xl md:text-3xl">{participantName}</h1>
            {otherParticipant?.agencyName && (
              <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/70 ring-1 ring-white/15 sm:text-sm">
                {otherParticipant.agencyName}
              </span>
            )}
          </div>
          <span className="truncate text-sm text-white/60">{otherParticipant?.clubName ?? 'Messagerie'}</span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div ref={messagesContainerRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4 bg-black/20">
          {isLoading && <p className="py-10 text-center text-white/60">Chargement des messages...</p>}
          {!isLoading && errorMessage && masterMessagesList.length === 0 && (
            <p className="py-10 text-center text-red-300">{errorMessage}</p>
          )}
          {!isLoading && !errorMessage && masterMessagesList.length === 0 && (
            <p className="py-10 text-center text-white/60">Aucun message pour le moment.</p>
          )}
          {masterMessagesList.map((message) => {
            const isMine = message.sender?.id === user?.id
            const senderName = isMine
              ? 'Vous'
              : message.sender
                ? `${message.sender.firstName} ${message.sender.lastName}`
                : participantName

            return (
              <div key={message.id} className={`flex flex-col gap-2 mb-4 ${isMine ? 'items-end' : 'items-start'}`}>
                <div className={`${isMine ? 'bg-brand-cyan/20 text-white self-end' : 'bg-white/10 text-white'} max-w-[min(34rem,85vw)] rounded-lg p-3 sm:p-4`}>
                  <div className="flex items-start gap-3">
                    <CircleImage
                      src={message.sender?.clubLogoUrl}
                      alt={message.sender?.clubName ? `Logo ${message.sender.clubName}` : senderName}
                      sizes="32px"
                      imageClassName="object-cover"
                      className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-purple text-xs font-bold text-white"
                      fallback={senderName.charAt(0).toUpperCase()}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-white font-semibold">{senderName}</p>
                      <p className="break-words text-white">{message.content}</p>
                    </div>
                  </div>
                  <span className="text-white/60 text-sm">{formatMessageDate(message.createdAt)}</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-black/30 py-4 px-4 border-y border-white/10 w-full">
          {errorMessage && masterMessagesList.length > 0 && (
            <p className="mx-auto mb-3 max-w-5xl rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
              {errorMessage}
            </p>
          )}
          <div className="mx-auto flex w-full max-w-5xl items-center gap-3 sm:gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Écrire un message..."
                className="inline-block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan/50"
                value={newMessageContent}
                onChange={(e) => setNewMessageContent(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleSendMessage()
                  }
                }}
              />
            </div>

            <button 
              className="flex h-12 shrink-0 items-center gap-2 rounded-lg bg-brand-purple px-3 text-white transition-colors duration-150 hover:bg-brand-purple/90 disabled:cursor-wait disabled:opacity-60 sm:px-4"
              onClick={handleSendMessage}
              disabled={isSending}
              aria-label="Envoyer le message"
            >
              <span className="hidden font-semibold sm:inline">Envoyer</span>
              <SendHorizonal className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatSection
