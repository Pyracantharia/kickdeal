'use client'

import React, { useEffect, useState } from 'react'
import { Users, Send, ReceiptText } from 'lucide-react'

import Button from '@/components/ui/Button'
import CircleImage from '@/components/media/CircleImage'
import PlayerActionModal from './modals/PlayerActionModal'
import OfferDetailsModal from './modals/OfferDetailsModal'
import {
  MOCK_SENT_OFFERS,
  MOCK_RECEIVED_OFFERS,
} from '@/features/market/mockTransfers'
import type { Player } from '@/features/market/types/player'
import type { SentOffer, ReceivedOffer, TransferListPlayer } from '@/features/market/types/transfer'
import { transfersManager } from '@/features/market/transfers'

type TabType = 'liste' | 'envoyees' | 'recues'

function TransferHome() {
  const [activeTab, setActiveTab] = useState<TabType>('liste')
  const [transferList, setTransferList] = useState<TransferListPlayer[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [selectedOffer, setSelectedOffer] = useState<SentOffer | ReceivedOffer | null>(null)
  const [offerModalType, setOfferModalType] = useState<'sent' | 'received'>('sent')
  const [isLoadingList, setIsLoadingList] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadTransferList() {
      try {
        const response = await transfersManager.getMyList()

        if (!isMounted) {
          return
        }

        if (response.ok) {
          setTransferList((response.data.listings ?? []).filter((item) => item.player))
          setListError(null)
        } else {
          setListError("Impossible de charger la liste de transferts.")
        }
      } catch {
        if (isMounted) {
          setListError("Impossible de charger la liste de transferts.")
        }
      } finally {
        if (isMounted) {
          setIsLoadingList(false)
        }
      }
    }

    loadTransferList()

    return () => {
      isMounted = false
    }
  }, [])

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player)
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
          ✓ Acceptée
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
            Offres émises ({MOCK_SENT_OFFERS.length})
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
            Offres reçues ({MOCK_RECEIVED_OFFERS.length})
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
                className="rounded-2xl border-2 border-white/20 bg-gradient-to-r from-brand-cyan/10 to-transparent p-6 hover:border-brand-cyan/50 transition-all cursor-pointer"
                onClick={() => handlePlayerSelect(item.player)}
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
                          {item.player.position} • {item.player.age} ans • {item.player.nationality}
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
              {MOCK_SENT_OFFERS.length} offre(s) émise(s)
            </p>
            {MOCK_SENT_OFFERS.map((offer) => (
              <div
                key={offer.id}
                className="rounded-2xl border-2 border-white/20 bg-gradient-to-r from-brand-purple/10 to-transparent p-6 hover:border-brand-purple/50 transition-all"
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
                          {offer.player.position} • {offer.player.age} ans • {offer.toClub}
                        </p>
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
              {MOCK_RECEIVED_OFFERS.length} offre(s) reçue(s)
            </p>
            {MOCK_RECEIVED_OFFERS.map((offer) => (
              <div
                key={offer.id}
                className="rounded-2xl border-2 border-white/20 bg-gradient-to-r from-brand-cyan/10 to-transparent p-6 hover:border-brand-cyan/50 transition-all"
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
                          {offer.player.position} • {offer.player.age} ans • {offer.fromClub}
                        </p>
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
                      onClick={() => {
                        console.log('Accepter offre:', offer)
                        setSelectedOffer(null)
                      }}
                      className="flex-1 min-w-[110px]"
                    >
                      Accepter
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        console.log('Négocier offre:', offer)
                        setSelectedOffer(null)
                      }}
                      variant="secondary"
                      className="flex-1 min-w-[110px]"
                    >
                      Négocier
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        console.log('Rejeter offre:', offer)
                        setSelectedOffer(null)
                      }}
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

      {selectedPlayer && (
        <PlayerActionModal
          isOpen={!!selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          player={selectedPlayer}
          onApproachPurchase={() => {
            console.log('Approacher pour achat:', selectedPlayer)
            setSelectedPlayer(null)
          }}
          onApproachLoan={() => {
            console.log('Approacher pour prêt:', selectedPlayer)
            setSelectedPlayer(null)
          }}
        />
      )}

      {selectedOffer && (
        <OfferDetailsModal
          isOpen={!!selectedOffer}
          onClose={() => setSelectedOffer(null)}
          offer={selectedOffer}
          type={offerModalType}
          onSubmitNewOffer={() => {
            console.log('Soumettre une nouvelle offre pour:', selectedOffer)
            setSelectedOffer(null)
          }}
          onAccept={() => {
            console.log('Accepter offre:', selectedOffer)
            setSelectedOffer(null)
          }}
          onNegotiate={() => {
            console.log('Négocier offre:', selectedOffer)
            setSelectedOffer(null)
          }}
          onReject={() => {
            console.log('Rejeter offre:', selectedOffer)
            setSelectedOffer(null)
          }}
        />
      )}
    </div>
  )
}

function PlayerAvatar({ player }: { player: Player }) {
  if (player.photoUrl) {
    return <CircleImage
      src={player.photoUrl}
      alt={`${player.firstName} ${player.lastName}`}
      className="relative h-14 w-14 overflow-hidden rounded-full border border-white/20 shrink-0"
      sizes="56px"
      fallback={
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center text-white font-bold text-lg shrink-0">
          {player.firstName.charAt(0)}{player.lastName.charAt(0)}
        </div>
      }
    />
  }

  return (
    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center text-white font-bold text-lg shrink-0">
      {player.firstName.charAt(0)}{player.lastName.charAt(0)}
    </div>
  )
}

function ClubLogo({ player }: { player: Player }) {
  if (player.clubLogoUrl) {
    return <CircleImage
      src={player.clubLogoUrl}
      alt={player.club}
      className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-white/20 shrink-0"
      sizes="64px"
      imageClassName="object-contain p-1.5"
      fallback={
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-purple/20 to-brand-cyan/20 flex items-center justify-center text-white text-3xl border-2 border-white/20 shrink-0">
          {player.club.charAt(0).toUpperCase()}
        </div>
      }
    />
  }

  return (
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-purple/20 to-brand-cyan/20 flex items-center justify-center text-white text-3xl border-2 border-white/20 shrink-0">
      {player.club.charAt(0).toUpperCase()}
    </div>
  )
}

export default TransferHome