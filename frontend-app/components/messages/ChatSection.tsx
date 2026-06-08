'use client';
import { ArrowLeft, SendHorizonal } from 'lucide-react'
import Link from 'next/link';
import React from 'react'

const mockMessages = [
  {
    id: 1,
    sender: 'John Doe',
    content: 'Hey, how are you?',
    timestamp: '2h ago',
  },
  {
    id: 2,
    sender: 'You',
    content: 'I am good, thanks! How about you?',
    timestamp: '1h ago',
  },
  {
    id: 3,
    sender: 'John Doe',
    content: 'Doing well, just wanted to check in.',
    timestamp: '30m ago',
  },
  {
    id: 4,
    sender: 'You',
    content: 'I am good, thanks! How about you?',
    timestamp: '1h ago',
  },
  {
    id: 5,
    sender: 'John Doe',
    content: 'Doing well, just wanted to check in.',
    timestamp: '30m ago',
  },
  {
    id: 6,
    sender: 'You',
    content: 'I am good, thanks! How about you?',
    timestamp: '1h ago',
  },
  {
    id: 7,
    sender: 'John Doe',
    content: 'Doing well, just wanted to check in.',
    timestamp: '30m ago',
  },
  {
    id: 8,
    sender: 'You',
    content: 'I am good, thanks! How about you?',
    timestamp: '1h ago',
  },
  {
    id: 9,
    sender: 'John Doe',
    content: 'Doing well, just wanted to check in.',
    timestamp: '30m ago',
  },
]

function ChatSection() {
  const [masterMessagesList, setMasterMessagesList] = React.useState(mockMessages)
  const [newMessageContent, setNewMessageContent] = React.useState('');
  const messagesContainerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const container = messagesContainerRef.current

    if (!container) return

    container.scrollTop = container.scrollHeight
  }, [masterMessagesList])

  function handleSendMessage(){
    if (newMessageContent.trim() === '') return;

    const newMessage = {
      id: masterMessagesList.length + 1,
      sender: 'You',
      content: newMessageContent,
      timestamp: 'Just now',
    }

    setMasterMessagesList([...masterMessagesList, newMessage])
    setNewMessageContent('')
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col items-stretch">
      {/* Conversation header */}
      <div className="border-y border-white/10 py-4 px-4 bg-black/30 flex items-center gap-4 w-full">
        <Link href="/messages">
          <ArrowLeft className="text-white"/>
        </Link>
        <div className="flex items-center gap-4">
          <h1 className="text-4xl font-bold text-white">John Doe</h1>
          <span className="text-white/60">En ligne</span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {/* Actual messages container */}
        <div ref={messagesContainerRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4 bg-black/20">
          {masterMessagesList.map((message) => {
            const isMine = message.sender === 'You'
            return (
              <div key={message.id} className={`flex flex-col gap-2 mb-4 ${isMine ? 'items-end' : 'items-start'}`}>
                <div className={`${isMine ? 'bg-brand-cyan/20 text-white self-end' : 'bg-white/10 text-white'} rounded-lg p-4 max-w-md`}>
                  <div className="flex items-start gap-3">
                    <div className="bg-brand-purple text-white rounded-full w-8 h-8 flex items-center justify-center">
                      {message.sender.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold">{message.sender}</p>
                      <p className="text-white">{message.content}</p>
                    </div>
                  </div>
                  <span className="text-white/60 text-sm">{message.timestamp}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Message input */}
        <div className="bg-black/30 py-4 px-4 border-y border-white/10 w-full">
          <div className="flex items-center gap-4 w-full max-w-5xl mx-auto">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Écrire un message..."
                className="inline-block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan/50"
                value={newMessageContent}
                onChange={(e) => setNewMessageContent(e.target.value)}
              />
            </div>

            <button 
              className="text-white flex items-center gap-3 bg-brand-purple px-4 py-3 rounded-lg hover:bg-brand-purple/90 transition-colors duration-150"
              onClick={handleSendMessage}
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