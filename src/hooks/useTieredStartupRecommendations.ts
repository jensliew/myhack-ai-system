"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { onSnapshot, query, where, collection } from "firebase/firestore";

import { useAuth } from "@/hooks/useAuth";
import { db } from "@/firebase/config";
import {
  getTieredStartupRecommendations,
  type TieredStartupRecommendation,
  type TieredStartupsResult,
} from "@/services/ai/tiered-startup-recommendations.service";
import type { ServiceError } from "@/types/common.types";

const empty: TieredStartupsResult = {
  previousCollaborations: [],
  aiSuggested: [],
  expressedInterest: [],
};

const CACHE_KEY = "nexora_tiered_recs_mentor";

function getCachedTiers(): TieredStartupsResult | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {}
  return null;
}

function setCachedTiers(tiers: TieredStartupsResult) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(tiers));
  } catch {}
}

function clearCachedTiers() {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {}
}

export function useTieredStartupRecommendations() {
  const { user } = useAuth();
  const [tiers, setTiers] = useState<TieredStartupsResult>(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ServiceError | null>(null);
  const [hasUpdates, setHasUpdates] = useState(false);
  const hasFetchedRef = useRef(false);

  const fetchTiers = useCallback(async (force = false) => {
    if (!user || user.role !== "mentor") return;

    // Check cache first (unless forced refresh)
    if (!force) {
      const cached = getCachedTiers();
      if (cached) {
        setTiers(cached);
        hasFetchedRef.current = true;
        return;
      }
    }

    setLoading(true);
    setError(null);
    setHasUpdates(false);

    const result = await getTieredStartupRecommendations(user.entityId);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    const data = result.data ?? empty;
    setTiers(data);
    setCachedTiers(data);
    hasFetchedRef.current = true;
    setLoading(false);
  }, [user]);

  // Fetch only once per session (on first mount)
  useEffect(() => {
    if (!hasFetchedRef.current) {
      fetchTiers();
    }
  }, [fetchTiers]);

  // Listen for new startups being added
  useEffect(() => {
    if (!user || user.role !== "mentor") return;

    const q = query(collection(db, "startups"));

    let isFirst = true;
    const unsubscribe = onSnapshot(q, () => {
      if (isFirst) {
        isFirst = false;
        return;
      }
      if (hasFetchedRef.current) {
        setHasUpdates(true);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const removeFromTier = useCallback(
    (startupId: string, tier: keyof TieredStartupsResult) => {
      setTiers((prev) => {
        const updated = {
          ...prev,
          [tier]: prev[tier].filter((r) => r.startupId !== startupId),
        };
        setCachedTiers(updated);
        return updated;
      });
    },
    []
  );

  const refresh = useCallback(() => {
    clearCachedTiers();
    fetchTiers(true);
  }, [fetchTiers]);

  return {
    tiers,
    loading,
    error,
    hasUpdates,
    refresh,
    removeFromTier,
  };
}

export type { TieredStartupRecommendation };
