import httpClient from "../api";

export interface AgentOrClubUser {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  agentProfile?: {

  },
  clubProfiles?: {

  }[]
}

interface AgentAndClubUserResponse {
  users: AgentOrClubUser[];
}

class UsersManager {
  async getAgentAndClubUsers() {
    const response = await httpClient.get<AgentAndClubUserResponse>("/users/agents-and-clubs");
    return response;
  }
}

export const usersManager = new UsersManager();