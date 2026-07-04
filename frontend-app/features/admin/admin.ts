import httpClient from "../api";

export type ClubRequest = {
  id: string;
  requester: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  team: {
    id: string;
    name: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  
}

export interface PendingClubRequestResponse {
  pendingRequests: ClubRequest[];
}

export interface ApproveClubRequestResponse {
  message: string;
  approvedClubRequest: {
    id: string;
    teamId: string;
    status: boolean;
  }
}

export type PlayerAgentRequestStatus = 'pending' | 'admin_approved' | 'approved' | 'rejected';
export type PlayerAgentRequestType = 'representation' | 'agent_handover';

export type PlayerAgentRequest = {
  id: string;
  type: PlayerAgentRequestType;
  status: PlayerAgentRequestStatus;
  createdAt: string;
  decidedAt?: string | null;
  message?: string | null;
  verificationDocumentPath?: string | null;
  verificationDocumentOriginalName?: string | null;
  player: {
    id: string;
    firstName: string;
    lastName: string;
  };
  requestingAgent?: {
    id: string;
    name: string;
    email?: string | null;
  } | null;
  currentAgent?: {
    id: string;
    name: string;
    email?: string | null;
  } | null;
}

export interface PendingPlayerAgentRequestResponse {
  pendingRequests: PlayerAgentRequest[];
}

export interface PlayerAgentRequestDecisionResponse {
  message: string;
  request: PlayerAgentRequest;
}

class AdminManager {
  async getClubPendingRequests(limit?: number) {
    const response = await httpClient.get<PendingClubRequestResponse>(`/admin/club-requests/pending${limit ? `?limit=${limit}` : ''}`);
    return response;
  }

  async approveClubRequest(requestId: string) {
    const response = await httpClient.put<ApproveClubRequestResponse>(`/admin/club-requests/approve/${requestId}`, {});
    return response;
  }

  async getPendingPlayerAgentRequests(limit?: number) {
    const response = await httpClient.get<PendingPlayerAgentRequestResponse>(`/admin/player-agent-requests/pending${limit ? `?limit=${limit}` : ''}`);
    return response;
  }

  async approvePlayerAgentRequest(requestId: string) {
    const response = await httpClient.put<PlayerAgentRequestDecisionResponse>(`/admin/player-agent-requests/approve/${requestId}`, {});
    return response;
  }

  async rejectPlayerAgentRequest(requestId: string) {
    const response = await httpClient.put<PlayerAgentRequestDecisionResponse>(`/admin/player-agent-requests/reject/${requestId}`, {});
    return response;
  }
}

export const adminManager = new AdminManager();
