'use client'

import React, { useEffect, useState } from 'react'
import { Users, TrendingUp, Send, Zap } from 'lucide-react'

import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import CircleImage from '@/components/media/CircleImage'
import { clubManager } from '@/features/club/club'
import type { ClubDetail, CreatePlayerPayload } from '@/features/club/types/club'

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
      heightCm: toNumber(playerForm.heightCm),
      weightKg: toNumber(playerForm.weightKg),
      preferredFoot: playerForm.preferredFoot || undefined,
      marketValue: toNumber(playerForm.marketValue),
      weeklySalary: toNumber(playerForm.weeklySalary),
      releaseClause: toNumber(playerForm.releaseClause),
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
    setBudgetForm(club ? String(club.finances.totalBudget) : '')
    setBudgetError(null)
    setIsBudgetModalOpen(true)
  }

  const handleUpdateBudget = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsUpdatingBudget(true)
    setBudgetError(null)

    const budgetInMillions = Number(budgetForm)

    if (!Number.isFinite(budgetInMillions) || budgetInMillions < 0) {
      setBudgetError('Budget invalide.')
      setIsUpdatingBudget(false)
      return
    }

    try {
      const response = await clubManager.updateBudget({
        totalBudget: budgetInMillions * 1_000_000,
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
        <Card color="cyan" baseGradient={false} className="mb-8 bg-white/5 p-6 md:p-8">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4 flex-1">
              <ClubLogo club={club} />
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{club.name}</h1>
                <div className="flex items-center gap-2 text-brand-cyan text-sm">
                  <span>{club.league}</span>
                  <span>•</span>
                  <span>{club.country}</span>
                  <span>•</span>
                  <span>Membre depuis {club.joinDate}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <InfoCard label="Budget" value={`${club.finances.totalBudget.toFixed(1)} M€`} />
              <InfoCard label="Salaires" value={`${club.finances.totalSalaries.toFixed(1)} M€`} />
              <InfoCard label="Joueurs" value={club.stats.totalPlayers.toString()} />
            </div>
          </div>
        </Card>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-brand-cyan mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            STATISTIQUES DU CLUB
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <StatCard label="Effectif" value={club.stats.totalPlayers} icon={<Users className="h-5 w-5" />} />
            <StatCard label="Sur le marché" value={club.stats.playersOnMarket} icon={<Send className="h-5 w-5" />} />
            <StatCard label="Blessés" value={club.stats.injuredPlayers} icon={<Users className="h-5 w-5" />} />
            <StatCard label="Offres reçues" value={club.stats.offersReceived} icon={<Send className="h-5 w-5" />} />
            <StatCard label="Bloquées" value={club.stats.blockedOffers} icon={<Users className="h-5 w-5" />} />
            <StatCard label="Négociations" value={club.stats.negotiations} icon={<Zap className="h-5 w-5" />} />
          </div>
        </div>

        <div className="mb-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold text-brand-cyan">FINANCES</h2>
            <Button type="button" variant="secondary" onClick={openBudgetModal}>
              Modifier le budget
            </Button>
          </div>
          <Card color="cyan" baseGradient={false} className="bg-white/5 p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <FinanceCard label="Budget total" value={`${club.finances.totalBudget.toFixed(1)} M€`} />
              <FinanceCard label="Budget restant" value={`${club.finances.remainingBudget.toFixed(1)} M€`} />
              <FinanceCard label="Masse salariale" value={`${club.finances.totalSalaries.toFixed(1)} M€`} />
              <FinanceCard label="Valeur effectif" value={`${club.finances.playerValue.toFixed(1)} M€`} />
              <FinanceCard label="Revenus récents" value={`+${club.finances.recentRevenues.toFixed(1)} M€`} />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionCard
            title="Gérer l'effectif"
            description="Voir et modifier vos joueurs"
            icon={<Users className="h-6 w-6" />}
            href="/players"
          />
          <ActionCard
            title="Voir le marché"
            description="Joueurs disponibles"
            icon={<Send className="h-6 w-6" />}
            href="/market"
          />
          <ActionCard
            title="Créer un joueur"
            description="Centre de formation"
            icon={<Zap className="h-6 w-6" />}
            onClick={() => setIsCreateModalOpen(true)}
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
              type="number"
              min="0"
              value={playerForm.marketValue}
              onChange={(event) => updatePlayerField('marketValue', event.target.value)}
              placeholder="5000000"
            />
            <Input
              label="Salaire hebdo"
              type="number"
              min="0"
              value={playerForm.weeklySalary}
              onChange={(event) => updatePlayerField('weeklySalary', event.target.value)}
              placeholder="50000"
            />
            <Input
              label="Clause"
              type="number"
              min="0"
              value={playerForm.releaseClause}
              onChange={(event) => updatePlayerField('releaseClause', event.target.value)}
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
            label="Budget transfert (M€)"
            type="number"
            min="0"
            step="0.1"
            value={budgetForm}
            onChange={(event) => setBudgetForm(event.target.value)}
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

function toNumber(value: string): number | undefined {
  if ('' === value) {
    return undefined
  }

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : undefined
}

function ClubLogo({ club }: { club: ClubDetail }) {
  if (club.logoUrl) {
    return (
      <CircleImage
        src={club.logoUrl}
        alt={club.name}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-brand-cyan bg-white/10"
        sizes="80px"
        imageClassName="object-contain p-2"
        fallback={<ClubLogoFallback club={club} />}
      />
    )
  }

  return <ClubLogoFallback club={club} />
}

function ClubLogoFallback({ club }: { club: ClubDetail }) {
  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-brand-cyan bg-white/10 text-3xl font-bold text-white">
      {(club.logo || club.name.charAt(0)).toUpperCase()}
    </div>
  )
}

interface InfoCardProps {
  label: string
  value: string
}

function InfoCard({ label, value }: InfoCardProps) {
  return (
    <div className="rounded-lg border-2 border-brand-cyan/50 bg-white/5 px-3 py-2 text-center">
      <p className="text-xs text-white/70">{label}</p>
      <p className="text-lg font-bold text-brand-cyan">{value}</p>
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="rounded-lg border-2 border-white/20 bg-white/5 p-4 flex flex-col items-center gap-2 text-center">
      <div className="text-brand-cyan">{icon}</div>
      <p className="text-2xl font-bold text-brand-cyan">{value}</p>
      <p className="text-xs text-white/70">{label}</p>
    </div>
  )
}

interface FinanceCardProps {
  label: string
  value: string
}

function FinanceCard({ label, value }: FinanceCardProps) {
  return (
    <div className="text-center">
      <p className="text-xs text-white/70 mb-2">{label}</p>
      <p className="text-2xl font-bold text-brand-cyan">{value}</p>
    </div>
  )
}

interface ActionCardProps {
  title: string
  description: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
}

function ActionCard({ title, description, icon, href, onClick }: ActionCardProps) {
  const content = (
    <div className="rounded-lg border-2 border-white/20 bg-white/5 p-4 hover:border-brand-cyan/50 hover:bg-white/10 transition-all cursor-pointer group">
        <div className="flex items-center gap-4">
          <div className="text-brand-cyan">{icon}</div>
          <div className="flex-1">
            <p className="font-semibold text-white">{title}</p>
            <p className="text-sm text-white/70">{description}</p>
          </div>
          <span className="text-brand-cyan opacity-0 group-hover:opacity-100 transition-opacity">→</span>
        </div>
      </div>
  )

  if (href) {
    return (
      <a href={href}>
        {content}
      </a>
    )
  }

  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      {content}
    </button>
  )
}

export default ClubDetailPage