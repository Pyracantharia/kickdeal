'use client';
import { adminManager, ClubRequest } from '@/features/admin/admin';
import { traductStatus } from '@/shared/shared';
import { Check, X } from 'lucide-react';
import Link from 'next/link';
import React from 'react'

interface ClubRequestsListProps {
  select: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';
}

function ClubRequestsList({ select }: ClubRequestsListProps) {

  const [requestsList, setRequestsList] = React.useState<ClubRequest[] | null>(null);

  const fetchPendingClubRequests = React.useCallback(async () => {
    try {
      const response = await adminManager.getClubPendingRequests();
      if(response.ok) {
        setRequestsList(response.data.pendingRequests);
      } else {
        console.error('Failed to fetch pending club requests:', response);
      }
    } catch (error) {
      console.error('Error fetching pending club requests:', error);
    }
  }, []);

  React.useEffect(() => {
    if(select === 'PENDING') void fetchPendingClubRequests();
  }, [fetchPendingClubRequests, select]);



  async function handleApproveRequest(requestId: string) {
    try {
      const response = await adminManager.approveClubRequest(requestId);
      if(response.ok) {
        // Update the local state to reflect the approved request
        setRequestsList((prevList) => prevList ? prevList.map(req => req.id === requestId ? { ...req, status: 'approved' } : req) : prevList);
      } else {
        console.error('Failed to approve club request:', response);
      }
    } catch (error) {
      console.error('Error approving club request:', error);
    }
  }

  async function handleRejectRequest(requestId: string) {
    try {
      const response = await adminManager.rejectClubRequest(requestId);
      if(response.ok) {
        setRequestsList((prevList) => prevList ? prevList.map(req => req.id === requestId ? { ...req, status: 'rejected' } : req) : prevList);
      } else {
        console.error('Failed to reject club request:', response);
      }
    } catch (error) {
      console.error('Error rejecting club request:', error);
    }
  }

  return (
    <>
      {
        requestsList === null ? (
          <p className="text-gray-400">Chargement des demandes de club...</p>
        ) : requestsList.length === 0 ? (
          <p className="text-gray-400">Aucune demande de création de club en attente.</p>
        ) : (
          <ul className="space-y-4">
            {requestsList.map((request) => (
              <li key={request.id} className="relative border border-gray-700 rounded-lg p-4 bg-[#0A1B2B]/50 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{request.team.name}</h3>
                  <p className="text-gray-400">Demandé par: {request.requester.firstName} {request.requester.lastName} ({request.requester.email})</p>
                  <p className={`text-sm font-medium ${request.status === 'pending' ? 'text-yellow-400' : request.status === 'approved' ? 'text-green-400' : 'text-red-400'}`}>
                    Statut: {traductStatus(request.status)}
                  </p>
                </div>

                {/* actions */}
                <div>
                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleApproveRequest(request.id)}
                        className="cursor-pointer rounded-full bg-green-500/80 p-2 text-white transition-colors hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
                        aria-label="Accepter la demande"
                      >
                        <Check />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRejectRequest(request.id)}
                        className="cursor-pointer rounded-full bg-red-500/80 p-2 text-white transition-colors hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                        aria-label="Refuser la demande"
                      >
                        <X />
                      </button>
                    </div>
                  )}
                </div>
                <Link
                  href={`/admin/club-requests/${request.id}`}
                  className="absolute bottom-2 right-2 text-sm underline font-medium text-white transition-colors hover:opacity-80 focus:outline-none "
                >
                  Voir les détails
                </Link>
              </li>
            ))}
          </ul>
        )
      }
    
    </>
  )
}

export default ClubRequestsList
