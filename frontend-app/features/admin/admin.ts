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

class AdminManager {
  async getClubPendingRequests(limit?: number) {
    const response = await httpClient.get<PendingClubRequestResponse>(`/admin/club-requests/pending${limit ? `?limit=${limit}` : ''}`);
    return response;
  }

  async approveClubRequest(requestId: string) {
    const response = await httpClient.put<ApproveClubRequestResponse>(`/admin/club-requests/approve/${requestId}`, {});
    return response;
  }
}

export const adminManager = new AdminManager();