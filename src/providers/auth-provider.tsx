"use client";

import {
  createContext,
  useContext,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { useStore } from "zustand";

import {
  createAuthStore,
  type AuthStore,
  type AuthStoreApi,
} from "@/stores/auth.store";
import { onAuthChange } from "@/services/firebase/auth.service";

const AuthStoreContext = createContext<AuthStoreApi | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth provider that creates a per-request Zustand store and syncs
 * Firebase auth state via onAuthChange listener.
 *
 * Follows the Zustand Next.js pattern:
 * - Uses useRef to avoid recreating the store on re-renders
 * - Creates context so child components can access the store
 * - Sets up onAuthChange listener on mount to keep store in sync
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const storeRef = useRef<AuthStoreApi | null>(null);

  if (storeRef.current === null) {
    storeRef.current = createAuthStore();
  }

  useEffect(() => {
    const store = storeRef.current;
    if (!store) return;

    // Set loading while we wait for the initial auth state
    store.getState().setLoading(true);

    const unsubscribe = onAuthChange((user) => {
      store.getState().setUser(user);
      store.getState().setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <AuthStoreContext.Provider value={storeRef.current}>
      {children}
    </AuthStoreContext.Provider>
  );
}

/**
 * Hook to access the auth store from context.
 * Must be used within an AuthProvider.
 */
export function useAuthStore<T>(selector: (state: AuthStore) => T): T {
  const store = useContext(AuthStoreContext);

  if (!store) {
    throw new Error("useAuthStore must be used within an AuthProvider");
  }

  return useStore(store, selector);
}
