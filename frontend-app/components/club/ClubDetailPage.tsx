'use client'

import React, { useEffect, useState } from 'react'
import {
  Activity,
  ArrowUpRight,
  BadgeEuro,
  Crown,
  Gauge,
  Landmark,
  Send,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
  WalletCards,
  Zap,
} from 'lucide-react'

import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import CountrySelect from '@/components/country/CountrySelect'
import { ActionCard, ClubLogo, FinanceCard, InfoCard, StatCard } from '@/components/club/ClubDetailParts'
import { clubManager, type PlayerPositionOption } from '@/features/club/club'
import type { ClubAccounts, ClubDetail, CreatePlayerPayload } from '@/features/club/types/club'
import { formatNumberInput, parseFormattedNumber, parseOptionalNumber } from '@/features/format/number'
import { getPositionDisplayName } from '@/features/players/position'

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
  const [positionOptions, setPositionOptions] = useState<PlayerPositionOption[]>([])
  const [isLoadingPositions, setIsLoadingPositions] = useState(false)

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

  useEffect(() => {
    if (!isCreateModalOpen || positionOptions.length > 0) {
      return
    }

    let isMounted = true

    async function loadPositions() {
      setIsLoadingPositions(true)

      try {
        const response = await clubManager.getPlayerPositions()
        if (isMounted && response.ok) {
          setPositionOptions(response.data.positions ?? [])
        }
      } catch {
        if (isMounted) {
          setPositionOptions([])
        }
      } finally {
        if (isMounted) {
          setIsLoadingPositions(false)
        }
      }
    }

    void loadPositions()

    return () => {
      isMounted = false
    }
  }, [isCreateModalOpen, positionOptions.length])

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
        <section className="relative mb-8 overflow-hidden rounded-[2rem] border border-brand-cyan/30 bg-[#061923]/90 p-6 shadow-2xl shadow-brand-cyan/10 md:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(0,245,212,0.20),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(168,85,247,0.24),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_38%)]" />
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/10 bg-white/[0.03]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-cyan" />

          <div className="relative grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <ClubLogo club={club} />
                <div className="min-w-0">
                  <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-cyan/35 bg-brand-cyan/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-brand-cyan">
                    <Crown className="h-3.5 w-3.5" />
                    Centre de commandement
                  </p>
                  <h1 className="max-w-3xl text-5xl font-black uppercase leading-none tracking-tight text-white md:text-6xl">
                    {club.name}
                  </h1>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-semibold text-white/80">
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">{club.league}</span>
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">{club.country}</span>
                    <span className="rounded-full border border-brand-cyan/25 bg-[#071722]/90 px-3 py-1 text-brand-cyan">
                      Membre depuis {club.joinDate}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <InfoCard label="Budget mercato" value={`${club.finances.totalBudget.toFixed(1)} M€`} />
                <InfoCard label="Valeur effectif" value={`${club.finances.playerValue.toFixed(1)} M€`} />
                <InfoCard label="Joueurs suivis" value={club.stats.totalPlayers.toString()} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-3xl border border-white/12 bg-black/20 p-5 backdrop-blur">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">Santé mercato</p>
                    <p className="mt-1 text-2xl font-black text-white">Pilotage actif</p>
                  </div>
                  <div className="rounded-2xl border border-brand-cyan/35 bg-brand-cyan/10 p-3 text-brand-cyan">
                    <Gauge className="h-6 w-6" />
                  </div>
                </div>
                <div className="space-y-3">
                  <SignalLine label="Offres reçues" value={club.stats.offersReceived} tone="cyan" />
                  <SignalLine label="Négociations" value={club.stats.negotiations} tone="cyan" />
                  <SignalLine label="Joueurs sur le marché" value={club.stats.playersOnMarket} tone="cyan" />
                </div>
              </div>

              <div className="rounded-3xl border border-brand-cyan/25 bg-[#071722]/95 p-5 shadow-xl shadow-black/25">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-brand-cyan">
                  <Sparkles className="h-4 w-4" />
                  Prochaine action
                </p>
                <p className="mt-3 text-lg font-bold text-white">Optimisez votre effectif et gardez le contrôle des accès club.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" onClick={() => setIsCreateModalOpen(true)} className="min-w-40">
                    Créer un joueur
                  </Button>
                  <Button type="button" variant="secondary" onClick={openBudgetModal}>
                    Budget
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard label="Effectif" value={club.stats.totalPlayers} icon={<Users className="h-5 w-5" />} />
          <StatCard label="Sur le marché" value={club.stats.playersOnMarket} icon={<Send className="h-5 w-5" />} />
          <StatCard label="Blessés" value={club.stats.injuredPlayers} icon={<ShieldCheck className="h-5 w-5" />} />
          <StatCard label="Offres reçues" value={club.stats.offersReceived} icon={<Activity className="h-5 w-5" />} />
          <StatCard label="Bloquées" value={club.stats.blockedOffers} icon={<Trophy className="h-5 w-5" />} />
          <StatCard label="Négociations" value={club.stats.negotiations} icon={<Zap className="h-5 w-5" />} />
        </section>

        <section className="mb-8 grid gap-6 xl:grid-cols-[1fr_380px]">
          <Card
            color="cyan"
            baseGradient={false}
            className="relative overflow-hidden rounded-[1.75rem] border-brand-cyan/30 bg-[#071722]/90 p-6 shadow-2xl shadow-brand-cyan/10 md:p-7"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(0,245,212,0.14),transparent_34%),radial-gradient(circle_at_88%_10%,rgba(168,85,247,0.16),transparent_30%)]" />
            <div className="relative mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-brand-cyan">
                  <WalletCards className="h-5 w-5" />
                  Salle financière
                </p>
                <h2 className="mt-2 text-3xl font-black uppercase text-white">Budget & puissance</h2>
                <p className="mt-2 max-w-2xl text-white/55">
                  Suivez votre marge de manoeuvre, la valeur de l’effectif et la pression salariale depuis un seul panneau.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="border-brand-cyan/35 bg-[#102331] text-white hover:bg-[#143044]"
                onClick={openBudgetModal}
              >
                Modifier le budget
              </Button>
            </div>

            <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FinanceCard label="Budget total" value={`${club.finances.totalBudget.toFixed(1)} M€`} />
              <FinanceCard label="Budget restant" value={`${club.finances.remainingBudget.toFixed(1)} M€`} />
              <FinanceCard label="Masse salariale" value={`${club.finances.totalSalaries.toFixed(1)} M€`} />
              <FinanceCard label="Valeur effectif" value={`${club.finances.playerValue.toFixed(1)} M€`} />
              <FinanceCard label="Revenus récents" value={`+${club.finances.recentRevenues.toFixed(1)} M€`} />
            </div>
          </Card>

          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/12 bg-[#071722]/85 p-6 shadow-2xl shadow-black/20">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-cyan to-brand-cyan/40" />
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.22em] text-brand-cyan">
              <Landmark className="h-5 w-5" />
              Gouvernance
            </p>
            <h3 className="mt-3 text-2xl font-black text-white">Comptes & accès</h3>
            <p className="mt-2 text-white/55">
              {club.accounts ? formatSeatsLabel(club.accounts) : 'Invitations et rôles disponibles pour votre staff.'}
            </p>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/40">Statut</p>
              <p className="mt-1 text-lg font-bold text-white">
                {club.accounts?.canManage ? 'Gestionnaire principal' : 'Accès membre'}
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-brand-cyan">Actions rapides</p>
              <h2 className="mt-1 text-3xl font-black uppercase text-white">Piloter le club</h2>
            </div>
            <ArrowUpRight className="hidden h-8 w-8 text-brand-cyan md:block" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ActionCard
              title="Gérer les comptes"
              description={club.accounts ? formatSeatsLabel(club.accounts) : 'Invitations et accès'}
              icon={<UserPlus className="h-6 w-6" />}
              href="/club/accounts"
            />
            <ActionCard
              title="Gérer l'effectif"
              description="Voir, filtrer et piloter vos joueurs"
              icon={<Users className="h-6 w-6" />}
              href="/players"
            />
            <ActionCard
              title="Voir le marché"
              description="Offres, listes et opportunités"
              icon={<BadgeEuro className="h-6 w-6" />}
              href="/market"
            />
            <ActionCard
              title="Créer un joueur"
              description="Centre de formation et recrues internes"
              icon={<Zap className="h-6 w-6" />}
              onClick={() => setIsCreateModalOpen(true)}
            />
          </div>
        </section>
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
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-gray-200">Poste</span>
              <select
                value={playerForm.position}
                onChange={(event) => updatePlayerField('position', event.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 disabled:cursor-not-allowed disabled:opacity-60"
                required
                disabled={isLoadingPositions || positionOptions.length === 0}
              >
                <option value="" className="bg-[#071722]">
                  {isLoadingPositions ? 'Chargement des postes...' : 'Sélectionner un poste'}
                </option>
                {positionOptions.map((position) => (
                  <option key={position.id} value={position.id} className="bg-[#071722]">
                    {getPositionDisplayName(position.label || position.id)}
                  </option>
                ))}
              </select>
              {!isLoadingPositions && positionOptions.length === 0 && (
                <span className="text-xs text-amber-200">
                  Aucun poste existant n’est disponible en base pour le moment.
                </span>
              )}
            </label>
            <Input
              label="Date de naissance"
              type="date"
              value={playerForm.birthDate}
              onChange={(event) => updatePlayerField('birthDate', event.target.value)}
            />
          </div>
          <CountrySelect
            label="Nationalité"
            value={playerForm.nationality}
            onChange={(value) => updatePlayerField('nationality', value)}
            placeholder="Choisir une nationalité"
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

function SignalLine({ label, value, tone }: { label: string; value: number; tone: 'cyan' | 'purple' }) {
  const barColor = tone === 'cyan' ? 'bg-brand-cyan' : 'bg-brand-purple'
  const textColor = tone === 'cyan' ? 'text-brand-cyan' : 'text-brand-purple'
  const width = Math.max(8, Math.min(100, value * 14))

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-white/62">{label}</span>
        <span className={`font-black ${textColor}`}>{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

export default ClubDetailPage
