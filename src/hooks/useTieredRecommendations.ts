"use client";

import { useState, useEffect, useCallback } from "react";

import { useAuth } from "@/hooks/useAuth";
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

export function useTieredRecommendations() {
  const { user } = useAuth();
  const [tiers, setTiers] = useState<TieredRecommendationsResult>(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ServiceError | null>(null);

  const fetchTiers = useCallback(async () => {
    if (!user || user.role !== "startup") return;

    setLoading(true);
    setError(null);

    const result = await getTieredRecommendations(user.entityId);

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
    (mentorId: string, tier: keyof TieredRecommendationsResult) => {
      setTiers((prev) => ({
        ...prev,
        [tier]: prev[tier].filter((r) => r.mentorId !== mentorId),
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

export type { TieredMentorRecommendation };
