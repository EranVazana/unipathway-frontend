// src/context/AuthContext.jsx

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authService } from '../services/authService';

const STORAGE_KEY = 'unipathway_user';

const AuthContext = createContext(null);

function readStoredUser() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme || 'light');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  // Apply theme whenever the user changes (login, register, settings save, page load)
  useEffect(() => {
    applyTheme(user?.theme);
  }, [user?.theme]);

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
    return data.user;
  }, []);

  const register = useCallback(async (firstName, lastName, username, email, password) => {
    const data = await authService.register(firstName, lastName, username, email, password);
    setUser(data.user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
      applyTheme('light');
    }
  }, []);

  // Called by BasicSettingsView after a successful settings save
  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}