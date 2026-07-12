'use client'

import { useState } from 'react'
import type React from 'react'
import { MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

import Button from '@/components/ui/Button'
import { messagesManager } from '@/features/messages/messages'

export interface MessageRecipient {
  id: string
  name?: string | null
  label?: string | null
}

interface StartConversationButtonProps {
  recipient?: MessageRecipient | null
  className?: string
  variant?: 'primary' | 'secondary' | 'ghost'
  children?: React.ReactNode
  onError?: (message: string) => void
}

function StartConversationButton({
  recipient,
  className,
  variant = 'secondary',
  children,
  onError,
}: StartConversationButtonProps) {
  const router = useRouter()
  const [isStarting, setIsStarting] = useState(false)

  if (!recipient?.id) {
    return null
  }

  const label = recipient.label || recipient.name || 'la personne concernée'

  async function startConversation() {
    if (!recipient?.id) return

    setIsStarting(true)
    onError?.('')

    try {
      const response = await messagesManager.startConversation(recipient.id)
      if (!response.ok) {
        onError?.('Impossible d’ouvrir la conversation.')
        return
      }

      router.push(`/messages?conversation=${response.data.conversation.id}`)
    } catch {
      onError?.('Impossible d’ouvrir la conversation.')
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={() => void startConversation()}
      isLoading={isStarting}
      icon={<MessageCircle className="h-4 w-4" />}
    >
      {children ?? `Envoyer un message à ${label}`}
    </Button>
  )
}

export default StartConversationButton
