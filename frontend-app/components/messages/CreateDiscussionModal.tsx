"use client";
import { Loader2, Search } from 'lucide-react';
import React, { useEffect } from 'react'
import Modal from '../ui/Modal';
import { AgentOrClubUser, usersManager } from '@/features/users/users';
import { DirectConversation, messagesManager } from '@/features/messages/messages';

interface CreateDiscussionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversation: DirectConversation) => void;
}

function CreateDiscussionModal({ isOpen, onClose, onConversationCreated }: CreateDiscussionModalProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [masterAgentsAndClubsList, setMasterAgentsAndClubsList] = React.useState<AgentOrClubUser[] | null>(null);
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function fetchAgentsAndClubs() {
    try {
      const response = await usersManager.getAgentAndClubUsers();
      if (response.ok) {
        setMasterAgentsAndClubsList(response.data.users);
      } else {
        setErrorMessage("Impossible de charger les utilisateurs.");
      }
    } catch {
      setErrorMessage("Impossible de charger les utilisateurs.");
    }
  }

  useEffect(() => {
    if(isOpen) {
      setSearchTerm('');
      setSelectedUserId(null);
      setErrorMessage(null);
      fetchAgentsAndClubs();
    }
  }, [isOpen])

  const filteredUsers = React.useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase('fr')

    if (!masterAgentsAndClubsList) return []
    if (!normalizedSearchTerm) return masterAgentsAndClubsList

    return masterAgentsAndClubsList.filter((user) => {
      const name = `${user.firstname} ${user.lastname}`.toLocaleLowerCase('fr')
      const email = user.email.toLocaleLowerCase('fr')

      return name.includes(normalizedSearchTerm) || email.includes(normalizedSearchTerm)
    })
  }, [masterAgentsAndClubsList, searchTerm])

  async function startConversation(userId: string) {
    setSelectedUserId(userId)
    setErrorMessage(null)

    try {
      const response = await messagesManager.startConversation(userId)

      if (response.ok) {
        onConversationCreated(response.data.conversation)
        return
      }

      setErrorMessage('Impossible de créer la discussion.')
    } catch {
      setErrorMessage('Impossible de créer la discussion.')
    } finally {
      setSelectedUserId(null)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Créer une discussion"
    >
      <div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/60" />
          <input
            type="text"
            placeholder="Rechercher un agent ou un gérant de club..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 pl-12 pr-4 py-3 text-white placeholder-white/40 focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan/50"
          />
        </div>

        {errorMessage && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </p>
        )}

        <div className="mt-5 max-h-96 overflow-y-auto">
          {!masterAgentsAndClubsList && (
            <p className="py-8 text-center text-white/60">Chargement...</p>
          )}

          {masterAgentsAndClubsList && filteredUsers.length === 0 && (
            <p className="py-8 text-center text-white/60">Aucun utilisateur trouvé.</p>
          )}

          <div className="space-y-2">
            {filteredUsers.map((user) => {
              const name = `${user.firstname} ${user.lastname}`
              const isLoading = selectedUserId === user.id

              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => startConversation(user.id)}
                  disabled={Boolean(selectedUserId)}
                  className="flex w-full items-center gap-4 rounded-lg border border-white/10 bg-white/5 p-4 text-left transition-colors hover:border-brand-cyan/50 hover:bg-white/10 disabled:cursor-wait disabled:opacity-60"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-purple text-sm font-bold text-white">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">{name}</p>
                    <p className="truncate text-sm text-white/55">{user.email}</p>
                  </div>
                  {isLoading && <Loader2 className="h-5 w-5 animate-spin text-brand-cyan" />}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default CreateDiscussionModal
