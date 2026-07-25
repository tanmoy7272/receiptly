/**
 * ============================================================================
 * Authentication Context & Session Provider (React Context API)
 * ============================================================================
 * Purpose: Manages user authentication state (`user`, `isAuthenticated`),
 *          initial session verification via `/auth/me`, login, register, logout,
 *          and registers a global 401 unauthorized handler with apiClient.
 * Context Flow: AuthProvider -> useAuth() Hook -> React Components
 * ============================================================================
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { setUnauthorizedHandler } from '../services/apiClient';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const clearUserSession = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  const handleSessionExpired = (message) => {
    clearUserSession();
    toast.error(message || 'Session expired. Please sign in again.');
  };

  useEffect(() => {
    setUnauthorizedHandler(handleSessionExpired);
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const data = await authService.getMe();
      if (data?.user) {
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        clearUserSession();
      }
    } catch (error) {
      clearUserSession();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    if (data?.user) {
      setUser(data.user);
      setIsAuthenticated(true);
    }
    return data;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    if (data?.user) {
      setUser(data.user);
      setIsAuthenticated(true);
    }
    return data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      clearUserSession();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        checkAuth,
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
