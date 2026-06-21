'use client'
import { authManager } from '@/features/auth/auth';
import React, { ReactNode, useContext, useEffect, useState } from 'react'
import { createContext } from "react";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  agencyName?: string | null;
  subscriptionPlan?: 'club_free' | 'club_pro' | 'club_enterprise' | 'agent_free' | 'agent_pro';
  hasClubAccess: boolean;
  clubName: string | null;
  clubLogoUrl: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  updateUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);


interface AuthProviderProps {
  children: ReactNode;
}

function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  function updateUser(user: User | null) {
    setUser(user);
  }
  
  useEffect(() => {
    async function fetchMe(){
      try {
        const meResponse = await authManager.me();
        if(meResponse.ok) {
          setUser(meResponse.data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l’intérieur d’un AuthProvider');
  }
  return context;
}

export default AuthProvider
