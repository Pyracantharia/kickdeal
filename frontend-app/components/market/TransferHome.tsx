'use client'

import React, { useEffect, useState } from 'react'
import { ReceiptText, Send, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'

import Button from '@/components/ui/Button'
import OfferDetailsModal from './modals/OfferDetailsModal'
import { ClubLogo, EmptyState, ErrorMessage, OfferDirection, PlayerAvatar } from './TransferHomeParts'
import type {
  SentOffer,
  ReceivedOffer,
  TransferListPlayer,
} from '@/features/market/types/transfer'
import { transfersManager } from '@/features/market/transfers'
import { getPositionDisplayName } from '@/features/players/position'

type TabType = 'liste' | 'envoyees' | 'recues'

function TransferHome() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('liste')
  const [transferList, setTransferList] = useState<TransferListPlayer[]>([])
  const [selectedOffer, setSelectedOffer] = useState<SentOffer | ReceivedOffer | null>(null)
  const [offerModalType, setOfferModalType] = useState<'sent' | 'received'>('sent')
  const [sentOffers, setSentOffers] = useState<SentOffer[]>([])
  const [receivedOffers, setReceivedOffers] = useState<ReceivedOffer[]>([])
  const [isLoadingList, setIsLoadingList] = useState(true)
  const [isLoadingOffers, setIsLoadingOffers] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [offersError, setOffersError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadTransferData() {
      try {
        const [listResponse, offersResponse] = await Promise.all([
          transfersManager.getMyList(),
          transfersManager.getMyOffers(),
        ])

        if (!isMounted) {
          return
        }

        if (listResponse.ok) {
          setTransferList((listResponse.data.listings ?? []).filter((item) => item.player))
          setListError(null)
        } else {
          setListError("Impossible de charger la liste de transferts.")
        }

        if (offersResponse.ok) {
          setSentOffers((offersResponse.data.sentOffers ?? []).filter((item) => item.player))
          setReceivedOffers((offersResponse.data.receivedOffers ?? []).filter((item) => item.player))
          setOffersError(null)
        } else {
          setOffersError("Impossible de charger les offres.")
        }
      } catch {
        if (isMounted) {
          setListError("Impossible de charger la liste de transferts.")
          setOffersError("Impossible de charger les offres.")
        }
      } finally {
        if (isMounted) {
          setIsLoadingList(false)
          setIsLoadingOffers(false)
        }
      }
    }

    loadTransferData()

    return () => {
      isMounted = false
    }
  }, [])

  const refreshOffers = async () => {
    const response = await transfersManager.getMyOffers()

    if (response.ok) {
      setSentOffers((response.data.sentOffers ?? []).filter((item) => item.player))
      setReceivedOffers((response.data.receivedOffers ?? []).filter((item) => item.player))
    }
  }

  const updateOfferStatus = async (offer: SentOffer | ReceivedOffer, action: 'accept' | 'reject') => {
    const response = action === 'accept'
      ? await transfersManager.acceptOffer(offer.id)
      : await transfersManager.rejectOffer(offer.id)

    if (!response.ok) {
      setOffersError("Impossible de mettre à jour l'offre.")
      return
    }

    setSelectedOffer(null)
    await refreshOffers()
  }

  const handleOfferSelect = (
    offer: SentOffer | ReceivedOffer,
    type: 'sent' | 'received'
  ) => {
    setSelectedOffer(offer)
    setOfferModalType(type)
  }

  const getStatusBadge = (status: string) => {
    if (status === 'accepted') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 text-xs font-semibold">
          Accord trouvé
        </span>
      )
    }
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 text-xs font-semibold">
          ⏱ En attente
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/50 text-xs font-semibold">
        ✗ Rejetée
      </span>
    )
  }

  return (
    <div className="auth-bg min-h-screen w-full pt-36 md:pt-40 pb-12 px-4">
      <div className="mx-auto w-full max-w-6xl">
        <h1 className="text-4xl font-bold text-white mb-8">ACCUEIL TRANSFERTS</h1>

        <div className="flex gap-4 mb-8 flex-wrap">
          <button
            onClick={() => setActiveTab('liste')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'liste'
                ? 'border-2 border-brand-cyan bg-brand-cyan/20 text-white'
                : 'border-2 border-white/20 bg-white/5 text-white/80 hover:border-brand-cyan/50 hover:bg-white/10'
            }`}
          >
            <Users className="h-5 w-5" />
            Liste ({transferList.length})
          </button>

          <button
            onClick={() => setActiveTab('envoyees')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'envoyees'
                ? 'border-2 border-brand-purple bg-brand-purple/20 text-white'
                : 'border-2 border-white/20 bg-white/5 text-white/80 hover:border-brand-purple/50 hover:bg-white/10'
            }`}
          >
            <Send className="h-5 w-5" />
            Offres émises ({sentOffers.length})
          </button>

          <button
            onClick={() => setActiveTab('recues')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'recues'
                ? 'border-2 border-brand-cyan bg-brand-cyan/20 text-white'
                : 'border-2 border-white/20 bg-white/5 text-white/80 hover:border-brand-cyan/50 hover:bg-white/10'
            }`}
          >
            <ReceiptText className="h-5 w-5" />
            Offres reçues ({receivedOffers.length})
          </button>
        </div>

        {activeTab === 'liste' && (
          <div className="space-y-4">
            <p className="text-white/60 text-sm">
              {isLoadingList ? 'Chargement de la liste...' : `${transferList.length} joueur(s) sur la liste`}
            </p>

            {listError && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {listError}
              </div>
            )}

            {!isLoadingList && !listError && transferList.length === 0 && (
              <div className="rounded-2xl border-2 border-white/20 bg-white/5 p-6 text-white/70">
                Aucun joueur n&apos;est encore sur votre liste de transferts.
              </div>
            )}

            {transferList.map((item) => (
              <div
                key={item.id ?? item.player.id}
                className="rounded-2xl border-2 border-white/25 bg-[#071722]/85 bg-gradient-to-r from-brand-cyan/20 to-[#071722]/85 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)] hover:border-brand-cyan/60 transition-all cursor-pointer"
                onClick={() => item.listingId && router.push(`/market/transfers/negotiate?listingId=${item.listingId}`)}
              >
                <div className="flex items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <PlayerAvatar player={item.player} />
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {item.player.firstName.toUpperCase()}
                        </h3>
                        <p className="text-white/70 text-sm">
                          {getPositionDisplayName(item.player.position)} • {item.player.age} ans • {item.player.nationality}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      {item.askingPrice && (
                        <p className="text-white/70 text-sm">Prix demande: {item.askingPrice}</p>
                      )}
                      <p className="text-white font-bold text-lg">{item.player.club}</p>
                      <p className="text-brand-cyan text-sm">{item.player.league}</p>
                    </div>
                    <ClubLogo player={item.player} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'envoyees' && (
          <div className="space-y-4">
            <p className="text-white/60 text-sm">
              {isLoadingOffers ? 'Chargement des offres...' : `${sentOffers.length} offre(s) émise(s)`}
            </p>
            {offersError && <ErrorMessage message={offersError} />}
            {!isLoadingOffers && !offersError && sentOffers.length === 0 && <EmptyState message="Aucune offre émise pour le moment." />}
            {sentOffers.map((offer) => (
              <div
                key={offer.id}
                className="rounded-2xl border-2 border-white/25 bg-[#071722]/85 bg-gradient-to-r from-brand-purple/20 to-[#071722]/85 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)] hover:border-brand-purple/60 transition-all"
              >
                <div className="flex items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <PlayerAvatar player={offer.player} />
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {offer.player.firstName.toUpperCase()}{' '}
                          {offer.player.lastName.toUpperCase()}
                        </h3>
                        <p className="text-white/70 text-sm">
                          {getPositionDisplayName(offer.player.position)} • {offer.player.age} ans
                        </p>
                        <OfferDirection offer={offer} />
                        <p className="text-brand-cyan font-semibold mt-1">{offer.amount}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right space-y-3">
                    <div>{getStatusBadge(offer.status)}</div>
                    <Button
                      type="button"
                      onClick={() => handleOfferSelect(offer, 'sent')}
                      variant="secondary"
                      className="min-w-max"
                    >
                      Voir les détails
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'recues' && (
          <div className="space-y-4">
            <p className="text-white/60 text-sm">
              {isLoadingOffers ? 'Chargement des offres...' : `${receivedOffers.length} offre(s) reçue(s)`}
            </p>
            {offersError && <ErrorMessage message={offersError} />}
            {!isLoadingOffers && !offersError && receivedOffers.length === 0 && <EmptyState message="Aucune offre reçue pour le moment." />}
            {receivedOffers.map((offer) => (
              <div
                key={offer.id}
                className="rounded-2xl border-2 border-white/25 bg-[#071722]/85 bg-gradient-to-r from-brand-cyan/20 to-[#071722]/85 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)] hover:border-brand-cyan/60 transition-all"
              >
                <div className="flex items-center justify-between gap-6 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <PlayerAvatar player={offer.player} />
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {offer.player.firstName.toUpperCase()}{' '}
                          {offer.player.lastName.toUpperCase()}
                        </h3>
                        <p className="text-white/70 text-sm">
                          {getPositionDisplayName(offer.player.position)} • {offer.player.age} ans
                        </p>
                        <OfferDirection offer={offer} />
                        <p className="text-brand-cyan font-semibold mt-1">{offer.amount}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right space-y-3">
                    <div>{getStatusBadge(offer.status)}</div>
                    {offer.status !== 'pending' && (
                      <Button
                        type="button"
                        onClick={() => handleOfferSelect(offer, 'received')}
                        variant="secondary"
                        className="min-w-max"
                      >
                        Voir les détails
                      </Button>
                    )}
                  </div>
                </div>

                {offer.status === 'pending' && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={() => updateOfferStatus(offer, 'accept')}
                      className="flex-1 min-w-[110px]"
                    >
                      Accepter
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        router.push(`/market/transfers/negotiate?offerId=${offer.id}`)
                      }}
                      variant="secondary"
                      className="flex-1 min-w-[110px]"
                    >
                      Négocier
                    </Button>
                    <Button
                      type="button"
                      onClick={() => updateOfferStatus(offer, 'reject')}
                      className="flex-1 min-w-[110px] bg-red-500/20 border border-red-500/50 hover:bg-red-500/30 text-red-400"
                    >
                      Rejeter
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleOfferSelect(offer, 'received')}
                      variant="secondary"
                      className="w-full"
                    >
                      Voir les détails
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedOffer && (
        <OfferDetailsModal
          isOpen={!!selectedOffer}
          onClose={() => setSelectedOffer(null)}
          offer={selectedOffer}
          type={offerModalType}
          onSubmitNewOffer={() => {
            setSelectedOffer(null)
            router.push(`/market/transfers/negotiate?offerId=${selectedOffer.id}`)
          }}
          onAccept={() => updateOfferStatus(selectedOffer, 'accept')}
          onNegotiate={() => {
            setSelectedOffer(null)
            router.push(`/market/transfers/negotiate?offerId=${selectedOffer.id}`)
          }}
          onReject={() => updateOfferStatus(selectedOffer, 'reject')}
        />
      )}
    </div>
  )
}

export default TransferHome
