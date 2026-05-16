import { create } from "zustand";

/**
 * Filter state for startup discovery and dashboard views.
 */
export interface FilterState {
  industry: string | null;
  stage: string | null;
  fundingStage: string | null;
}

/**
 * UI store state.
 */
export interface UIState {
  sidebarOpen: boolean;
  activeFilters: FilterState;
  searchQuery: string;
}

/**
 * UI store actions.
 */
export interface UIActions {
  toggleSidebar: () => void;
  setFilters: (filters: FilterState) => void;
  setSearchQuery: (query: string) => void;
}

export type UIStore = UIState & UIActions;

const defaultFilters: FilterState = {
  industry: null,
  stage: null,
  fundingStage: null,
};

/**
 * Zustand UI store for client-side dashboard state.
 * Uses create() directly since this is purely client-side UI state
 * that doesn't need SSR safety or per-request isolation.
 */
export const useUIStore = create<UIStore>()((set) => ({
  sidebarOpen: true,
  activeFilters: defaultFilters,
  searchQuery: "",
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setFilters: (filters) => set({ activeFilters: filters }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
