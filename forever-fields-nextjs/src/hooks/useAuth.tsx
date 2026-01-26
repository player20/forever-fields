"use client";

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import {
  getSupabaseClient,
  signInWithMagicLink,
  signInWithPassword,
  signUp as supabaseSignUp,
  signInWithGoogle,
  signOut as supabaseSignOut,
  getSession,
  getCurrentUser,
  resetPassword as supabaseResetPassword,
  updatePassword,
  syncUserProfile,
  onAuthStateChange,
} from "@/lib/supabase";
import type { User, SubscriptionTier } from "@/lib/supabase/types";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";

// User type that matches what the rest of the app expects
export interface AppUser {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  subscriptionTier?: SubscriptionTier;
}

interface AuthState {
  user: AppUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  requestMagicLink: (email: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (newPassword: string) => Promise<void>;
  clearError: () => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Convert Supabase user to our app user format
function toAppUser(supabaseUser: SupabaseUser | null, profile?: User | null): AppUser | null {
  if (!supabaseUser) return null;

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || "",
    name: profile?.first_name
      ? `${profile.first_name}${profile.last_name ? " " + profile.last_name : ""}`
      : supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name,
    firstName: profile?.first_name || supabaseUser.user_metadata?.first_name,
    lastName: profile?.last_name || supabaseUser.user_metadata?.last_name,
    avatarUrl: profile?.avatar_url || supabaseUser.user_metadata?.avatar_url,
    subscriptionTier: profile?.subscription_tier || "free",
  };
}

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

  // Fetch session and user profile
  const refreshSession = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const supabaseUser = await getCurrentUser();

      if (supabaseUser) {
        // Sync/get user profile from our users table
        const profile = await syncUserProfile(supabaseUser);
        const appUser = toAppUser(supabaseUser, profile);

        setState({
          user: appUser,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } else {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
      }
    } catch {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
    }
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    // Initial session check
    refreshSession();

    // Subscribe to auth changes
    const subscription = onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const profile = await syncUserProfile(session.user);
        const appUser = toAppUser(session.user, profile);
        setState({
          user: appUser,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } else if (event === "SIGNED_OUT") {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        // Just refresh the session data
        const profile = await syncUserProfile(session.user);
        const appUser = toAppUser(session.user, profile);
        setState((prev) => ({
          ...prev,
          user: appUser,
        }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshSession]);

  // Login with email and password
  const login = async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const result = await signInWithPassword(email, password);

      if (!result.success) {
        throw new Error(result.error || "Login failed");
      }

      if (result.user) {
        const profile = await syncUserProfile(result.user);
        const appUser = toAppUser(result.user, profile);
        setState({
          user: appUser,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
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

      // Split name into first and last
      const nameParts = name?.trim().split(" ") || [];
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || undefined;

      const result = await supabaseSignUp(email, password, { firstName, lastName });

      if (!result.success) {
        throw new Error(result.error || "Registration failed");
      }

      // Note: User may need to confirm email before being fully logged in
      if (result.user && result.session) {
        const profile = await syncUserProfile(result.user);
        const appUser = toAppUser(result.user, profile);
        setState({
          user: appUser,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } else {
        // Email confirmation required
        setState((prev) => ({
          ...prev,
          isLoading: false,
        }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
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
      await supabaseSignOut();
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
    } catch {
      // Even if logout fails, clear local state
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
    }
  };

  // Request magic link (passwordless)
  const requestMagicLink = async (email: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const result = await signInWithMagicLink(email);

      if (!result.success) {
        throw new Error(result.error || "Failed to send magic link");
      }

      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send magic link";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw err;
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const result = await signInWithGoogle();

      if (!result.success) {
        throw new Error(result.error || "Google login failed");
      }

      // OAuth redirects, so we don't update state here
      // The auth state change listener will handle it after redirect
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google login failed";
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

      const result = await supabaseResetPassword(email);

      if (!result.success) {
        throw new Error(result.error || "Failed to send reset email");
      }

      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send reset email";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw err;
    }
  };

  // Reset password (when user has reset link)
  const resetPasswordHandler = async (newPassword: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const result = await updatePassword(newPassword);

      if (!result.success) {
        throw new Error(result.error || "Failed to reset password");
      }

      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset password";
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
    loginWithGoogle,
    requestPasswordReset,
    resetPassword: resetPasswordHandler,
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
      window.location.href = redirectTo;
    }
  }, [auth.isLoading, auth.isAuthenticated, redirectTo]);

  return auth;
}
