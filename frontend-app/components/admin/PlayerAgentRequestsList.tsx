'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Eye, FileText, X } from 'lucide-react';

import { adminManager, type PlayerAgentRequest } from '@/features/admin/admin';

function PlayerAgentRequestsList() {
  const [requestsList, setRequestsList] = React.useState<PlayerAgentRequest[] | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const backendBaseUrl = React.useMemo(
    () => (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api').replace(/\/api\/?$/, ''),
    [],
  );

  async function fetchPendingRequests() {
    try {
      const response = await adminManager.getPendingPlayerAgentRequests();
      if (response.ok) {
        setRequestsList(response.data.pendingRequests);
      } else {
        setErrorMessage(readError(response.data, 'Impossible de charger les demandes agent.'));
      }
    } catch {
      setErrorMessage('Impossible de charger les demandes agent.');
    }
  }

  React.useEffect(() => {
    void fetchPendingRequests();
  }, []);

  async function handleDecision(requestId: string, decision: 'approve' | 'reject') {
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

      setMessage(response.data.message);
      setRequestsList((current) => current?.filter((request) => request.id !== requestId) ?? current);
    } catch {
      setErrorMessage('Impossible de traiter cette demande.');
    }
  }

  if (requestsList === null) {
    return <p className="text-gray-400">Chargement des demandes agent...</p>;
  }

  if (requestsList.length === 0) {
    return <p className="text-gray-400">Aucune demande de gestion de joueur en attente.</p>;
  }

  return (
    <div className="space-y-4">
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

      <ul className="space-y-4">
        {requestsList.map((request) => (
          <li key={request.id} className="rounded-lg border border-gray-700 bg-[#0A1B2B]/60 p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-brand-cyan">
                    {request.type === 'agent_handover' ? 'Passation agent' : 'Nouvelle représentation'}
                  </span>
                  <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-yellow-200">
                    Validation admin
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-white">
                  {request.player.firstName} {request.player.lastName}
                </h3>
                <p className="mt-1 text-sm text-gray-400">
                  Demandé par {request.requestingAgent?.name ?? 'Agent inconnu'}
                  {request.requestingAgent?.email ? ` (${request.requestingAgent.email})` : ''}
                </p>
                {request.currentAgent && (
                  <p className="mt-1 text-sm text-gray-400">
                    Agent actuel : {request.currentAgent.name}
                    {request.currentAgent.email ? ` (${request.currentAgent.email})` : ''}
                  </p>
                )}
                {request.message && (
                  <p className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">
                    {request.message}
                  </p>
                )}
                {request.verificationDocumentPath && (
                  <a
                    href={`${backendBaseUrl}${request.verificationDocumentPath}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-purple hover:text-brand-cyan"
                  >
                    <FileText className="h-4 w-4" />
                    {request.verificationDocumentOriginalName ?? 'Voir le justificatif'}
                  </a>
                )}
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/admin/player-agent-requests/${request.id}`}
                  className="inline-flex items-center justify-center rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                  aria-label="Voir les détails"
                >
                  <Eye />
                </Link>
                <button
                  type="button"
                  onClick={() => handleDecision(request.id, 'reject')}
                  className="rounded-full bg-red-500/80 p-2 text-white transition-colors hover:bg-red-500"
                  aria-label="Refuser la demande"
                >
                  <X />
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision(request.id, 'approve')}
                  className="rounded-full bg-green-500/80 p-2 text-white transition-colors hover:bg-green-500"
                  aria-label="Valider la demande"
                >
                  <Check />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function readError(data: unknown, fallback: string): string {
  if (data && typeof data === 'object') {
    const message = (data as { errorMessage?: unknown; message?: unknown }).errorMessage
      ?? (data as { message?: unknown }).message;

    if (typeof message === 'string') {
      return message;
    }
  }

  return fallback;
}

export default PlayerAgentRequestsList;
