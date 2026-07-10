import httpClient from "../api";

export type ClubRequest = {
  id: string;
  requester: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
  };
  team: {
    id: string;
    name: string;
    country?: string | null;
    league?: string | null;
    logoUrl?: string | null;
    transferBudget?: number | null;
    verificationStatus?: string | null;
  };
  status: 'pending' | 'approved' | 'rejected';
  verificationEmail?: string | null;
  verificationMessage?: string | null;
  verificationDocumentPath?: string | null;
  verificationDocumentOriginalName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PendingClubRequestResponse {
  pendingRequests: ClubRequest[];
}

export interface ClubRequestDetailResponse {
  request: ClubRequest;
}

export interface ApproveClubRequestResponse {
  message: string;
  approvedClubRequest: {
    id: string;
    teamId: string;
    status: boolean;
  }
}

export interface ClubRequestDecisionResponse {
  message: string;
  request: ClubRequest;
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
    photoUrl?: string | null;
    position?: string | null;
    nationality?: string | null;
    birthDate?: string | null;
    marketValue?: number | null;
    contractStatus?: string | null;
    marketStatus?: string | null;
    team?: {
      id: string;
      name: string;
      country?: string | null;
      league?: string | null;
      logoUrl?: string | null;
    } | null;
  };
  requestingAgent?: {
    id: string;
    name: string;
    email?: string | null;
    country?: string | null;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      phone?: string | null;
    } | null;
  } | null;
  currentAgent?: {
    id: string;
    name: string;
    email?: string | null;
    country?: string | null;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      phone?: string | null;
    } | null;
  } | null;
}

export interface PendingPlayerAgentRequestResponse {
  pendingRequests: PlayerAgentRequest[];
}

export interface PlayerAgentRequestDetailResponse {
  request: PlayerAgentRequest;
}

export interface PlayerAgentRequestDecisionResponse {
  message: string;
  request: PlayerAgentRequest;
}

export type AdminUserRole = 'ROLE_ADMIN' | 'ROLE_AGENT' | 'ROLE_CLUB';

export type AdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: AdminUserRole[];
  phone?: string | null;
  twoFactorEnabled: boolean;
  passwordExpired: boolean;
  banned: boolean;
  bannedUntil?: string | null;
  banReason?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type AdminUserPayload = {
  firstName: string;
  lastName: string;
  email: string;
  roles: AdminUserRole[];
  password?: string;
}

export interface AdminUsersResponse {
  users: AdminUser[];
}

export interface AdminUserMutationResponse {
  message: string;
  user: AdminUser;
}

export interface AdminUserDeleteResponse {
  message: string;
}

export type MessageReportStatus = 'pending' | 'warned' | 'banned' | 'dismissed';

export type MessageReportUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  banned: boolean;
  bannedUntil?: string | null;
}

export type MessageReport = {
  id: string;
  status: MessageReportStatus;
  reason?: string | null;
  messageContent: string;
  adminComment?: string | null;
  createdAt?: string | null;
  decidedAt?: string | null;
  banUntil?: string | null;
  message?: {
    id: string;
    createdAt?: string | null;
  } | null;
  conversation?: {
    id: string;
  } | null;
  reporter?: MessageReportUser | null;
  reportedUser?: MessageReportUser | null;
  decidedBy?: MessageReportUser | null;
}

export interface MessageReportsResponse {
  reports: MessageReport[];
}

export interface MessageReportDecisionResponse {
  message: string;
  report: MessageReport;
}

export type AdminDashboardAlert = {
  id: 'club_requests' | 'player_agent_requests' | 'message_reports';
  title: string;
  count: number;
  oldestCreatedAt?: string | null;
  ageInDays: number;
  severity: 'info' | 'warning' | 'critical';
  href: string;
}

export type AdminDashboardData = {
  stats: {
    totalUsers: number;
    newUsersLast30Days: number;
    pendingValidations: number;
    currentlyBannedUsers: number;
  };
  alerts: AdminDashboardAlert[];
  generatedAt: string;
}

export type AdminClub = {
  id: string; name: string; country?: string | null; league?: string | null; logoUrl?: string | null;
  transferBudget: number; verificationStatus: 'pending' | 'unverified' | 'verified';
  playersCount: number;
  members: Array<{ id: string; firstName: string; lastName: string; email: string; phone?: string | null; role: 'club_manager' | 'recruiter' | 'sporting_director' | 'staff'; primary: boolean }>;
}

export type AdminPlayer = {
  id:string; firstName:string; lastName:string; photoUrl?:string|null; birthDate?:string|null; nationality?:string|null; position:string;
  heightCm?:number|null; weightKg?:number|null; preferredFoot?:string|null; marketValue?:number|null; weeklySalary?:number|null; releaseClause?:number|null;
  contractStatus:'free_agent'|'under_contract'; contractEndDate?:string|null; joinedAt?:string|null; marketStatus:'loan_listed'|'not_listed'|'on_market';
  availabilityStatus:'injured'|'normal'|'suspended'; team:{id:string;name:string}|null; agent:{id:string;name:string}|null;
}

export type AdminAgent = {
  id: string; agencyName?: string | null; country?: string | null;
  user: { firstName: string; lastName: string; email: string };
  license: { number: string; issuedBy?: string | null; validUntil?: string | null; documentUrl?: string | null; status: 'pending' | 'approved' | 'rejected' } | null;
  players: Array<{ id: string; firstName: string; lastName: string; position?: string | null; team?: string | null }>;
}

class AdminManager {
  async getDashboard() {
    return httpClient.get<AdminDashboardData>('/admin/dashboard');
  }

  async getClubs() { return httpClient.get<{ clubs: AdminClub[] }>('/admin/clubs'); }
  async updateClub(id: string, payload: Omit<AdminClub, 'id' | 'members' | 'playersCount'>) { return httpClient.put<{ message: string; club: AdminClub }, Omit<AdminClub, 'id' | 'members' | 'playersCount'>>(`/admin/clubs/${id}`, payload); }
  async updateClubMember(teamId: string, memberId: string, payload: Partial<AdminClub['members'][number]>) { return httpClient.patch<{ message: string }>(`/admin/clubs/${teamId}/members/${memberId}`, payload); }
  async removeClubMember(teamId: string, memberId: string) { return httpClient.remove<{ message: string }>(`/admin/clubs/${teamId}/members/${memberId}`); }
  async getClubMembers(teamId:string) { return httpClient.get<{club:{id:string;name:string;logoUrl?:string|null};members:AdminClub['members']}>(`/admin/clubs/${teamId}/members`); }
  async getClubPlayers(teamId:string) { return httpClient.get<{club:{id:string;name:string;logoUrl?:string|null};players:AdminPlayer[]}>(`/admin/clubs/${teamId}/players`); }
  async updatePlayer(playerId:string, payload:Omit<AdminPlayer,'id'|'team'|'agent'> & {teamId?:string|null;agentId?:string|null}) { return httpClient.put<{message:string;player:AdminPlayer}, typeof payload>(`/admin/players/${playerId}`,payload); }
  async getAgents() { return httpClient.get<{ agents: AdminAgent[] }>('/admin/agents'); }
  async updateAgentLicense(agentId: string, status: NonNullable<AdminAgent['license']>['status']) { return httpClient.patch<{ message: string }>(`/admin/agents/${agentId}/license`, { status }); }
  async removeAgentPlayer(agentId: string, playerId: string) { return httpClient.remove<{ message: string }>(`/admin/agents/${agentId}/players/${playerId}`); }

  async getUsers(search?: string) {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await httpClient.get<AdminUsersResponse>(`/admin/users${query}`);
    return response;
  }

  async createUser(payload: AdminUserPayload) {
    const response = await httpClient.post<AdminUserMutationResponse, AdminUserPayload>('/admin/users', payload);
    return response;
  }

  async updateUser(userId: string, payload: AdminUserPayload) {
    const response = await httpClient.put<AdminUserMutationResponse, AdminUserPayload>(`/admin/users/${userId}`, payload);
    return response;
  }

  async deleteUser(userId: string) {
    const response = await httpClient.remove<AdminUserDeleteResponse>(`/admin/users/${userId}`);
    return response;
  }

  async unbanUser(userId: string) {
    const response = await httpClient.post<AdminUserMutationResponse>(`/admin/users/${userId}/unban`, {});
    return response;
  }

  async getMessageReports(status: MessageReportStatus | 'all' = 'pending') {
    const response = await httpClient.get<MessageReportsResponse>(`/admin/message-reports?status=${encodeURIComponent(status)}`);
    return response;
  }

  async warnMessageReport(reportId: string, comment?: string) {
    const response = await httpClient.post<MessageReportDecisionResponse>(`/admin/message-reports/${reportId}/warn`, { comment: comment ?? '' });
    return response;
  }

  async banMessageReport(reportId: string, payload: { durationDays: number; comment?: string }) {
    const response = await httpClient.post<MessageReportDecisionResponse>(`/admin/message-reports/${reportId}/ban`, payload);
    return response;
  }

  async getClubPendingRequests(limit?: number) {
    const response = await httpClient.get<PendingClubRequestResponse>(`/admin/club-requests/pending${limit ? `?limit=${limit}` : ''}`);
    return response;
  }

  async getClubRequest(requestId: string) {
    const response = await httpClient.get<ClubRequestDetailResponse>(`/admin/club-requests/${requestId}`);
    return response;
  }

  async approveClubRequest(requestId: string) {
    const response = await httpClient.put<ApproveClubRequestResponse>(`/admin/club-requests/approve/${requestId}`, {});
    return response;
  }

  async rejectClubRequest(requestId: string) {
    const response = await httpClient.put<ClubRequestDecisionResponse>(`/admin/club-requests/reject/${requestId}`, {});
    return response;
  }

  async getPendingPlayerAgentRequests(limit?: number) {
    const response = await httpClient.get<PendingPlayerAgentRequestResponse>(`/admin/player-agent-requests/pending${limit ? `?limit=${limit}` : ''}`);
    return response;
  }

  async getPlayerAgentRequest(requestId: string) {
    const response = await httpClient.get<PlayerAgentRequestDetailResponse>(`/admin/player-agent-requests/${requestId}`);
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
