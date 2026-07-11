'use client'

import { HelpCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useAuth } from '@/context/AuthProvider'
import { messagesManager } from '@/features/messages/messages'

export default function SupportHelpButton() {
  const router = useRouter()
  const { user } = useAuth()
  const [isOpening, setIsOpening] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isEligible = user && !user.roles.includes('ROLE_ADMIN') && (
    user.roles.includes('ROLE_CLUB') || user.roles.includes('ROLE_AGENT') || user.roles.includes('ROLE_MANAGER')
  )

  if (!isEligible) return null

  async function openSupport() {
    if (isOpening) return

    setIsOpening(true)
    setErrorMessage(null)

    try {
      const response = await messagesManager.startSupportConversation()

      if (!response.ok) {
        setErrorMessage(readError(response.data))
        return
      }

      router.push(`/messages?conversation=${response.data.conversation.id}`)
    } catch {
      setErrorMessage('Impossible d’ouvrir le centre d’aide.')
    } finally {
      setIsOpening(false)
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {errorMessage && (
        <div className="max-w-xs rounded-xl border border-red-400/30 bg-[#071722]/95 px-4 py-3 text-sm text-red-200 shadow-2xl shadow-black/30">
          {errorMessage}
        </div>
      )}
      <button
        type="button"
        onClick={() => void openSupport()}
        className="group flex h-14 w-14 items-center justify-center rounded-full border border-brand-cyan/45 bg-[#071722]/95 text-brand-cyan shadow-2xl shadow-brand-cyan/20 transition hover:-translate-y-0.5 hover:bg-brand-cyan hover:text-[#071722]"
        aria-label="Ouvrir le chat d’aide"
        title="Aide"
      >
        {isOpening ? <Loader2 className="h-6 w-6 animate-spin" /> : <HelpCircle className="h-7 w-7" />}
      </button>
    </div>
  )
}

function readError(data: unknown) {
  if (data && typeof data === 'object' && 'errorMessage' in data && typeof data.errorMessage === 'string') {
    return data.errorMessage
  }

  return 'Impossible d’ouvrir le centre d’aide.'
}
