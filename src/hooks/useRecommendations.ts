"use client";

import { useState, useEffect, useCallback } from "react";

import { getRecommendations } from "@/services/ai/recommendations.service";
import { useAuth } from "@/hooks/useAuth";
import type { AIRecommendation } from "@/types/ai.types";
import type { ServiceError } from "@/types/common.types";

/**
 * Hook for fetching AI-generated mentor recommendations for the current startup.
 * Manages loading, error, and data states with manual refresh support.
 */
export function useRecommendations() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ServiceError | null>(null);

  const fetchRecommendations = useCallback(async () => {
    if (!user || user.role !== "startup") return;

    setLoading(true);
    setError(null);

    const result = await getRecommendations(user.entityId, user.id);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.data) {
      setRecommendations(result.data);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  /**
   * Remove a recommendation from the local list (after accept/reject).
   */
  const removeRecommendation = useCallback((mentorId: string) => {
    setRecommendations((prev) =>
      prev.filter((rec) => rec.mentorId !== mentorId)
    );
  }, []);

  return {
    recommendations,
    loading,
    error,
    refresh: fetchRecommendations,
    removeRecommendation,
  };
}
