"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { onSnapshot, query, where, collection } from "firebase/firestore";

import { useAuth } from "@/hooks/useAuth";
import { db } from "@/firebase/config";
import {
  getTieredRecommendations,
  type TieredMentorRecommendation,
  type TieredRecommendationsResult,
} from "@/services/ai/tiered-recommendations.service";
import type { ServiceError } from "@/types/common.types";

const empty: TieredRecommendationsResult = {
  previousCollaborations: [],
  aiSuggested: [],
  interested: [],
};

const CACHE_KEY = "nexora_tiered_recs_startup";

function getCachedTiers(): TieredRecommendationsResult | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {}
  return null;
}

function setCachedTiers(tiers: TieredRecommendationsResult) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(tiers));
  } catch {}
}

function clearCachedTiers() {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {}
}

export function useTieredRecommendations() {
  const { user } = useAuth();
  const [tiers, setTiers] = useState<TieredRecommendationsResult>(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ServiceError | null>(null);
  const [hasUpdates, setHasUpdates] = useState(false);
  const hasFetchedRef = useRef(false);

  const fetchTiers = useCallback(async (force = false) => {
    if (!user || user.role !== "startup") return;

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

    const result = await getTieredRecommendations(user.entityId);

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

  // Listen for changes in mentor_interests collection for this startup
  useEffect(() => {
    if (!user || user.role !== "startup") return;

    const q = query(
      collection(db, "mentor_interests"),
      where("startupId", "==", user.entityId),
      where("status", "==", "pending")
    );

    let isFirst = true;
    const unsubscribe = onSnapshot(q, () => {
      // Skip the initial snapshot (we already have data)
      if (isFirst) {
        isFirst = false;
        return;
      }
      // A new mentor expressed interest — notify user
      if (hasFetchedRef.current) {
        setHasUpdates(true);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const removeFromTier = useCallback(
    (mentorId: string, tier: keyof TieredRecommendationsResult) => {
      setTiers((prev) => {
        const updated = {
          ...prev,
          [tier]: prev[tier].filter((r) => r.mentorId !== mentorId),
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

export type { TieredMentorRecommendation };
