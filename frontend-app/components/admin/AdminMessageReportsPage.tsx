'use client';

import React from 'react';
import { Ban, Check, MailWarning } from 'lucide-react';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import {
  adminManager,
  type MessageReport,
  type MessageReportStatus,
} from '@/features/admin/admin';

const statusLabels: Record<MessageReportStatus | 'all', string> = {
  all: 'Tous',
  pending: 'En attente',
  warned: 'Avertis',
  banned: 'Bannis',
  dismissed: 'Ignorés',
};

function AdminMessageReportsPage() {
  const [reports, setReports] = React.useState<MessageReport[]>([]);
  const [status, setStatus] = React.useState<MessageReportStatus | 'all'>('pending');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [selectedReport, setSelectedReport] = React.useState<MessageReport | null>(null);
  const [decision, setDecision] = React.useState<'warn' | 'ban' | null>(null);
  const [comment, setComment] = React.useState('');
  const [durationDays, setDurationDays] = React.useState(7);
  const [message, setMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const fetchReports = React.useCallback(async (nextStatus = status) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await adminManager.getMessageReports(nextStatus);
      if (response.ok) {
        setReports(response.data.reports);
      } else {
        setErrorMessage(readError(response.data, 'Impossible de charger les signalements.'));
      }
    } catch {
      setErrorMessage('Impossible de charger les signalements.');
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  React.useEffect(() => {
    void fetchReports(status);
  }, [fetchReports, status]);

  function openDecision(report: MessageReport, nextDecision: 'warn' | 'ban') {
    setSelectedReport(report);
    setDecision(nextDecision);
    setComment('');
    setDurationDays(7);
    setErrorMessage(null);
  }

  async function handleDecision() {
    if (!selectedReport || !decision) return;

    setIsSaving(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      const response = decision === 'warn'
        ? await adminManager.warnMessageReport(selectedReport.id, comment)
        : await adminManager.banMessageReport(selectedReport.id, { durationDays, comment });

      if (!response.ok) {
        setErrorMessage(readError(response.data, 'Impossible de traiter ce signalement.'));
        return;
      }

      setMessage(response.data.message);
      setReports((current) => current.map((report) => report.id === response.data.report.id ? response.data.report : report));
      setSelectedReport(null);
      setDecision(null);
    } catch {
      setErrorMessage('Impossible de traiter ce signalement.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-[#071722]/85 p-5 shadow-2xl shadow-black/20 md:p-7">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Signalements</h2>
          <p className="mt-1 text-sm text-gray-400">Messages déplacés ou insultants remontés par les utilisateurs.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(statusLabels) as Array<MessageReportStatus | 'all'>).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                status === item
                  ? 'border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan'
                  : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {statusLabels[item]}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 px-4 py-3 text-sm text-brand-cyan">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <p className="text-gray-400">Chargement des signalements...</p>
      ) : reports.length === 0 ? (
        <p className="text-gray-400">Aucun signalement.</p>
      ) : (
        <ul className="space-y-4">
          {reports.map((report) => (
            <li key={report.id} className="rounded-xl border border-white/10 bg-[#0A1B2B]/70 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <StatusBadge status={report.status} />
                    <span className="text-xs text-gray-500">{formatDate(report.createdAt)}</span>
                  </div>

                  <p className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-white">
                    {report.messageContent}
                  </p>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <Info label="Signalé par" value={formatUser(report.reporter)} />
                    <Info label="Expéditeur" value={formatUser(report.reportedUser)} />
                  </div>

                  {report.reason && (
                    <p className="mt-3 text-sm text-gray-400">
                      <span className="font-semibold text-gray-300">Motif :</span> {report.reason}
                    </p>
                  )}
                </div>

                {report.status === 'pending' && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => openDecision(report, 'warn')}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-yellow-400/30 bg-yellow-400/10 text-yellow-200 transition-colors hover:bg-yellow-400/20"
                      aria-label="Avertir l’expéditeur"
                    >
                      <MailWarning className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openDecision(report, 'ban')}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 transition-colors hover:bg-red-500/20"
                      aria-label="Bannir l’expéditeur"
                    >
                      <Ban className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={!!selectedReport && !!decision}
        onClose={() => {
          setSelectedReport(null);
          setDecision(null);
        }}
        title={decision === 'ban' ? 'Bannir l’expéditeur' : 'Avertir l’expéditeur'}
      >
        <div className="space-y-5">
          {decision === 'ban' && (
            <div>
              <label htmlFor="ban-duration" className="mb-2 block text-sm font-medium text-gray-200">
                Durée du bannissement
              </label>
              <select
                id="ban-duration"
                value={durationDays}
                onChange={(event) => setDurationDays(Number(event.target.value))}
                className="w-full rounded-lg border border-white/10 bg-[#0A1B2B] px-4 py-3 text-sm text-white outline-none focus:border-brand-cyan"
              >
                <option value={1}>1 jour</option>
                <option value={3}>3 jours</option>
                <option value={7}>7 jours</option>
                <option value={14}>14 jours</option>
                <option value={30}>1 mois</option>
                <option value={90}>3 mois</option>
                <option value={180}>6 mois</option>
              </select>
            </div>
          )}

          <div>
            <label htmlFor="moderation-comment" className="mb-2 block text-sm font-medium text-gray-200">
              Message envoyé par mail
            </label>
            <textarea
              id="moderation-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-brand-cyan"
              placeholder="Expliquez brièvement la décision..."
            />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setSelectedReport(null)}>
              Annuler
            </Button>
            <Button
              type="button"
              isLoading={isSaving}
              onClick={handleDecision}
              icon={decision === 'ban' ? <Ban className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            >
              Confirmer
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}

function StatusBadge({ status }: { status: MessageReportStatus }) {
  const className = status === 'pending'
    ? 'border-yellow-400/30 bg-yellow-400/10 text-yellow-200'
    : status === 'banned'
      ? 'border-red-500/30 bg-red-500/10 text-red-300'
      : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300';

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${className}`}>
      {statusLabels[status]}
    </span>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">{label}</p>
      <p className="mt-1 text-sm text-gray-200">{value}</p>
    </div>
  );
}

function formatUser(user: MessageReport['reporter']): string {
  if (!user) {
    return 'Utilisateur introuvable';
  }

  return `${user.firstName} ${user.lastName} (${user.email})`;
}

function formatDate(value?: string | null): string {
  if (!value) return '';

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
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

export default AdminMessageReportsPage;
