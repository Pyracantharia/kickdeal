"use client";
import { Search } from 'lucide-react';
import React, { useEffect } from 'react'
import Modal from '../ui/Modal';
import { AgentOrClubUser, usersManager } from '@/features/users/users';

interface CreateDiscussionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function CreateDiscussionModal({ isOpen, onClose }: CreateDiscussionModalProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const [masterAgentsAndClubsList, setMasterAgentsAndClubsList] = React.useState<AgentOrClubUser[] | null>(null);

  async function fetchAgentsAndClubs() {
    try {
      const response = await usersManager.getAgentAndClubUsers();
      if (response.ok) {
        console.log(response.data);
        setMasterAgentsAndClubsList(response.data.users);
      } else {
        console.error("Failed to fetch agents and clubs: ", response);
      }
    } catch (error) {
      console.error("Failed to fetch agents and clubs:", error);
    }
  }

  useEffect(() => {
    if(isOpen) {
      fetchAgentsAndClubs();
    }
  }, [isOpen])
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
      </div>
    </Modal>
  )
}

export default CreateDiscussionModal