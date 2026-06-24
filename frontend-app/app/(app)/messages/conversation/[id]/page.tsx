import ChatSection from '@/components/messages/ChatSection'
import React from 'react'

async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <div className="auth-bg flex h-screen w-full flex-col overflow-hidden pt-20">
      <ChatSection conversationId={id} />
    </div>
  )
}

export default ConversationPage
