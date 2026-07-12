import httpClient from "../api";

export interface AgentOrClubUser {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  agentProfile?: object | null,
  clubProfiles?: object[]
}

interface AgentAndClubUserResponse {
  users: AgentOrClubUser[];
}

class UsersManager {
  async getAgentAndClubUsers() {
    const response = await httpClient.get<AgentAndClubUserResponse>("/users/agents-and-clubs");
    if (Array.isArray(response.data)) {
      return {
        ...response,
        data: {
          users: response.data,
        },
      };
    }

    return response;
  }
}

export const usersManager = new UsersManager();
