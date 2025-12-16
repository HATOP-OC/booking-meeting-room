import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Seed default admin user if not exists
    const usersStr = localStorage.getItem('users');
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];
    
    if (!users.find(u => u.email === 'admin@example.com')) {
      const defaultAdmin: User = {
        id: 'default-admin',
        name: 'Admin User',
        email: 'admin@example.com',
        password: '123456',
        role: 'admin',
        token: 'admin-token'
      };
      users.push(defaultAdmin);
      localStorage.setItem('users', JSON.stringify(users));
    }
  }, []);

  const register = async (name: string, email: string, password: string) => {
    const usersStr = localStorage.getItem('users');
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];

    if (users.find(u => u.email === email)) {
      return false; // User already exists
    }

    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      password,
      role: email.includes('admin') ? 'admin' : 'user',
      token: `token-${Date.now()}`,
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Auto login
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    setUser(newUser);
    return true;
  };

  const login = async (email: string, password: string) => {
    const usersStr = localStorage.getItem('users');
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];
    
    // Hardcoded check for default admin to ensure access
    if (email === 'admin@example.com' && password === '123456') {
      const defaultAdmin: User = {
        id: 'default-admin',
        name: 'Admin User',
        email: 'admin@example.com',
        password: '123456',
        role: 'admin',
        token: 'admin-token'
      };
      
      // Ensure it exists in storage for future
      if (!users.find(u => u.email === email)) {
        users.push(defaultAdmin);
        localStorage.setItem('users', JSON.stringify(users));
      }

      localStorage.setItem('currentUser', JSON.stringify(defaultAdmin));
      setUser(defaultAdmin);
      return true;
    }

    const foundUser = users.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      localStorage.setItem('currentUser', JSON.stringify(foundUser));
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};