import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-bg min-h-screen px-4 py-12">
      <div className="relative z-10 flex justify-center">
        {children}
      </div>
    </div>
  )
}
