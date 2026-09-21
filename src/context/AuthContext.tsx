import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserProfile } from '../types.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  theme: 'light' | 'dark';
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string, stream: string, year: number) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile> & { name?: string; email?: string }) => Promise<void>;
  completeOnboarding: (data: Partial<UserProfile>) => Promise<void>;
  toggleTheme: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Apply dark class to document (default to dark night blue)
  useEffect(() => {
    const savedTheme = localStorage.getItem('najah_theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('najah_theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const refreshUser = async () => {
    const token = api.getToken();
    if (!token) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
      setProfile(data.profile || null);
    } catch {
      api.clearToken();
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setUser(res.user);
    setProfile(res.profile || null);
  };

  const register = async (name: string, email: string, pass: string, stream: string, year: number) => {
    const res = await api.register(name, email, pass, stream, year);
    setUser(res.user);
    setProfile(res.profile);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<UserProfile> & { name?: string; email?: string }) => {
    const res = await api.updateProfile(updates);
    setUser(res.user);
    setProfile(res.profile);
  };

  const completeOnboarding = async (data: Partial<UserProfile>) => {
    const res = await api.updateOnboarding(data);
    setProfile(res.profile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        theme,
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
        completeOnboarding,
        toggleTheme,
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
