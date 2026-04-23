'use client'

import { useEffect, useState } from 'react'

import { dashboardManager } from '@/features/dashboard/dashboard'

function NegotiationsPage() {
  const [pendingRenewalsCount, setPendingRenewalsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        const response = await dashboardManager.getHome()

        if (!isMounted || !response.ok) {
          return
        }

        setPendingRenewalsCount(response.data.pendingRenewalsCount ?? 0)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="auth-bg min-h-screen w-full pt-36 md:pt-40 pb-12 px-4">
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-white/10 p-6 md:p-8 shadow-2xl">
        <h1 className="text-4xl font-bold text-white">NEGOCIATIONS</h1>
        <p className="mt-3 text-lg text-white/80">
          {isLoading
            ? 'Chargement des renouvellements en attente...'
            : `${pendingRenewalsCount} renouvellement(s) de contrat en attente pour votre club.`}
        </p>
        <p className="mt-6 text-white/70">
          La liste detaillee des renouvellements sera branchee ici dans la prochaine iteration.
        </p>
      </div>
    </div>
  )
}

export default NegotiationsPage