import AppHeader from '@/components/AppHeader'
import AppAccessGuard from '@/components/auth/AppAccessGuard'
import AuthProvider from '@/context/AuthProvider'
import { MessagesUnreadProvider } from '@/context/MessagesUnreadProvider'
import { NotificationsProvider } from '@/context/NotificationsProvider'
import { loadCurrentUser, loadNotificationsSummary } from '@/features/server/appInitialData'
import type { ReactNode } from 'react'

async function loadInitialAppData() {
  const [user, notificationsSummary] = await Promise.all([
    loadCurrentUser(),
    loadNotificationsSummary(),
  ])

  return {
    user,
    notificationsSummary,
  }
}

function serializeForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const initialData = await loadInitialAppData()

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__INITIAL_AUTH_USER__ = ${serializeForScript(initialData.user)};\nwindow.__INITIAL_NOTIFICATIONS_SUMMARY__ = ${serializeForScript(initialData.notificationsSummary)};`,
        }}
      />
      <AuthProvider>
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
      </AuthProvider>
    </>
  )
}
