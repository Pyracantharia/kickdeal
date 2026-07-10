'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { BadgeEuro, CalendarClock, CheckCircle2, Clock3, Mail, ReceiptText, Search, Send, Users } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import ActionConfirmationModal from '@/components/ui/ActionConfirmationModal'
import StartConversationButton from '@/components/messages/StartConversationButton'
import { CountryFlag } from '@/components/media/CountryFlag'
import { MARKET_REALTIME_EVENT, type MarketRealtimePayload } from '@/context/MarketRealtimeProvider'
import { useNotifications } from '@/context/NotificationsProvider'
import OfferDetailsModal from './modals/OfferDetailsModal'
import { ClubLogo, EmptyState, ErrorMessage, OfferDirection, PlayerAvatar } from './TransferHomeParts'
import type {
  SentOffer,
  ReceivedOffer,
  TransferListPlayer,
} from '@/features/market/types/transfer'
import { transfersManager } from '@/features/market/transfers'
import { getPositionDisplayName } from '@/features/players/position'
import { formatNumberInput, parseFormattedNumber } from '@/features/format/number'

type TabType = 'liste' | 'envoyees' | 'recues'

function TransferHome() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshSummary } = useNotifications()
  const focusedOfferId = searchParams.get('offerId')
  const offerRefs = React.useRef<Record<string, HTMLDivElement | null>>({})
  const [activeTab, setActiveTab] = useState<TabType>('liste')
  const [highlightedOfferId, setHighlightedOfferId] = useState<string | null>(null)
  const [transferList, setTransferList] = useState<TransferListPlayer[]>([])
  const [selectedOffer, setSelectedOffer] = useState<SentOffer | ReceivedOffer | null>(null)
  const [offerModalType, setOfferModalType] = useState<'sent' | 'received'>('sent')
  const [sentOffers, setSentOffers] = useState<SentOffer[]>([])
  const [receivedOffers, setReceivedOffers] = useState<ReceivedOffer[]>([])
  const [isLoadingList, setIsLoadingList] = useState(true)
  const [isLoadingOffers, setIsLoadingOffers] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [offersError, setOffersError] = useState<string | null>(null)
  const [agentEmails, setAgentEmails] = useState<Record<string, string>>({})
  const [sellerClubEmails, setSellerClubEmails] = useState<Record<string, string>>({})
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [pendingActionId, setPendingActionId] = useState<string | null>(null)
  const [externalAgreementOffer, setExternalAgreementOffer] = useState<SentOffer | ReceivedOffer | null>(null)
  const [pendingOfferDecision, setPendingOfferDecision] = useState<{
    offer: SentOffer | ReceivedOffer
    action: 'accept' | 'reject'
  } | null>(null)

  const refreshOffers = useCallback(async () => {
    const response = await transfersManager.getMyOffers()

    if (response.ok) {
      setSentOffers((response.data.sentOffers ?? []).filter((item) => item.player))
      setReceivedOffers((response.data.receivedOffers ?? []).filter((item) => item.player))
      setOffersError(null)
    }
  }, [])

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

  useEffect(() => {
    const handleMarketUpdate = (event: Event) => {
      const detail = (event as CustomEvent<MarketRealtimePayload>).detail
      if (detail.payload?.domain !== 'transfer') return

      void refreshOffers()
      void refreshSummary()
    }

    window.addEventListener(MARKET_REALTIME_EVENT, handleMarketUpdate)

    return () => {
      window.removeEventListener(MARKET_REALTIME_EVENT, handleMarketUpdate)
    }
  }, [refreshOffers, refreshSummary])

  useEffect(() => {
    if (!focusedOfferId || isLoadingOffers) {
      return
    }

    const isReceivedOffer = receivedOffers.some((offer) => offer.id === focusedOfferId)
    const isSentOffer = sentOffers.some((offer) => offer.id === focusedOfferId)

    if (!isReceivedOffer && !isSentOffer) {
      return
    }

    setActiveTab(isReceivedOffer ? 'recues' : 'envoyees')
    setHighlightedOfferId(focusedOfferId)

    const scrollTimeout = window.setTimeout(() => {
      offerRefs.current[focusedOfferId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 120)

    const highlightTimeout = window.setTimeout(() => {
      setHighlightedOfferId((current) => current === focusedOfferId ? null : current)
    }, 3500)

    return () => {
      window.clearTimeout(scrollTimeout)
      window.clearTimeout(highlightTimeout)
    }
  }, [focusedOfferId, isLoadingOffers, receivedOffers, sentOffers])

  const updateOfferStatus = async (offer: SentOffer | ReceivedOffer, action: 'accept' | 'reject') => {
    setPendingActionId(`${action}-${offer.id}`)
    const response = action === 'accept'
      ? await transfersManager.acceptOffer(offer.id)
      : await transfersManager.rejectOffer(offer.id)
    setPendingActionId(null)

    if (!response.ok) {
      setOffersError(readError(response.data, "Impossible de mettre à jour l'offre."))
      return
    }

    setSelectedOffer(null)
    setPendingOfferDecision(null)
    if (action === 'accept' && response.data.contractNegociationId) {
      setActionMessage("Accord entre clubs trouvé. Le transfert n’est pas encore finalisé : il reste l’accord contractuel avec l’agent du joueur.")
    }
    await refreshOffers()
    await refreshSummary()
  }

  const inviteAgent = async (offer: SentOffer | ReceivedOffer) => {
    if (!offer.negociationId) return

    const email = (agentEmails[offer.id] ?? '').trim()
    if (!email) {
      setOffersError("Renseignez l'adresse email de l'agent.")
      return
    }

    setPendingActionId(`invite-${offer.id}`)
    setOffersError(null)
    setActionMessage(null)

    const response = await transfersManager.inviteAgent(offer.negociationId, email)
    setPendingActionId(null)

    if (!response.ok) {
      setOffersError(readError(response.data, "Impossible d'envoyer l'invitation."))
      return
    }

    setActionMessage("Invitation envoyée. L'agent pourra rejoindre KickDeal et reprendre la négociation contractuelle.")
  }

  const inviteSellerClub = async (offer: SentOffer | ReceivedOffer) => {
    if (!offer.negociationId) return

    const email = (sellerClubEmails[offer.id] ?? '').trim()
    if (!email) {
      setOffersError("Renseignez l'adresse email d'un représentant du club vendeur.")
      return
    }

    setPendingActionId(`seller-club-invite-${offer.id}`)
    setOffersError(null)
    setActionMessage(null)

    const response = await transfersManager.inviteSellerClub(offer.negociationId, email)
    setPendingActionId(null)

    if (!response.ok) {
      setOffersError(readError(response.data, "Impossible d'envoyer l'invitation au club vendeur."))
      return
    }

    setActionMessage("Invitation envoyée. Le club vendeur pourra rejoindre KickDeal et répondre à votre offre après validation.")
    await refreshOffers()
    await refreshSummary()
  }

  const markSellerClubExternalContact = async (offer: SentOffer | ReceivedOffer) => {
    if (!offer.negociationId) return

    setPendingActionId(`seller-club-external-${offer.id}`)
    setOffersError(null)
    setActionMessage(null)

    const response = await transfersManager.markSellerClubExternalContact(offer.negociationId)
    setPendingActionId(null)

    if (!response.ok) {
      setOffersError(readError(response.data, "Impossible de déclarer le contact externe."))
      return
    }

    setActionMessage("Contact externe déclaré. L'offre reste traçable et pourra être reprise si le club vendeur rejoint KickDeal.")
    await refreshOffers()
    await refreshSummary()
  }

  const handleExternalAgreementRequest = (offer: SentOffer | ReceivedOffer) => {
    if (offer.contractResolution?.viewerRole === 'buyer') {
      setExternalAgreementOffer(offer)
      return
    }

    confirmExternalAgreement(offer)
  }

  const confirmExternalAgreement = async (
    offer: SentOffer | ReceivedOffer,
    contractTerms?: { weeklySalary: number; durationMonths: number },
  ) => {
    if (!offer.negociationId) return

    setPendingActionId(`external-${offer.id}`)
    setOffersError(null)
    setActionMessage(null)

    const response = await transfersManager.confirmExternalContractAgreement(
      offer.negociationId,
      contractTerms ?? {},
    )
    setPendingActionId(null)

    if (!response.ok) {
      setOffersError(readError(response.data, "Impossible de valider l'accord externe."))
      return
    }

    setExternalAgreementOffer(null)
    setActionMessage("Validation enregistrée. Le transfert sera finalisé dès que l'autre club aura confirmé.")
    await refreshOffers()
    await refreshSummary()
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
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-4xl font-bold text-white">ACCUEIL TRANSFERTS</h1>
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => router.push('/market/search')}
            icon={<Search className="h-4 w-4" />}
          >
            Rechercher un joueur
          </Button>
        </div>

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
                        <p className="flex flex-wrap items-center gap-1.5 text-sm text-white/70">
                          <span>{getPositionDisplayName(item.player.position)} • {item.player.age} ans •</span>
                          <CountryFlag country={item.player.nationality} className="h-3.5 w-5" />
                          <span>{item.player.nationality}</span>
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
            {actionMessage && <SuccessMessage message={actionMessage} />}
            {!isLoadingOffers && !offersError && sentOffers.length === 0 && <EmptyState message="Aucune offre émise pour le moment." />}
            {sentOffers.map((offer) => (
              <div
                key={offer.id}
                ref={(element) => { offerRefs.current[offer.id] = element }}
                className={`rounded-2xl border-2 bg-[#071722]/85 bg-gradient-to-r from-brand-purple/20 to-[#071722]/85 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)] transition-all ${
                  highlightedOfferId === offer.id
                    ? 'border-brand-cyan shadow-[0_0_42px_rgba(0,245,212,0.24)]'
                    : 'border-white/25 hover:border-brand-purple/60'
                }`}
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
                    <StartConversationButton
                      recipient={offer.messageRecipient}
                      className="ml-2 min-w-max"
                      onError={(message) => setOffersError(message || null)}
                    >
                      Message
                    </StartConversationButton>
                  </div>
                </div>
                <ContractResolutionPanel
                  offer={offer}
                  email={agentEmails[offer.id] ?? ''}
                  onEmailChange={(email) => setAgentEmails((current) => ({ ...current, [offer.id]: email }))}
                  onInvite={() => inviteAgent(offer)}
                  onExternalAgreement={() => handleExternalAgreementRequest(offer)}
                  isInviting={pendingActionId === `invite-${offer.id}`}
                  isConfirmingExternal={pendingActionId === `external-${offer.id}`}
                />
                <SellerClubResolutionPanel
                  offer={offer}
                  email={sellerClubEmails[offer.id] ?? ''}
                  onEmailChange={(email) => setSellerClubEmails((current) => ({ ...current, [offer.id]: email }))}
                  onInvite={() => inviteSellerClub(offer)}
                  onExternalContact={() => markSellerClubExternalContact(offer)}
                  isInviting={pendingActionId === `seller-club-invite-${offer.id}`}
                  isMarkingExternal={pendingActionId === `seller-club-external-${offer.id}`}
                />
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
            {actionMessage && <SuccessMessage message={actionMessage} />}
            {!isLoadingOffers && !offersError && receivedOffers.length === 0 && <EmptyState message="Aucune offre reçue pour le moment." />}
            {receivedOffers.map((offer) => (
              <div
                key={offer.id}
                ref={(element) => { offerRefs.current[offer.id] = element }}
                className={`rounded-2xl border-2 bg-[#071722]/85 bg-gradient-to-r from-brand-cyan/20 to-[#071722]/85 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)] transition-all ${
                  highlightedOfferId === offer.id
                    ? 'border-brand-purple shadow-[0_0_42px_rgba(163,94,255,0.28)]'
                    : 'border-white/25 hover:border-brand-cyan/60'
                }`}
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
                      <>
                        <Button
                          type="button"
                          onClick={() => handleOfferSelect(offer, 'received')}
                          variant="secondary"
                          className="min-w-max"
                        >
                          Voir les détails
                        </Button>
                        <StartConversationButton
                          recipient={offer.messageRecipient}
                          className="ml-2 min-w-max"
                          onError={(message) => setOffersError(message || null)}
                        >
                          Message
                        </StartConversationButton>
                      </>
                    )}
                  </div>
                </div>

                {offer.status === 'pending' && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={() => setPendingOfferDecision({ offer, action: 'accept' })}
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
                      onClick={() => setPendingOfferDecision({ offer, action: 'reject' })}
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
                    <StartConversationButton
                      recipient={offer.messageRecipient}
                      className="w-full"
                      onError={(message) => setOffersError(message || null)}
                    >
                      Envoyer un message
                    </StartConversationButton>
                  </div>
                )}
                <ContractResolutionPanel
                  offer={offer}
                  email={agentEmails[offer.id] ?? ''}
                  onEmailChange={(email) => setAgentEmails((current) => ({ ...current, [offer.id]: email }))}
                  onInvite={() => inviteAgent(offer)}
                  onExternalAgreement={() => handleExternalAgreementRequest(offer)}
                  isInviting={pendingActionId === `invite-${offer.id}`}
                  isConfirmingExternal={pendingActionId === `external-${offer.id}`}
                />
                <SellerClubResolutionPanel
                  offer={offer}
                  email={sellerClubEmails[offer.id] ?? ''}
                  onEmailChange={(email) => setSellerClubEmails((current) => ({ ...current, [offer.id]: email }))}
                  onInvite={() => inviteSellerClub(offer)}
                  onExternalContact={() => markSellerClubExternalContact(offer)}
                  isInviting={pendingActionId === `seller-club-invite-${offer.id}`}
                  isMarkingExternal={pendingActionId === `seller-club-external-${offer.id}`}
                />
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
          onAccept={() => setPendingOfferDecision({ offer: selectedOffer, action: 'accept' })}
          onNegotiate={() => {
            setSelectedOffer(null)
            router.push(`/market/transfers/negotiate?offerId=${selectedOffer.id}`)
          }}
          onReject={() => setPendingOfferDecision({ offer: selectedOffer, action: 'reject' })}
        />
      )}

      <ActionConfirmationModal
        isOpen={!!pendingOfferDecision}
        title={pendingOfferDecision?.action === 'accept' ? 'Confirmer l’acceptation' : 'Confirmer le refus'}
        description={
          pendingOfferDecision?.action === 'accept'
            ? 'Vous êtes sur le point d’accepter cette offre de transfert. Un accord entre clubs pourra être créé et la suite contractuelle sera lancée.'
            : 'Vous êtes sur le point de refuser cette offre de transfert. Le club émetteur sera informé de votre décision.'
        }
        confirmLabel={pendingOfferDecision?.action === 'accept' ? 'Oui, accepter l’offre' : 'Oui, refuser l’offre'}
        tone={pendingOfferDecision?.action === 'reject' ? 'danger' : 'default'}
        isLoading={pendingOfferDecision ? pendingActionId === `${pendingOfferDecision.action}-${pendingOfferDecision.offer.id}` : false}
        items={[
          {
            label: 'Joueur',
            value: pendingOfferDecision
              ? `${pendingOfferDecision.offer.player.firstName} ${pendingOfferDecision.offer.player.lastName}`
              : null,
          },
          { label: 'Montant', value: pendingOfferDecision?.offer.amount },
          { label: 'Bonus', value: pendingOfferDecision?.offer.performanceBonus ?? '-' },
          { label: 'Club émetteur', value: pendingOfferDecision ? pendingOfferDecision.offer.fromClub : null },
        ]}
        onClose={() => setPendingOfferDecision(null)}
        onConfirm={() => {
          if (pendingOfferDecision) {
            void updateOfferStatus(pendingOfferDecision.offer, pendingOfferDecision.action)
          }
        }}
      />

      <ExternalAgreementSalaryModal
        key={externalAgreementOffer?.id ?? 'closed'}
        offer={externalAgreementOffer}
        isLoading={externalAgreementOffer ? pendingActionId === `external-${externalAgreementOffer.id}` : false}
        onClose={() => setExternalAgreementOffer(null)}
        onConfirm={(contractTerms) => {
          if (externalAgreementOffer) {
            confirmExternalAgreement(externalAgreementOffer, contractTerms)
          }
        }}
      />
    </div>
  )
}

function SuccessMessage({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
      {message}
    </div>
  )
}

function SellerClubResolutionPanel({
  offer,
  email,
  onEmailChange,
  onInvite,
  onExternalContact,
  isInviting,
  isMarkingExternal,
}: {
  offer: SentOffer | ReceivedOffer
  email: string
  onEmailChange: (email: string) => void
  onInvite: () => void
  onExternalContact: () => void
  isInviting: boolean
  isMarkingExternal: boolean
}) {
  const resolution = offer.sellerClubResolution

  if (!resolution?.requiresAction || resolution.viewerRole !== 'buyer') {
    return null
  }

  return (
    <div className="mt-5 rounded-xl border border-brand-cyan/35 bg-brand-cyan/10 p-4">
      <div className="flex gap-3">
        <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-brand-cyan" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white">Club vendeur non représenté</p>
          <p className="mt-1 text-sm text-white/65">
            {resolution.sellerTeamName ?? 'Le club vendeur'} n’est pas encore représenté sur KickDeal. Vous pouvez
            inviter un dirigeant du club afin qu’il rejoigne la plateforme et réponde à votre offre.
          </p>

          {(resolution.invitationSent || resolution.externalContacted) && (
            <div className="mt-3 rounded-lg border border-white/10 bg-[#071722]/75 px-3 py-2 text-xs text-white/65">
              {resolution.invitationSent && (
                <p>
                  Invitation envoyée{resolution.invitedEmail ? ` à ${resolution.invitedEmail}` : ''}. En attente de
                  l’arrivée du club vendeur.
                </p>
              )}
              {resolution.externalContacted && (
                <p>Contact externe déclaré. L’offre reste conservée dans l’historique KickDeal.</p>
              )}
            </div>
          )}

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-white/55">
                Email d’un représentant du club
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => onEmailChange(event.target.value)}
                  placeholder="dirigeant@club.com"
                  className="min-w-0 flex-1 rounded-lg border border-white/15 bg-[#071722] px-3 py-2 text-sm text-white outline-none focus:border-brand-cyan"
                />
                <Button type="button" onClick={onInvite} isLoading={isInviting} icon={<Mail className="h-4 w-4" />}>
                  Inviter
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-3 lg:min-w-[240px]">
              <p className="text-sm text-white/70">Vous avez déjà avancé hors plateforme ?</p>
              <Button
                type="button"
                variant="secondary"
                className="mt-3 w-full"
                onClick={onExternalContact}
                isLoading={isMarkingExternal}
                disabled={resolution.externalContacted}
              >
                {resolution.externalContacted ? 'Contact externe enregistré' : 'Marquer contact externe'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ContractResolutionPanel({
  offer,
  email,
  onEmailChange,
  onInvite,
  onExternalAgreement,
  isInviting,
  isConfirmingExternal,
}: {
  offer: SentOffer | ReceivedOffer
  email: string
  onEmailChange: (email: string) => void
  onInvite: () => void
  onExternalAgreement: () => void
  isInviting: boolean
  isConfirmingExternal: boolean
}) {
  const router = useRouter()
  const resolution = offer.contractResolution

  if (offer.sellerClubResolution?.requiresAction || offer.negociationStatus !== 'pending_agent' || !resolution) {
    return null
  }

  return (
    <div className="mt-5 rounded-xl border border-amber-300/35 bg-amber-300/10 p-4">
      <div className="flex gap-3">
        <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white">Accord entre clubs trouvé, transfert en attente</p>
          <p className="mt-1 text-sm text-white/65">
            {resolution.viewerRole === 'buyer'
              ? resolution.playerHasAgent
                ? `Le joueur ne rejoindra ${resolution.buyerTeamName ?? 'votre club'} qu’après un accord contractuel avec son agent.`
                : 'Le joueur ne rejoindra votre club qu’après résolution du contrat joueur.'
              : resolution.playerHasAgent
                ? `Le joueur restera dans votre effectif jusqu’à ce que ${resolution.buyerTeamName ?? 'le club acheteur'} conclue un accord contractuel avec son agent.`
                : `Le joueur restera dans votre effectif jusqu’à la résolution du contrat joueur avec ${resolution.buyerTeamName ?? 'le club acheteur'}.`}
          </p>
          <div className="mt-3 rounded-lg border border-amber-200/20 bg-[#071722]/70 px-3 py-2 text-xs font-medium text-amber-100">
            Accord financier validé entre clubs, mais transfert non définitif tant que la négociation contractuelle n’est pas conclue.
          </div>

          {resolution.playerHasAgent ? (
            <div className="mt-4 rounded-lg border border-brand-cyan/25 bg-brand-cyan/10 p-4">
              <p className="text-sm font-semibold text-white">Négociation contractuelle KickDeal en cours</p>
              <p className="mt-1 text-sm text-white/65">
                {resolution.viewerRole === 'buyer'
                  ? 'L’agent du joueur est déjà présent. Suivez et finalisez l’accord contractuel depuis vos négociations.'
                  : `L’agent du joueur est déjà présent. ${resolution.buyerTeamName ?? 'Le club acheteur'} doit maintenant conclure le contrat joueur avec lui.`}
              </p>
              {resolution.viewerRole === 'buyer' && (
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-3"
                  onClick={() => router.push('/negociations')}
                >
                  Voir les négociations
                </Button>
              )}
            </div>
          ) : (
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {resolution.canInviteAgent && (
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <label className="text-xs font-semibold uppercase tracking-wide text-white/55">Email de l’agent</label>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => onEmailChange(event.target.value)}
                      placeholder="agent@email.com"
                      className="min-w-0 flex-1 rounded-lg border border-white/15 bg-[#071722] px-3 py-2 text-sm text-white outline-none focus:border-brand-cyan"
                    />
                    <Button type="button" onClick={onInvite} isLoading={isInviting} icon={<Mail className="h-4 w-4" />}>
                      Inviter
                    </Button>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-sm font-semibold text-white">
                  Accord contractuel hors plateforme
                </p>
                <p className="mt-1 text-xs text-white/55">
                  À utiliser seulement si les conditions joueur ont été conclues sans agent KickDeal.
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/55">
                  <span className={resolution.buyerConfirmedExternalAgreement ? 'text-emerald-300' : ''}>
                    <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
                    {resolution.buyerTeamName}: {resolution.buyerConfirmedExternalAgreement ? 'validé' : 'en attente'}
                  </span>
                  <span className={resolution.sellerConfirmedExternalAgreement ? 'text-emerald-300' : ''}>
                    <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
                    {resolution.sellerTeamName}: {resolution.sellerConfirmedExternalAgreement ? 'validé' : 'en attente'}
                  </span>
                </div>
                {(resolution.externalContractWeeklySalary || resolution.externalContractDurationMonths) && (
                  <div className="mt-3 rounded-lg border border-white/10 bg-[#071722]/70 px-3 py-2 text-xs text-white/60">
                    Conditions joueur :{' '}
                    {resolution.externalContractWeeklySalary ? `${resolution.externalContractWeeklySalary} / semaine` : 'salaire à confirmer'}
                    {' · '}
                    {resolution.externalContractDurationMonths ? `${resolution.externalContractDurationMonths} mois` : 'durée à confirmer'}
                  </div>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-3 w-full"
                  onClick={onExternalAgreement}
                  isLoading={isConfirmingExternal}
                  disabled={resolution.viewerConfirmedExternalAgreement}
                >
                  {resolution.viewerConfirmedExternalAgreement ? 'Votre validation est enregistrée' : 'Valider l’accord externe'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ExternalAgreementSalaryModal({
  offer,
  isLoading,
  onClose,
  onConfirm,
}: {
  offer: SentOffer | ReceivedOffer | null
  isLoading: boolean
  onClose: () => void
  onConfirm: (contractTerms: { weeklySalary: number; durationMonths: number }) => void
}) {
  const [weeklySalary, setWeeklySalary] = useState('')
  const [durationMonths, setDurationMonths] = useState('60')
  const weeklySalaryValue = parseFormattedNumber(weeklySalary)
  const durationMonthsValue = Number.parseInt(durationMonths, 10)

  if (!offer) return null

  const playerName = `${offer.player.firstName} ${offer.player.lastName}`
  const canSubmit = typeof weeklySalaryValue === 'number'
    && weeklySalaryValue > 0
    && Number.isInteger(durationMonthsValue)
    && durationMonthsValue >= 1
    && durationMonthsValue <= 120

  return (
    <Modal
      isOpen={!!offer}
      onClose={onClose}
      title="Salaire convenu avec le joueur"
      className="max-w-lg"
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-brand-cyan/25 bg-brand-cyan/10 px-4 py-3">
          <p className="text-sm text-white/70">
            Avant de valider l’accord externe, indiquez le salaire hebdomadaire convenu avec{' '}
            <span className="font-semibold text-white">{playerName}</span> ainsi que la durée du contrat. Ces conditions
            seront appliquées au joueur uniquement lorsque les deux clubs auront confirmé l’accord.
          </p>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <PlayerAvatar player={offer.player} />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-white">{playerName}</p>
            <p className="text-sm text-white/55">Salaire actuel : {offer.player.weeklySalary ?? '-'}</p>
          </div>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-white/80">
            Salaire hebdomadaire convenu
          </span>
          <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-[#071722] px-4 py-3 focus-within:border-brand-cyan">
            <BadgeEuro className="h-5 w-5 shrink-0 text-brand-cyan" />
            <input
              type="text"
              inputMode="decimal"
              value={weeklySalary}
              onChange={(event) => setWeeklySalary(formatNumberInput(event.target.value))}
              placeholder="Ex : 125 000"
              className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-white/35"
              autoFocus
            />
            <span className="shrink-0 text-sm font-semibold text-white/45">EUR / semaine</span>
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-white/80">
            Durée du contrat convenue
          </span>
          <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-[#071722] px-4 py-3 focus-within:border-brand-cyan">
            <CalendarClock className="h-5 w-5 shrink-0 text-brand-cyan" />
            <select
              value={durationMonths}
              onChange={(event) => setDurationMonths(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-white outline-none"
            >
              <option value="12" className="bg-[#071722]">12 mois</option>
              <option value="24" className="bg-[#071722]">24 mois</option>
              <option value="36" className="bg-[#071722]">36 mois</option>
              <option value="48" className="bg-[#071722]">48 mois</option>
              <option value="60" className="bg-[#071722]">60 mois</option>
              <option value="72" className="bg-[#071722]">72 mois</option>
              <option value="84" className="bg-[#071722]">84 mois</option>
              <option value="96" className="bg-[#071722]">96 mois</option>
              <option value="120" className="bg-[#071722]">120 mois</option>
            </select>
            <span className="shrink-0 text-sm font-semibold text-white/45">
              {Number.isInteger(durationMonthsValue) ? `${Math.round(durationMonthsValue / 12)} an(s)` : ''}
            </span>
          </div>
        </label>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Annuler
          </Button>
          <Button
            type="button"
            className="flex-1"
            disabled={!canSubmit}
            isLoading={isLoading}
            onClick={() => {
              if (canSubmit) {
                onConfirm({
                  weeklySalary: weeklySalaryValue,
                  durationMonths: durationMonthsValue,
                })
              }
            }}
          >
            Valider l’accord
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function readError(data: unknown, fallback: string): string {
  if (data && typeof data === 'object') {
    const maybeError = (data as { errorMessage?: unknown; message?: unknown }).errorMessage ?? (data as { message?: unknown }).message
    if (typeof maybeError === 'string') {
      return maybeError
    }
  }

  return fallback
}

export default TransferHome
