import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE } from '../config/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  initializing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setInitializing(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_BASE}/api/me`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.json())
        .then(u => {
          if (u && u.email) {
            setUser({ id: u.id.toString(), name: u.name, email: u.email, role: u.role, token });
            localStorage.setItem('currentUser', JSON.stringify({ id: u.id.toString(), name: u.name, email: u.email, role: u.role, token }));
          }
        })
        .catch(() => {})
        .finally(() => setInitializing(false));
    } else {
      setInitializing(false);
    }
  }, []);

  const register = async (name: string, email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) });
      if (!res.ok) return false;
      const data = await res.json();
      const userObj = { id: data.user.id.toString(), name: data.user.name, email: data.user.email, role: data.user.role, token: data.token };
      localStorage.setItem('currentUser', JSON.stringify(userObj));
      localStorage.setItem('token', data.token);
      setUser(userObj);
      return true;
    } catch (err) {
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { success: false, message: data.error || 'Invalid credentials' };
      const userObj = { id: data.user.id.toString(), name: data.user.name, email: data.user.email, role: data.user.role, token: data.token };
      localStorage.setItem('currentUser', JSON.stringify(userObj));
      localStorage.setItem('token', data.token);
      setUser(userObj);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user, initializing }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};