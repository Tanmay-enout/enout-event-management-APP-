'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/auth-api';
import { AUTH_CONFIG } from '@/lib/auth-config';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  email: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === 'undefined') return;
      
      const token = localStorage.getItem(AUTH_CONFIG.tokenKey);
      const storedEmail = localStorage.getItem(AUTH_CONFIG.adminEmailKey);
      
      if (token && storedEmail) {
        setIsAuthenticated(true);
        setEmail(storedEmail);
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const response = await authApi.login({ email, password });
      
      // Store tokens and email
      localStorage.setItem(AUTH_CONFIG.tokenKey, response.accessToken);
      localStorage.setItem(AUTH_CONFIG.refreshTokenKey, response.refreshToken);
      localStorage.setItem(AUTH_CONFIG.adminEmailKey, email);
      
      setIsAuthenticated(true);
      setEmail(email);
      
      // Redirect to dashboard
      router.push('/events');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear all auth data
    localStorage.removeItem(AUTH_CONFIG.tokenKey);
    localStorage.removeItem(AUTH_CONFIG.refreshTokenKey);
    localStorage.removeItem(AUTH_CONFIG.adminEmailKey);
    
    setIsAuthenticated(false);
    setEmail(null);
    
    // Redirect to login
    router.push('/login');
  };

  const value: AuthContextValue = {
    isAuthenticated,
    isLoading,
    email,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
