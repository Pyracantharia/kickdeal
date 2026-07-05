import AppHeader from '@/components/AppHeader'
import AppAccessGuard from '@/components/auth/AppAccessGuard'
import { MessagesUnreadProvider } from '@/context/MessagesUnreadProvider'
import { NotificationsProvider } from '@/context/NotificationsProvider'
import type { ReactNode } from 'react'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppAccessGuard>
      <MessagesUnreadProvider>
        <NotificationsProvider>
          <div className="min-h-screen flex flex-col">
            <div className="absolute top-0 left-0 right-0 z-40">
              <AppHeader />
            </div>
            <main className="flex-1 w-full">
              {children}
            </main>
          </div>
        </NotificationsProvider>
      </MessagesUnreadProvider>
    </AppAccessGuard>
  )
}
