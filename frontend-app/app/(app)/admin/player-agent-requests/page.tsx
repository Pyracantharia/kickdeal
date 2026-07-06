import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import PlayerAgentRequestsList from '@/components/admin/PlayerAgentRequestsList'

function AdminPlayerAgentRequestsPage() {
  return (
    <div className="auth-bg min-h-screen w-full px-4 pb-10 pt-28">
      <div className="mx-auto w-full max-w-6xl">
        <Link href="/admin" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-300 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Retour admin
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold uppercase tracking-wide text-white md:text-4xl">Demandes de joueurs agents</h1>
          <div className="mt-2 h-1 w-32 rounded-full bg-linear-to-r from-brand-cyan to-brand-purple"></div>
        </div>

        <section className="relative overflow-hidden rounded-2xl border border-brand-purple/25 bg-[#071722]/85 p-5 shadow-2xl shadow-brand-purple/10 md:p-7">
          <PlayerAgentRequestsList />
        </section>
      </div>
    </div>
  )
}

export default AdminPlayerAgentRequestsPage
