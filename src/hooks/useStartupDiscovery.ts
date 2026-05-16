"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

import { getApprovedStartups } from "@/services/firebase/firestore.service";
import { useUIStore, type FilterState } from "@/stores/ui.store";
import type { StartupDocument } from "@/types/startup.types";
import type { ServiceError } from "@/types/common.types";

/**
 * Pure filtering function for startup discovery.
 * Applies search query and filters with AND logic (all active criteria must match).
 *
 * Exported separately for property-based testing.
 */
export function filterStartups(
  startups: StartupDocument[],
  searchQuery: string,
  filters: FilterState
): StartupDocument[] {
  return startups.filter((startup) => {
    // Search query: case-insensitive match against name OR description
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const nameMatch = startup.name.toLowerCase().includes(query);
      const descMatch = startup.description.toLowerCase().includes(query);
      if (!nameMatch && !descMatch) return false;
    }

    // Industry filter: exact match
    if (filters.industry && startup.industry !== filters.industry) {
      return false;
    }

    // Stage filter: exact match
    if (filters.stage && startup.stage !== filters.stage) {
      return false;
    }

    // Funding stage filter: exact match
    if (filters.fundingStage && startup.fundingStage !== filters.fundingStage) {
      return false;
    }

    return true;
  });
}

/**
 * Hook for startup discovery with search and filter functionality.
 * Fetches startups on mount and applies client-side filtering.
 */
export function useStartupDiscovery() {
  const [allStartups, setAllStartups] = useState<StartupDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ServiceError | null>(null);

  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const filters = useUIStore((s) => s.activeFilters);
  const setFilters = useUIStore((s) => s.setFilters);

  const fetchStartups = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getApprovedStartups(100);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.data) {
      setAllStartups(result.data.startups);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStartups();
  }, [fetchStartups]);

  // Apply client-side filtering
  const startups = useMemo(
    () => filterStartups(allStartups, searchQuery, filters),
    [allStartups, searchQuery, filters]
  );

  return {
    startups,
    allStartups,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    refresh: fetchStartups,
  };
}
