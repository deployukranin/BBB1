import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { db } from '../services/db';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string, remember: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => db.getUser());

  const login = async (email: string, _pass: string, _remember: boolean): Promise<{ success: boolean; error?: string }> => {
    // Simulação de login amigável
    if (!email.trim()) {
      return { success: false, error: 'Por favor, informe seu e-mail ou usuário.' };
    }
    const loggedUser: User = {
      id: 'usr_admin',
      name: email.split('@')[0] || 'Administrador',
      email: email.includes('@') ? email : `${email}@brisaleve.com`,
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    };

    db.setUser(loggedUser);
    setUser(loggedUser);
    return { success: true };
  };

  const logout = () => {
    db.setUser(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de AuthProvider');
  }
  return context;
};
