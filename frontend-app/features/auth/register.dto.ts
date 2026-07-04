export type RegisterDTO = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmation?: string;
  roles?: string[];
  agencyName?: string;
  country?: string;
  subscriptionPlan?: 'club_free' | 'club_pro' | 'club_enterprise' | 'agent_free' | 'agent_pro';
  jobTitle?: string;
  professionalContact?: string;
  invitationToken?: string;
}
