'use client';
import { ArrowLeft, SendHorizonal } from 'lucide-react'
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

function ChatSection({ conversationId }: { conversationId: string }) {
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
      <div className="border-y border-white/10 py-4 px-4 bg-black/30 flex items-center gap-4 w-full">
        <Link href="/messages">
          <ArrowLeft className="text-white"/>
        </Link>
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-white md:text-4xl">{participantName}</h1>
          <span className="text-white/60">Messagerie</span>
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
                <div className={`${isMine ? 'bg-brand-cyan/20 text-white self-end' : 'bg-white/10 text-white'} rounded-lg p-4 max-w-md`}>
                  <div className="flex items-start gap-3">
                    <div className="bg-brand-purple text-white rounded-full w-8 h-8 flex items-center justify-center">
                      {senderName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold">{senderName}</p>
                      <p className="text-white">{message.content}</p>
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
          <div className="flex items-center gap-4 w-full max-w-5xl mx-auto">
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
              className="text-white flex items-center gap-3 bg-brand-purple px-4 py-3 rounded-lg hover:bg-brand-purple/90 transition-colors duration-150 disabled:cursor-wait disabled:opacity-60"
              onClick={handleSendMessage}
              disabled={isSending}
            >
              <span>Envoyer</span>
              <SendHorizonal />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatSection
