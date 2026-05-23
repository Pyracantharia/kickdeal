export type RegisterDTO = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roles?: string[];
  subscriptionPlan?: 'club_free' | 'club_pro' | 'club_enterprise' | 'agent_free' | 'agent_pro';
}