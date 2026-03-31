'use client'

import React from 'react'
import { Users, TrendingUp, Send, Zap } from 'lucide-react'

import Card from '@/components/ui/Card'
import { MOCK_CLUB_DETAIL } from '@/features/club/mockClubDetail'

function ClubDetailPage() {
  const club = MOCK_CLUB_DETAIL

  return (
    <div className="auth-bg min-h-screen w-full pt-28 pb-10 px-4">
      <div className="mx-auto w-full max-w-6xl">
        <Card color="cyan" baseGradient={false} className="mb-8 bg-white/5 p-6 md:p-8">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4 flex-1">
              <div className="text-6xl">{club.logo}</div>
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
            <StatCard label="En prêt" value={club.stats.injuredPlayers} icon={<Users className="h-5 w-5" />} />
            <StatCard label="Offres reçues" value={club.stats.offersReceived} icon={<Send className="h-5 w-5" />} />
            <StatCard label="Bloquées" value={club.stats.blockedOffers} icon={<Users className="h-5 w-5" />} />
            <StatCard label="Négociations" value={club.stats.negotiations} icon={<Zap className="h-5 w-5" />} />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-brand-cyan mb-4">FINANCES</h2>
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
            href="#"
          />
        </div>
      </div>
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
  href: string
}

function ActionCard({ title, description, icon, href }: ActionCardProps) {
  return (
    <a href={href}>
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
    </a>
  )
}

export default ClubDetailPage