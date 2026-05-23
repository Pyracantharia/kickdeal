'use client'

import React, { useEffect, useState } from 'react'
import { TrendingUp, Send, UserPlus, Users, Zap } from 'lucide-react'

import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { ActionCard, ClubLogo, FinanceCard, InfoCard, StatCard } from '@/components/club/ClubDetailParts'
import { clubManager } from '@/features/club/club'
import type { ClubAccounts, ClubDetail, CreatePlayerPayload } from '@/features/club/types/club'
import { formatNumberInput, parseFormattedNumber, parseOptionalNumber } from '@/features/format/number'

const INITIAL_PLAYER_FORM = {
  firstName: '',
  lastName: '',
  position: '',
  birthDate: '',
  nationality: '',
  photoUrl: '',
  heightCm: '',
  weightKg: '',
  preferredFoot: '',
  marketValue: '',
  weeklySalary: '',
  releaseClause: '',
  contractEndDate: '',
}

function ClubDetailPage() {
  const [club, setClub] = useState<ClubDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false)
  const [isCreatingPlayer, setIsCreatingPlayer] = useState(false)
  const [isUpdatingBudget, setIsUpdatingBudget] = useState(false)
  const [createPlayerError, setCreatePlayerError] = useState<string | null>(null)
  const [budgetError, setBudgetError] = useState<string | null>(null)
  const [playerForm, setPlayerForm] = useState(INITIAL_PLAYER_FORM)
  const [budgetForm, setBudgetForm] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadClub() {
      try {
        const response = await clubManager.getMine()

        if (!isMounted) {
          return
        }

        if (response.ok) {
          setClub(response.data.club)
          setErrorMessage(null)
        } else {
          setErrorMessage('Impossible de charger votre club.')
        }
      } catch {
        if (isMounted) {
          setErrorMessage('Impossible de charger votre club.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadClub()

    return () => {
      isMounted = false
    }
  }, [])

  const updatePlayerField = (field: keyof typeof INITIAL_PLAYER_FORM, value: string) => {
    setPlayerForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleCreatePlayer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsCreatingPlayer(true)
    setCreatePlayerError(null)

    const payload: CreatePlayerPayload = {
      firstName: playerForm.firstName,
      lastName: playerForm.lastName,
      position: playerForm.position,
      birthDate: playerForm.birthDate || undefined,
      nationality: playerForm.nationality || undefined,
      photoUrl: playerForm.photoUrl || undefined,
      heightCm: parseOptionalNumber(playerForm.heightCm),
      weightKg: parseOptionalNumber(playerForm.weightKg),
      preferredFoot: playerForm.preferredFoot || undefined,
      marketValue: parseFormattedNumber(playerForm.marketValue),
      weeklySalary: parseFormattedNumber(playerForm.weeklySalary),
      releaseClause: parseFormattedNumber(playerForm.releaseClause),
      contractEndDate: playerForm.contractEndDate || undefined,
    }

    try {
      const response = await clubManager.createPlayer(payload)

      if (!response.ok) {
        const errorData = response.data as { errorMessage?: unknown }
        setCreatePlayerError(
          typeof errorData.errorMessage === 'string'
            ? errorData.errorMessage
            : 'Impossible de créer ce joueur.',
        )
        return
      }

      setClub(response.data.club)
      setPlayerForm(INITIAL_PLAYER_FORM)
      setIsCreateModalOpen(false)
    } catch {
      setCreatePlayerError('Impossible de créer ce joueur.')
    } finally {
      setIsCreatingPlayer(false)
    }
  }

  const openBudgetModal = () => {
    setBudgetForm(club ? formatNumberInput(String(club.finances.totalBudget * 1_000_000)) : '')
    setBudgetError(null)
    setIsBudgetModalOpen(true)
  }

  const handleUpdateBudget = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsUpdatingBudget(true)
    setBudgetError(null)

    const budget = parseFormattedNumber(budgetForm)

    if (budget === undefined || budget < 0) {
      setBudgetError('Budget invalide.')
      setIsUpdatingBudget(false)
      return
    }

    try {
      const response = await clubManager.updateBudget({
        totalBudget: budget,
      })

      if (!response.ok) {
        const errorData = response.data as { errorMessage?: unknown }
        setBudgetError(
          typeof errorData.errorMessage === 'string'
            ? errorData.errorMessage
            : 'Impossible de mettre à jour le budget.',
        )
        return
      }

      setClub(response.data.club)
      setIsBudgetModalOpen(false)
    } catch {
      setBudgetError('Impossible de mettre à jour le budget.')
    } finally {
      setIsUpdatingBudget(false)
    }
  }

  if (isLoading) {
    return (
      <div className="auth-bg min-h-screen w-full pt-28 pb-10 px-4 flex items-center justify-center">
        <p className="text-white/60 text-lg">Chargement du club...</p>
      </div>
    )
  }

  if (!club) {
    return (
      <div className="auth-bg min-h-screen w-full pt-28 pb-10 px-4 flex items-center justify-center">
        <Card color="purple" baseGradient={false} className="bg-white/5 p-6 text-center">
          <p className="text-white/70">{errorMessage ?? 'Aucun club associé à votre compte.'}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="auth-bg min-h-screen w-full pt-28 pb-10 px-4">
      <div className="mx-auto w-full max-w-6xl">
        <Card
          color="cyan"
          baseGradient={false}
          className="relative mb-8 overflow-hidden border-brand-cyan/35 bg-[#071722]/85 bg-gradient-to-br from-brand-cyan/16 via-[#071722]/90 to-brand-purple/18 p-6 shadow-2xl shadow-brand-cyan/10 md:p-8"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-cyan" />
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4 flex-1">
              <ClubLogo club={club} />
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{club.name}</h1>
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-white/85">
                  <span className="rounded-full border border-brand-cyan/40 bg-brand-cyan/10 px-3 py-1 text-brand-cyan">{club.league}</span>
                  <span className="rounded-full border border-brand-purple/40 bg-brand-purple/10 px-3 py-1 text-white">{club.country}</span>
                  <span className="text-white/65">Membre depuis {club.joinDate}</span>
                </div>
                <div className="mt-4 h-[3px] w-28 rounded-full bg-gradient-to-r from-brand-cyan to-brand-purple" />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-4">
              <InfoCard label="Budget" value={`${club.finances.totalBudget.toFixed(1)} M€`} tone="cyan" />
              <InfoCard label="Salaires" value={`${club.finances.totalSalaries.toFixed(1)} M€`} tone="purple" />
              <InfoCard label="Joueurs" value={club.stats.totalPlayers.toString()} tone="cyan" />
            </div>
          </div>
        </Card>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-brand-cyan mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            STATISTIQUES DU CLUB
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <StatCard label="Effectif" value={club.stats.totalPlayers} icon={<Users className="h-5 w-5" />} tone="cyan" />
            <StatCard label="Sur le marché" value={club.stats.playersOnMarket} icon={<Send className="h-5 w-5" />} tone="purple" />
            <StatCard label="Blessés" value={club.stats.injuredPlayers} icon={<Users className="h-5 w-5" />} tone="cyan" />
            <StatCard label="Offres reçues" value={club.stats.offersReceived} icon={<Send className="h-5 w-5" />} tone="purple" />
            <StatCard label="Bloquées" value={club.stats.blockedOffers} icon={<Users className="h-5 w-5" />} tone="cyan" />
            <StatCard label="Négociations" value={club.stats.negotiations} icon={<Zap className="h-5 w-5" />} tone="purple" />
          </div>
        </div>

        <div className="mb-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold text-brand-cyan">FINANCES</h2>
            <Button
              type="button"
              variant="secondary"
              className="border-brand-purple/45 bg-brand-purple/15 text-white hover:bg-brand-purple/25"
              onClick={openBudgetModal}
            >
              Modifier le budget
            </Button>
          </div>
          <Card
            color="cyan"
            baseGradient={false}
            className="relative overflow-hidden border-brand-cyan/30 bg-[#071722]/85 bg-gradient-to-r from-brand-cyan/12 via-[#071722]/90 to-brand-purple/14 p-6 shadow-2xl shadow-brand-purple/10"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-purple via-brand-cyan to-brand-purple" />
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <FinanceCard label="Budget total" value={`${club.finances.totalBudget.toFixed(1)} M€`} tone="cyan" />
              <FinanceCard label="Budget restant" value={`${club.finances.remainingBudget.toFixed(1)} M€`} tone="purple" />
              <FinanceCard label="Masse salariale" value={`${club.finances.totalSalaries.toFixed(1)} M€`} tone="cyan" />
              <FinanceCard label="Valeur effectif" value={`${club.finances.playerValue.toFixed(1)} M€`} tone="purple" />
              <FinanceCard label="Revenus récents" value={`+${club.finances.recentRevenues.toFixed(1)} M€`} tone="cyan" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ActionCard
            title="Gérer les comptes"
            description={club.accounts ? formatSeatsLabel(club.accounts) : 'Invitations et accès'}
            icon={<UserPlus className="h-6 w-6" />}
            href="/club/accounts"
            tone="purple"
          />
          <ActionCard
            title="Gérer l'effectif"
            description="Voir et modifier vos joueurs"
            icon={<Users className="h-6 w-6" />}
            href="/players"
            tone="cyan"
          />
          <ActionCard
            title="Voir le marché"
            description="Joueurs disponibles"
            icon={<Send className="h-6 w-6" />}
            href="/market"
            tone="purple"
          />
          <ActionCard
            title="Créer un joueur"
            description="Centre de formation"
            icon={<Zap className="h-6 w-6" />}
            onClick={() => setIsCreateModalOpen(true)}
            tone="cyan"
          />
        </div>
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setCreatePlayerError(null)
        }}
        title="Créer un joueur"
      >
        <form className="space-y-4" onSubmit={handleCreatePlayer}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Prénom"
              value={playerForm.firstName}
              onChange={(event) => updatePlayerField('firstName', event.target.value)}
              required
            />
            <Input
              label="Nom"
              value={playerForm.lastName}
              onChange={(event) => updatePlayerField('lastName', event.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Poste"
              value={playerForm.position}
              onChange={(event) => updatePlayerField('position', event.target.value)}
              placeholder="BU, MC, DC..."
              required
            />
            <Input
              label="Date de naissance"
              type="date"
              value={playerForm.birthDate}
              onChange={(event) => updatePlayerField('birthDate', event.target.value)}
            />
          </div>
          <Input
            label="Nationalité"
            value={playerForm.nationality}
            onChange={(event) => updatePlayerField('nationality', event.target.value)}
            placeholder="France"
          />
          <Input
            label="Photo URL"
            type="url"
            value={playerForm.photoUrl}
            onChange={(event) => updatePlayerField('photoUrl', event.target.value)}
            placeholder="https://..."
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Taille"
              type="number"
              min="0"
              value={playerForm.heightCm}
              onChange={(event) => updatePlayerField('heightCm', event.target.value)}
              placeholder="180"
            />
            <Input
              label="Poids"
              type="number"
              min="0"
              value={playerForm.weightKg}
              onChange={(event) => updatePlayerField('weightKg', event.target.value)}
              placeholder="75"
            />
            <Input
              label="Pied fort"
              value={playerForm.preferredFoot}
              onChange={(event) => updatePlayerField('preferredFoot', event.target.value)}
              placeholder="Droit"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Valeur"
              inputMode="numeric"
              value={playerForm.marketValue}
              onChange={(event) => updatePlayerField('marketValue', formatNumberInput(event.target.value))}
              placeholder="5 000 000"
            />
            <Input
              label="Salaire hebdo"
              inputMode="numeric"
              value={playerForm.weeklySalary}
              onChange={(event) => updatePlayerField('weeklySalary', formatNumberInput(event.target.value))}
              placeholder="50 000"
            />
            <Input
              label="Clause"
              inputMode="numeric"
              value={playerForm.releaseClause}
              onChange={(event) => updatePlayerField('releaseClause', formatNumberInput(event.target.value))}
              placeholder="0"
            />
          </div>
          <Input
            label="Fin de contrat"
            type="date"
            value={playerForm.contractEndDate}
            onChange={(event) => updatePlayerField('contractEndDate', event.target.value)}
          />
          {createPlayerError && (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {createPlayerError}
            </p>
          )}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsCreateModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1" isLoading={isCreatingPlayer}>
              Créer
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isBudgetModalOpen}
        onClose={() => {
          setIsBudgetModalOpen(false)
          setBudgetError(null)
        }}
        title="Modifier le budget"
      >
        <form className="space-y-4" onSubmit={handleUpdateBudget}>
          <Input
            label="Budget transfert (€)"
            inputMode="numeric"
            value={budgetForm}
            onChange={(event) => setBudgetForm(formatNumberInput(event.target.value))}
            placeholder="100 000 000"
            required
          />
          {budgetError && (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {budgetError}
            </p>
          )}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsBudgetModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1" isLoading={isUpdatingBudget}>
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function formatSeatsLabel(accounts: ClubAccounts): string {
  if (accounts.seats.unlimited) {
    return `${accounts.seats.used} membres · illimité`
  }

  return `${accounts.seats.remaining ?? 0} place${(accounts.seats.remaining ?? 0) > 1 ? 's' : ''} restante${(accounts.seats.remaining ?? 0) > 1 ? 's' : ''}`
}

export default ClubDetailPage