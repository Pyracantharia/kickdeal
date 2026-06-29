import { User } from "@/context/AuthProvider";
import httpClient from "../api";
import { LoginDTO } from "./login.dto";
import { RegisterDTO } from "./register.dto";

type LoginResponse = {
  message: string;
  user: User;
  requiresTwoFactor?: boolean;
}

type RegisterResponse = {
  message: string;
  user: User;
}



class AuthManager {

  async login(credentials: LoginDTO){
    const response = await httpClient.post<LoginResponse>("/auth/login", credentials);
    return response;
  }

  async register(data: RegisterDTO){
    const { ...registerData } = data;
    const response = await httpClient.post<RegisterResponse>("/auth/register", registerData);
    return response;
  }

  async me(){
    const response = await httpClient.get<User>("/auth/me");
    return response;
  }

  async logout(){
    const response = await httpClient.remove("/auth/logout");
    return response;
  }

}

export const authManager = new AuthManager();
