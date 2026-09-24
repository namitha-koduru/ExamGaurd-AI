/**
 * ExamGuard AI - Authentication & Multi-Tenant Role Context
 * Real JWT-backed auth with institutional isolation and role-switching
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Institution } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (
    email: string,
    pass: string,
    institutionId?: string,
    institutionRegistrationId?: string
  ) => Promise<void>;
  register: (
    name: string,
    email: string,
    pass: string,
    role: string,
    institutionId?: string,
    studentId?: string,
    employeeId?: string
  ) => Promise<void>;
  registerInstitution: (data: {
    name: string;
    registrationId: string;
    type: string;
    country: string;
    domain?: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
  }) => Promise<{ institution: Institution; user: User; token: string }>;
  logout: () => void;
  switchUserRole: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('examguard_token') || localStorage.getItem('smartexam_token')
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
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
  };

  useEffect(() => {
    async function initUser() {
      await refreshUser();
      setIsLoading(false);
    }

    initUser();
  }, []);

  const login = async (
    email: string,
    pass: string,
    institutionId?: string,
    institutionRegistrationId?: string
  ) => {
    const res = await api.login(email, pass, institutionId, institutionRegistrationId);
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('examguard_token', res.token);
  };

  const register = async (
    name: string,
    email: string,
    pass: string,
    role: string,
    institutionId?: string,
    studentId?: string,
    employeeId?: string
  ) => {
    const res = await api.register(name, email, pass, role, institutionId, studentId, employeeId);
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('examguard_token', res.token);
  };

  const registerInstitution = async (data: {
    name: string;
    registrationId: string;
    type: string;
    country: string;
    domain?: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
  }) => {
    const res = await api.registerInstitution(data);
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('examguard_token', res.token);
    return res;
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
        registerInstitution,
        logout,
        switchUserRole,
        refreshUser,
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
