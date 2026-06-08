'use client';
import { Search } from 'lucide-react'
import Link from 'next/link';
import React from 'react'

const mockConversations = [
  {
    id: 1,
    name: 'John Doe',
    lastMessage: 'Hey, how are you?',
    timestamp: '2h ago',
    newMessages: 3
  },
  {
    id: 2,
    name: 'Jane Smith',
    lastMessage: 'Can we reschedule our meeting?',
    timestamp: '5h ago',
    newMessages: 0
  },
  {
    id: 3,
    name: 'Bob Johnson',
    lastMessage: 'I sent you the files.',
    timestamp: '1d ago',
    newMessages: 3
  },
]

function ConversationsTable() {
  const [filteredConversations, setFilteredConversations] = React.useState(mockConversations)
  const [searchTerm, setSearchTerm] = React.useState('')

  React.useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredConversations(mockConversations)
    } else {
      const lowercasedTerm = searchTerm.toLowerCase()
      setFilteredConversations(
        mockConversations.filter((conversation) =>
          conversation.name.toLowerCase().includes(lowercasedTerm) ||
          conversation.lastMessage.toLowerCase().includes(lowercasedTerm)
        )
      )
    }
  }, [searchTerm])

  return (
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

      <div className="mt-6">
        <ul className="border border-white/10 bg-white/5 rounded-lg">
          {filteredConversations.map((conversation) => (
            <li key={conversation.id} className="border-b border-white/10 p-4 hover:bg-white/10 cursor-pointer last:border-b-0 transition-all duration-100">
              <Link href={`/messages/conversation/${conversation.id}`} className="flex items-center gap-4 flex-1">
                <div className="relative min-w-6">
                  {conversation.newMessages > 0 && (
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-purple text-xs font-bold text-white">
                      {conversation.newMessages}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between flex-1">
                  <div>
                    <p className="text-lg font-semibold text-white">{conversation.name}</p>
                    <p className="text-sm text-white/60">{conversation.lastMessage}</p>
                  </div>
                  <span className="text-sm text-white/60">{conversation.timestamp}</span>
                </div>
              
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default ConversationsTable