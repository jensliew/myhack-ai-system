"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { getDocs, query, where } from "firebase/firestore";

import {
  expressInterest,
} from "@/services/matching/interest.service";
import { mentorInterestsCollection } from "@/firebase/collections";
import { useAuth } from "@/hooks/useAuth";

/**
 * Hook for managing mentor interest expression.
 * Tracks which startups the current mentor has expressed interest in.
 * Loads existing interests from Firestore on mount.
 */
export function useMatching() {
  const { user } = useAuth();
  const [interestedMap, setInterestedMap] = useState<Record<string, boolean>>(
    {}
  );
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  // Load all existing interests for this mentor on mount
  useEffect(() => {
    async function loadExistingInterests() {
      if (!user || user.role !== "mentor") return;

      try {
        const q = query(
          mentorInterestsCollection,
          where("mentorId", "==", user.entityId)
        );
        const snapshot = await getDocs(q);

        const existingMap: Record<string, boolean> = {};
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          existingMap[data.startupId] = true;
        });

        setInterestedMap(existingMap);
      } catch {
        // Silently fail — buttons will remain clickable
      }
    }

    loadExistingInterests();
  }, [user]);

  /**
   * Express interest in a startup.
   */
  const handleExpressInterest = useCallback(
    async (startupId: string) => {
      if (!user || user.role !== "mentor") return;

      setLoadingMap((prev) => ({ ...prev, [startupId]: true }));

      const result = await expressInterest(
        user.entityId,
        startupId,
        user.id
      );

      setLoadingMap((prev) => ({ ...prev, [startupId]: false }));

      if (result.error) {
        if (result.error.code === "interest/already-exists") {
          setInterestedMap((prev) => ({ ...prev, [startupId]: true }));
        } else {
          toast.error(result.error.message);
        }
        return;
      }

      setInterestedMap((prev) => ({ ...prev, [startupId]: true }));
      toast.success("Interest expressed successfully!");
    },
    [user]
  );

  /**
   * Check if a specific startup has been marked as interested.
   */
  const isInterested = useCallback(
    (startupId: string) => !!interestedMap[startupId],
    [interestedMap]
  );

  /**
   * Check if a specific startup interest action is loading.
   */
  const isLoading = useCallback(
    (startupId: string) => !!loadingMap[startupId],
    [loadingMap]
  );

  return {
    handleExpressInterest,
    isInterested,
    isLoading,
  };
}
