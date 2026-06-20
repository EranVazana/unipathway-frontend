import { createContext, useContext, useState, useCallback } from 'react';
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      // Backend is stateless on logout, but always clear local state regardless of the call's outcome
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    login,
    logout
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
