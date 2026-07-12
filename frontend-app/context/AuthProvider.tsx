'use client'
import { authManager } from '@/features/auth/auth';
import { usePathname } from 'next/navigation';
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
  twoFactorEnabled?: boolean;
  passwordExpired?: boolean;
  googleConnected?: boolean;
  banned?: boolean;
  banExpiresAt?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  updateUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);


interface AuthProviderProps {
  children: ReactNode;
  initialUser?: User | null;
}

function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const pathname = usePathname()
  const shouldSkipInitialFetch = pathname.startsWith('/auth')
  const hasInitialUser = Boolean(initialUser)
  const [user, setUser] = useState<User | null>(() => initialUser ?? null);
  const [isLoading, setIsLoading] = useState(!shouldSkipInitialFetch && !hasInitialUser);
  
  function updateUser(user: User | null) {
    setUser(user);
  }
  
  useEffect(() => {
    if (shouldSkipInitialFetch) {
      setIsLoading(false)
      return
    }

    if (initialUser) {
      setUser(initialUser)
      setIsLoading(false)
      return
    }

    async function fetchMe(){
      try {
        setIsLoading(true);
        const meResponse = await authManager.me();
        if(meResponse.ok && meResponse.data) {
          setUser(meResponse.data);
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUser(null)
      } finally {
        setIsLoading(false);
      }
    }
    fetchMe();
  }, [initialUser, shouldSkipInitialFetch]);

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
