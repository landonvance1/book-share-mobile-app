import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginRequest, RegisterRequest } from '../types/auth';
import { authService } from '../services/authService';
import { queryClient } from '../lib/queryClient';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedUser = await authService.getUser();
      const token = await authService.getToken();

      if (storedUser && token) {
        setUser(storedUser);
      }
    } catch {
      // Silently fail - user will remain logged out
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      const authResponse = await authService.login(credentials);
      await authService.storeTokens(authResponse);
      setUser(authResponse.user);
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      const authResponse = await authService.register(userData);
      await authService.storeTokens(authResponse);
      setUser(authResponse.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.clearTokens();
      setUser(null);
      // Clear React Query cache to prevent data leakage between users
      queryClient.clear();
    } catch {
      // Silently fail - user state is cleared regardless
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};