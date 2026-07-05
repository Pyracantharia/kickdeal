import httpClient from '../api'

export interface MessageUser {
  id: string
  firstName: string
  lastName: string
  email: string
  clubName: string | null
  clubLogoUrl: string | null
  agencyName: string | null
}

export interface DirectMessage {
  id: string
  conversationId: string
  content: string
  sender: MessageUser | null
  createdAt: string | null
}

export interface DirectConversation {
  id: string
  participants: MessageUser[]
  otherParticipant: MessageUser | null
  lastMessage: DirectMessage | null
  updatedAt: string | null
}

export interface MessageEventPayload {
  conversation: DirectConversation
  message: DirectMessage
}

interface ConversationsResponse {
  conversations: DirectConversation[]
}

interface StartConversationResponse {
  conversation: DirectConversation
}

interface ConversationResponse {
  conversation: DirectConversation
  messages: DirectMessage[]
}

interface MercureTokenResponse {
  hubUrl: string
  topic: string
}

class MessagesManager {
  async getConversations() {
    return httpClient.get<ConversationsResponse>('/messages/conversations')
  }

  async startConversation(recipientId: string) {
    return httpClient.post<StartConversationResponse>('/messages/conversations', { recipientId })
  }

  async getConversation(conversationId: string) {
    return httpClient.get<ConversationResponse>(`/messages/conversations/${conversationId}`)
  }

  async markConversationRead(conversationId: string) {
    return httpClient.post<{ summary: unknown }>(`/messages/conversations/${conversationId}/read`, {})
  }

  async sendMessage(conversationId: string, content: string) {
    return httpClient.post<MessageEventPayload>(`/messages/conversations/${conversationId}/messages`, { content })
  }

  async prepareMercureSubscription() {
    return httpClient.get<MercureTokenResponse>('/messages/mercure-token')
  }
}

export const messagesManager = new MessagesManager()

export function getOtherParticipant(conversation: DirectConversation, currentUserId: string): MessageUser | null {
  return conversation.participants.find((participant) => participant.id !== currentUserId) ?? conversation.otherParticipant
}

export function formatMessageDate(value: string | null): string {
  if (!value) return ''

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
