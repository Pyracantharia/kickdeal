import { redirect } from 'next/navigation'

async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  redirect(`/messages?conversation=${id}`)
}

export default ConversationPage
