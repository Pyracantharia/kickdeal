import ChatSection from '@/components/messages/ChatSection'
import React from 'react'

function ConversationPage() {
  return (
    <div className="auth-bg flex h-screen w-full flex-col overflow-hidden pt-20">
      <ChatSection />
    </div>
  )
}

export default ConversationPage