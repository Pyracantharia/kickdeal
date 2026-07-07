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
  banned?: boolean;
  banExpiresAt?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  updateUser: (user: User | null) => void;
}

declare global {
  interface Window {
    __INITIAL_AUTH_USER__?: User | null
  }
}

function getInitialAuthUser(): User | null | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  if (Object.prototype.hasOwnProperty.call(window, '__INITIAL_AUTH_USER__')) {
    return window.__INITIAL_AUTH_USER__ ?? null
  }

  return undefined
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);


interface AuthProviderProps {
  children: ReactNode;
  initialUser?: User | null;
}

function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const pathname = usePathname()
  const shouldSkipInitialFetch = pathname.startsWith('/auth')
  const initialWindowUser = getInitialAuthUser()
  const hasInitialUser = initialUser !== undefined || initialWindowUser !== undefined || shouldSkipInitialFetch
  const [user, setUser] = useState<User | null>(() => initialUser ?? initialWindowUser ?? null);
  const [isLoading, setIsLoading] = useState(!hasInitialUser);
  
  function updateUser(user: User | null) {
    setUser(user);
  }
  
  useEffect(() => {
    if (shouldSkipInitialFetch) {
      setIsLoading(false)
      return
    }

    if (hasInitialUser) {
      setIsLoading(false)
      return
    }

    async function fetchMe(){
      try {
        setIsLoading(true);
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
  }, [hasInitialUser, shouldSkipInitialFetch]);

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
