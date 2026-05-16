import { createStore } from "zustand";

import type { UserDocument } from "@/types/user.types";
import type { ServiceError } from "@/types/common.types";

/**
 * Auth store state and actions.
 * Follows Zustand v5 per-request store pattern for Next.js SSR safety.
 */
export interface AuthState {
  user: UserDocument | null;
  loading: boolean;
  error: ServiceError | null;
}

export interface AuthActions {
  setUser: (user: UserDocument | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: ServiceError | null) => void;
  clearError: () => void;
}

export type AuthStore = AuthState & AuthActions;

export const defaultAuthState: AuthState = {
  user: null,
  loading: true,
  error: null,
};

/**
 * Creates a new auth store instance.
 * Each request/render gets its own store to avoid SSR hydration issues.
 */
export function createAuthStore(initState: AuthState = defaultAuthState) {
  return createStore<AuthStore>()((set) => ({
    ...initState,
    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
  }));
}

export type AuthStoreApi = ReturnType<typeof createAuthStore>;
