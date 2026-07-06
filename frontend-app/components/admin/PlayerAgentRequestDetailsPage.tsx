'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, FileText, Mail, Phone, ShieldCheck, UserRound, X } from 'lucide-react';

import Button from '@/components/ui/Button';
import CircleImage from '@/components/media/CircleImage';
import { adminManager, type PlayerAgentRequest } from '@/features/admin/admin';

interface PlayerAgentRequestDetailsPageProps {
  requestId: string;
}

function PlayerAgentRequestDetailsPage({ requestId }: PlayerAgentRequestDetailsPageProps) {
  const [request, setRequest] = React.useState<PlayerAgentRequest | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const backendBaseUrl = React.useMemo(
    () => (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api').replace(/\/api\/?$/, ''),
    [],
  );

  const fetchRequest = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await adminManager.getPlayerAgentRequest(requestId);
      if (response.ok) {
        setRequest(response.data.request);
      } else {
        setErrorMessage(readError(response.data, 'Impossible de charger la demande.'));
      }
    } catch {
      setErrorMessage('Impossible de charger la demande.');
    } finally {
      setIsLoading(false);
    }
  }, [requestId]);

  React.useEffect(() => {
    void fetchRequest();
  }, [fetchRequest]);

  async function handleDecision(decision: 'approve' | 'reject') {
    setIsSaving(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      const response = decision === 'approve'
        ? await adminManager.approvePlayerAgentRequest(requestId)
        : await adminManager.rejectPlayerAgentRequest(requestId);

      if (!response.ok) {
        setErrorMessage(readError(response.data, 'Impossible de traiter cette demande.'));
        return;
      }

      setRequest(response.data.request);
      setMessage(response.data.message);
    } catch {
      setErrorMessage('Impossible de traiter cette demande.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="auth-bg min-h-screen w-full px-4 pb-10 pt-28">
      <div className="mx-auto w-full max-w-6xl">
        <Link href="/admin/player-agent-requests" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-300 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Retour aux demandes agents
        </Link>

        {isLoading ? (
          <p className="text-gray-400">Chargement de la demande...</p>
        ) : !request ? (
          <Panel>
            <p className="text-gray-300">{errorMessage ?? 'Demande introuvable.'}</p>
          </Panel>
        ) : (
          <div className="space-y-6">
            <Panel>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <CircleImage
                    src={request.player.photoUrl}
                    alt={`${request.player.firstName} ${request.player.lastName}`}
                    sizes="64px"
                    className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-brand-cyan/25 bg-brand-cyan/10 text-brand-cyan"
                    fallback={<UserRound className="h-7 w-7" />}
                  />
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <TypeBadge type={request.type} />
                      <StatusBadge status={request.status} />
                    </div>
                    <h1 className="truncate text-3xl font-bold text-white md:text-4xl">
                      {request.player.firstName} {request.player.lastName}
                    </h1>
                    <p className="mt-1 text-sm text-gray-400">
                      {request.player.position ?? 'Poste non renseigné'} · {request.player.team?.name ?? 'Club non renseigné'}
                    </p>
                  </div>
                </div>

                {request.status === 'pending' && (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button type="button" variant="secondary" isLoading={isSaving} onClick={() => handleDecision('reject')} icon={<X className="h-4 w-4" />}>
                      Refuser
                    </Button>
                    <Button type="button" isLoading={isSaving} onClick={() => handleDecision('approve')} icon={<Check className="h-4 w-4" />}>
                      Valider
                    </Button>
                  </div>
                )}
              </div>
            </Panel>

            {message && (
              <div className="rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 px-4 py-3 text-sm text-brand-cyan">
                {message}
              </div>
            )}

            {errorMessage && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {errorMessage}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
              <Panel title="Joueur">
                <InfoRow label="Nationalité" value={request.player.nationality ?? 'Non renseignée'} />
                <InfoRow label="Date de naissance" value={formatShortDate(request.player.birthDate)} />
                <InfoRow label="Valeur marché" value={formatMoney(request.player.marketValue)} />
                <InfoRow label="Statut contrat" value={request.player.contractStatus ?? 'Non renseigné'} />
                <InfoRow label="Statut marché" value={request.player.marketStatus ?? 'Non renseigné'} />
              </Panel>

              <AgentPanel title="Agent demandeur" agent={request.requestingAgent} />
              <AgentPanel title="Agent actuel" agent={request.currentAgent} emptyText="Aucun agent actuel." />
            </div>

            <Panel title="Demande">
              <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Message</p>
                  {request.message ? (
                    <p className="whitespace-pre-wrap text-sm leading-6 text-gray-300">{request.message}</p>
                  ) : (
                    <p className="text-sm text-gray-500">Aucun message fourni.</p>
                  )}
                </div>

                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <InfoRow label="Créée le" value={formatDate(request.createdAt)} />
                  <InfoRow label="Décidée le" value={formatDate(request.decidedAt)} />
                  {request.verificationDocumentPath && (
                    <a
                      href={`${backendBaseUrl}${request.verificationDocumentPath}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-2 rounded-lg border border-brand-purple/30 bg-brand-purple/10 px-4 py-2 text-sm font-semibold text-brand-purple transition-colors hover:border-brand-cyan/40 hover:text-brand-cyan"
                    >
                      <FileText className="h-4 w-4" />
                      {request.verificationDocumentOriginalName ?? 'Voir le justificatif'}
                    </a>
                  )}
                </div>
              </div>
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}

function AgentPanel({
  title,
  agent,
  emptyText = 'Agent non renseigné.',
}: {
  title: string;
  agent: PlayerAgentRequest['requestingAgent'];
  emptyText?: string;
}) {
  return (
    <Panel title={title}>
      {!agent ? (
        <p className="text-sm text-gray-500">{emptyText}</p>
      ) : (
        <>
          <InfoRow label="Nom" value={agent.name} />
          <InfoRow label="Email" value={agent.email ?? 'Non renseigné'} icon={<Mail className="h-4 w-4" />} />
          <InfoRow label="Pays" value={agent.country ?? 'Non renseigné'} />
          <InfoRow
            label="Contact"
            value={agent.user ? `${agent.user.firstName} ${agent.user.lastName}` : 'Non renseigné'}
            icon={<ShieldCheck className="h-4 w-4" />}
          />
          <InfoRow label="Téléphone" value={agent.user?.phone ?? 'Non renseigné'} icon={<Phone className="h-4 w-4" />} />
        </>
      )}
    </Panel>
  );
}

function Panel({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#071722]/85 p-5 shadow-2xl shadow-black/20 md:p-7">
      {title && <h2 className="mb-4 text-xl font-bold text-white">{title}</h2>}
      {children}
    </section>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b border-white/10 py-3 last:border-0">
      {icon && <span className="mt-0.5 text-gray-500">{icon}</span>}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">{label}</p>
        <p className="mt-1 text-sm text-gray-200">{value}</p>
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: PlayerAgentRequest['type'] }) {
  return (
    <span className="rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-brand-cyan">
      {type === 'agent_handover' ? 'Passation agent' : 'Nouvelle représentation'}
    </span>
  );
}

function StatusBadge({ status }: { status: PlayerAgentRequest['status'] }) {
  const labels: Record<PlayerAgentRequest['status'], string> = {
    pending: 'En attente',
    admin_approved: 'Validée admin',
    approved: 'Approuvée',
    rejected: 'Rejetée',
  };
  const className = status === 'pending'
    ? 'border-yellow-400/30 bg-yellow-400/10 text-yellow-200'
    : status === 'rejected'
      ? 'border-red-500/30 bg-red-500/10 text-red-300'
      : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300';

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${className}`}>
      {labels[status]}
    </span>
  );
}

function formatDate(value?: string | null): string {
  if (!value) {
    return 'Non renseignée';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatShortDate(value?: string | null): string {
  if (!value) {
    return 'Non renseignée';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

function formatMoney(value?: number | null): string {
  if (typeof value !== 'number') {
    return 'Non renseignée';
  }

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value / 100);
}

function readError(data: unknown, fallback: string): string {
  if (data && typeof data === 'object') {
    const message = (data as { errorMessage?: unknown; message?: unknown; error?: unknown }).errorMessage
      ?? (data as { message?: unknown }).message
      ?? (data as { error?: unknown }).error;

    if (typeof message === 'string') {
      return message;
    }
  }

  return fallback;
}

export default PlayerAgentRequestDetailsPage;
