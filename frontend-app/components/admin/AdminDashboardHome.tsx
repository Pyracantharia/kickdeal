import React from 'react'
import ClubRequestsList from './ClubRequestsList'
import PlayerAgentRequestsList from './PlayerAgentRequestsList'

function AdminDashboardHome() {
  return (
     <div className="auth-bg min-h-screen w-full pt-28 pb-10 px-4">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-wide text-white">Page d&apos;administration</h1>
          <div className="h-1 w-32 bg-linear-to-r from-brand-cyan to-brand-purple rounded-full"></div>
        </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-10">
            {/* club requests */}
            <section className="relative overflow-hidden rounded-2xl border border-brand-cyan/25 bg-[#071722]/80 p-5 shadow-2xl shadow-brand-cyan/10 md:p-7">
              <h2 className="text-2xl font-bold text-white mb-2">Demandes de création de club</h2>
              <p className="text-gray-400 mb-6">Gérez les demandes de création de club soumises par les utilisateurs.</p>
              <ClubRequestsList select="PENDING" />
            </section>

            <section className="relative overflow-hidden rounded-2xl border border-brand-purple/25 bg-[#071722]/80 p-5 shadow-2xl shadow-brand-purple/10 md:p-7">
              <h2 className="text-2xl font-bold text-white mb-2">Demandes de joueurs agents</h2>
              <p className="text-gray-400 mb-6">
                Validez les nouvelles représentations et les passations avant décision de l’agent actuel.
              </p>
              <PlayerAgentRequestsList />
            </section>
          </div>
      </div>
     </div>
  )
}

export default AdminDashboardHome
