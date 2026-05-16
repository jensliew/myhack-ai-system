"use client";

import { useState, useEffect, useCallback } from "react";

import { useAuth } from "@/hooks/useAuth";
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

export function useTieredStartupRecommendations() {
  const { user } = useAuth();
  const [tiers, setTiers] = useState<TieredStartupsResult>(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ServiceError | null>(null);

  const fetchTiers = useCallback(async () => {
    if (!user || user.role !== "mentor") return;

    setLoading(true);
    setError(null);

    const result = await getTieredStartupRecommendations(user.entityId);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setTiers(result.data ?? empty);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  const removeFromTier = useCallback(
    (startupId: string, tier: keyof TieredStartupsResult) => {
      setTiers((prev) => ({
        ...prev,
        [tier]: prev[tier].filter((r) => r.startupId !== startupId),
      }));
    },
    []
  );

  return {
    tiers,
    loading,
    error,
    refresh: fetchTiers,
    removeFromTier,
  };
}

export type { TieredStartupRecommendation };
