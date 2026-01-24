"use client";

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { authApi, User, ApiError } from "@/lib/api/client";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  requestMagicLink: (email: string) => Promise<void>;
  verifyMagicLink: (token: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  clearError: () => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  const setError = (error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  };

  const clearError = () => setError(null);

  // Fetch session on mount
  const refreshSession = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const { user } = await authApi.getSession();
      setState({
        user,
        isLoading: false,
        isAuthenticated: !!user,
        error: null,
      });
    } catch {
      // Session check failed - user is not authenticated
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null, // Don't show error for failed session check
      });
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // Login with email and password
  const login = async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const { user } = await authApi.login(email, password);
      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Login failed";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw err;
    }
  };

  // Register new account
  const register = async (email: string, password: string, name?: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const { user } = await authApi.register({ email, password, name });
      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Registration failed";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw err;
    }
  };

  // Logout
  const logout = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      await authApi.logout();
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
    } catch {
      // Even if logout fails on server, clear local state
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
    }
  };

  // Request magic link
  const requestMagicLink = async (email: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      await authApi.requestMagicLink(email);
      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to send magic link";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw err;
    }
  };

  // Verify magic link
  const verifyMagicLink = async (token: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const { user } = await authApi.verifyMagicLink(token);
      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Invalid or expired link";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw err;
    }
  };

  // Request password reset
  const requestPasswordReset = async (email: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      await authApi.requestPasswordReset(email);
      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to send reset email";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw err;
    }
  };

  // Reset password
  const resetPassword = async (token: string, newPassword: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      await authApi.resetPassword(token, newPassword);
      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to reset password";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw err;
    }
  };

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    requestMagicLink,
    verifyMagicLink,
    requestPasswordReset,
    resetPassword,
    clearError,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Hook for protecting routes - redirects to login if not authenticated
 */
export function useRequireAuth(redirectTo: string = "/login") {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      // Client-side redirect
      window.location.href = redirectTo;
    }
  }, [auth.isLoading, auth.isAuthenticated, redirectTo]);

  return auth;
}
