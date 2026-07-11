import type { User } from "@/context/AuthProvider";
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

type MessageResponse = {
  message: string;
}

export type SupportSession = {active:boolean;user?:{id:string;name:string;email:string};admin?:{id:string;name:string;email:string}|null;message?:string}



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

  async startSupportSession(email:string){return httpClient.get<SupportSession>(`/auth/support-session?_switch_user=${encodeURIComponent(email)}`)}
  async supportSession(){return httpClient.get<SupportSession>('/auth/support-session')}
  async stopSupportSession(){return httpClient.get<SupportSession>('/auth/support-session?_switch_user=_exit')}

  async logout(){
    const response = await httpClient.remove("/auth/logout");
    return response;
  }

  async forgotPassword(email: string){
    const response = await httpClient.post<MessageResponse>("/auth/forgot-password", { email });
    return response;
  }

  async resetPassword(token: string, data: { newPassword: string; newPasswordConfirm: string }){
    const response = await httpClient.patch<MessageResponse>(
      `/auth/reset-password?token=${encodeURIComponent(token)}`,
      data,
    );
    return response;
  }

}

export const authManager = new AuthManager();
