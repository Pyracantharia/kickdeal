import MessagesWorkspace from '@/components/messages/MessagesWorkspace'
import React from 'react'

function MessagesPage() {
  return (
    <React.Suspense fallback={<div className="auth-bg h-screen w-full pt-20" />}>
      <MessagesWorkspace />
    </React.Suspense>
  )
}

export default MessagesPage
