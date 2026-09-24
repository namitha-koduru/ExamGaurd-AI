/**
 * ExamGuard AI - Authentication & Role Context
 * Real JWT-backed auth with graceful role-switching
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string, role: string) => Promise<void>;
  logout: () => void;
  switchUserRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('examguard_token') || localStorage.getItem('smartexam_token')
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initUser() {
      const storedToken = localStorage.getItem('examguard_token') || localStorage.getItem('smartexam_token');
      if (storedToken) {
        try {
          const res = await api.getMe();
          if (res && res.user) {
            setUser(res.user);
            setToken(storedToken);
          } else {
            logout();
          }
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    }

    initUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('examguard_token', res.token);
  };

  const register = async (name: string, email: string, pass: string, role: string) => {
    const res = await api.register(name, email, pass, role);
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('examguard_token', res.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('examguard_token');
    localStorage.removeItem('smartexam_token');
  };

  const switchUserRole = async (targetRole: UserRole) => {
    try {
      if (targetRole === 'STUDENT') {
        await login('alex.student@smartexam.edu', 'password123');
      } else if (targetRole === 'EXAMINER') {
        await login('elena.examiner@smartexam.edu', 'password123');
      } else {
        await login('examiner@university.edu', 'password123');
      }
    } catch (err) {
      console.warn('Role switch login error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        switchUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
