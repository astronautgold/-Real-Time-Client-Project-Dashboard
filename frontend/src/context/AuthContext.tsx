import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, setAccessToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await api.post('/auth/refresh');
        if (res.data.success) {
          const { accessToken, user: userData } = res.data.data;
          setToken(accessToken);
          setAccessToken(accessToken);
          setUser(userData);
        }
      } catch (err) {
        setUser(null);
        setToken(null);
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const handleLogoutEvent = () => {
      setUser(null);
      setToken(null);
      setAccessToken(null);
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { accessToken, user: userData } = res.data.data;
      setToken(accessToken);
      setAccessToken(accessToken);
      setUser(userData);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setToken(null);
      setAccessToken(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
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
