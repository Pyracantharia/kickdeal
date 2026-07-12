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

export type AdminMarketData = {
  listings:Array<{id:string;status:'active'|'paused'|'closed';transferType:string;askingPrice?:number|null;createdAt?:string|null;player:{id:string;name:string;photoUrl?:string|null;marketStatus?:string|null};sellerTeam:{id:string;name:string;logoUrl?:string|null}}>;
  offers:Array<{id:string;status:'pending'|'accepted'|'rejected'|'expired';kind:string;amount?:number|null;validUntil?:string|null;createdAt?:string|null;author?:string|null;player:string;sellerTeam?:string|null;buyerTeam?:string|null}>;
  transfers:Array<{id:string;status:string;createdAt?:string|null;updatedAt?:string|null;publicFeedEnabled:boolean;offersCount:number;player:string;sellerTeam?:string|null;buyerTeam?:string|null}>;
}

export type AdminNegotiationsData = {
  transfers:AdminMarketData['transfers'];
  contracts:Array<{id:string;type:'transfer'|'renewal'|'termination';status:string;createdAt?:string|null;updatedAt?:string|null;publicFeedEnabled:boolean;player:{id:string;name:string;team?:string|null};club:{id:string;name:string};agent:{id:string;name:string};offersCount:number;packagesCount:number;latestOffer:{status:string;annualSalary?:number|null;terminationCompensation?:number|null;durationMonths?:number|null;validUntil?:string|null}|null}>;
  generatedAt:string;
  staleAfterDays:number;
}

export type AdminFeedPost={id:string;eventType:string;bucket:'live'|'official';sourceType:string;isFeatured:boolean;isVisible:boolean;publishedAt:string;headline:string;body:string;playerName?:string|null;amount?:number|null;currency:string;league?:string|null;country?:string|null;sellerTeam?:{name:string;logoUrl?:string|null}|null;buyerTeam?:{name:string;logoUrl?:string|null}|null;createdAt?:string|null;updatedAt?:string|null}
export type AdminFeedPayload=Omit<AdminFeedPost,'id'|'sourceType'|'sellerTeam'|'buyerTeam'|'createdAt'|'updatedAt'>
export type AdminSubscriptionUser={id:string;firstName:string;lastName:string;email:string;accountType:'agent'|'club';plan:string;planLabel:string;stripeCustomerId?:string|null;stripeSubscriptionId?:string|null;createdAt?:string|null}
export type AdminChilizPayment={id:string;userId:string;userEmail:string;provider:'chiliz'|'stripe';txHash:string;planType:string;amountChz:string;status:'pending'|'confirmed'|'rejected';chainId:number;confirmedAt?:string|null;createdAt?:string|null}
export type AdminStripeInvoice={id:string;status:string;amountDue:number;amountPaid:number;currency:string;createdAt:string;hostedInvoiceUrl?:string|null}
export type AdminSubscriptionsData={users:AdminSubscriptionUser[];chilizPayments:AdminChilizPayment[];plans:Array<{value:string;label:string;accountType:'agent'|'club'}>}
export type AdminAuditLog={id:string;admin:{name:string;email:string};action:string;category:string;target:{type:string;id?:string|null;label:string};changes:Record<string,{before:unknown;after:unknown}>;context:Record<string,unknown>;createdAt:string}
export type AdminReferenceItem={id:string;type:'league'|'country'|'position'|'plan'|'business_parameter';code:string;label:string;value:Record<string,unknown>;active:boolean;usageCount:number}
export type AdminReferenceData={references:Record<AdminReferenceItem['type'],AdminReferenceItem[]>;clubsUrl:string}

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
  async getMarket() { return httpClient.get<AdminMarketData>('/admin/market'); }
  async updateMarketListing(id:string,status:'active'|'paused'|'closed') { return httpClient.patch<{message:string}>(`/admin/market/listings/${id}`,{status}); }
  async moderateMarketOffer(id:string,status:'rejected'|'expired') { return httpClient.patch<{message:string}>(`/admin/market/offers/${id}`,{status}); }
  async moderateMarketTransfer(id:string,status:'rejected'|'expired') { return httpClient.patch<{message:string}>(`/admin/market/transfers/${id}`,{status}); }
  async getNegotiations() { return httpClient.get<AdminNegotiationsData>('/admin/negotiations'); }
  async updateTransferNegotiation(id:string,status:'open'|'rejected'|'expired') { return httpClient.patch<{message:string}>(`/admin/negotiations/transfers/${id}`,{status}); }
  async updateContractNegotiation(id:string,status:'open'|'rejected'|'expired') { return httpClient.patch<{message:string}>(`/admin/negotiations/contracts/${id}`,{status}); }
  async getAdminFeed(){return httpClient.get<{posts:AdminFeedPost[];eventTypes:string[]}>('/admin/public-feed')}
  async createAdminFeedPost(payload:AdminFeedPayload){return httpClient.post<{message:string;post:AdminFeedPost},AdminFeedPayload>('/admin/public-feed',payload)}
  async updateAdminFeedPost(id:string,payload:AdminFeedPayload){return httpClient.put<{message:string;post:AdminFeedPost},AdminFeedPayload>(`/admin/public-feed/${id}`,payload)}
  async updateAdminFeedVisibility(id:string,isVisible:boolean){return httpClient.patch<{message:string}>(`/admin/public-feed/${id}/visibility`,{isVisible})}
  async getSubscriptions(){return httpClient.get<AdminSubscriptionsData>('/admin/subscriptions')}
  async changeUserPlan(id:string,plan:string){return httpClient.patch<{message:string;user:AdminSubscriptionUser}>(`/admin/subscriptions/users/${id}/plan`,{plan})}
  async getStripeInvoices(id:string){return httpClient.get<{invoices:AdminStripeInvoice[]}>(`/admin/subscriptions/users/${id}/stripe-invoices`)}
  async getAuditLogs(filters?:{category?:string;search?:string}){const q=new URLSearchParams();if(filters?.category)q.set('category',filters.category);if(filters?.search)q.set('search',filters.search);return httpClient.get<{logs:AdminAuditLog[]}>(`/admin/audit?${q}`)}
  async getReferenceData(){return httpClient.get<AdminReferenceData>('/admin/reference-data')}
  async createReferenceItem(payload:{type:string;code:string;label:string;value?:Record<string,unknown>}){return httpClient.post<{message:string}>('/admin/reference-data',payload)}
  async updateReferenceItem(id:string,payload:Pick<AdminReferenceItem,'code'|'label'|'value'|'active'>){return httpClient.put<{message:string}>(`/admin/reference-data/${id}`,payload)}
  async deleteReferenceItem(id:string){return httpClient.remove<{message:string}>(`/admin/reference-data/${id}`)}

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
