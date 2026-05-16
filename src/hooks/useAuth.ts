"use client";

import { useCallback } from "react";

import { useAuthStore } from "@/providers/auth-provider";
import {
  register,
  login,
  logout,
} from "@/services/firebase/auth.service";
import type { UserRole } from "@/types/user.types";
import type { ServiceError } from "@/types/common.types";

/**
 * Hook providing auth state and action functions.
 * Wraps the Zustand auth store and auth service layer.
 *
 * Must be used within an AuthProvider.
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const setError = useAuthStore((s) => s.setError);
  const clearError = useAuthStore((s) => s.clearError);

  // Derived state
  const isAuthenticated = user !== null;
  const role = user?.role ?? null;

  const handleRegister = useCallback(
    async (
      email: string,
      password: string,
      userRole: UserRole,
      entityId: string
    ) => {
      setLoading(true);
      clearError();

      const result = await register(email, password, userRole, entityId);

      if (result.error) {
        setError(result.error as ServiceError);
        setLoading(false);
        return { success: false, error: result.error };
      }

      // onAuthChange listener will update the user in the store
      setLoading(false);
      return { success: true, error: null };
    },
    [setLoading, setError, clearError]
  );

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      clearError();

      const result = await login(email, password);

      if (result.error) {
        setError(result.error as ServiceError);
        setLoading(false);
        return { success: false, error: result.error, user: null };
      }

      // Set user directly from login result for immediate access
      if (result.data) {
        setUser(result.data);
      }
      setLoading(false);
      return { success: true, error: null, user: result.data };
    },
    [setUser, setLoading, setError, clearError]
  );

  const handleLogout = useCallback(async () => {
    setLoading(true);
    clearError();

    const result = await logout();

    if (result.error) {
      setError(result.error as ServiceError);
      setLoading(false);
      return { success: false, error: result.error };
    }

    // onAuthChange listener will set user to null
    setLoading(false);
    return { success: true, error: null };
  }, [setLoading, setError, clearError]);

  return {
    // State
    user,
    loading,
    error,
    isAuthenticated,
    role,

    // Actions
    handleRegister,
    handleLogin,
    handleLogout,
    clearError,
  };
}
