"use client";

import { useState, useEffect, useCallback } from "react";
import { getDocs, query, where } from "firebase/firestore";

import {
  usersCollection,
  startupsCollection,
  mentorsCollection,
  relationshipsCollection,
} from "@/firebase/collections";

export interface EcosystemMetrics {
  totalStartups: number;
  totalMentors: number;
  totalUsers: number;
  pendingApplications: number;
  activeRelationships: number;
}

/**
 * Hook for fetching ecosystem analytics data from Firestore.
 */
export function useAnalytics() {
  const [metrics, setMetrics] = useState<EcosystemMetrics>({
    totalStartups: 0,
    totalMentors: 0,
    totalUsers: 0,
    pendingApplications: 0,
    activeRelationships: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const [startupsSnap, mentorsSnap, usersSnap, pendingSnap, relSnap] =
        await Promise.all([
          getDocs(startupsCollection),
          getDocs(mentorsCollection),
          getDocs(usersCollection),
          getDocs(query(usersCollection, where("profileStatus", "==", "pending"))),
          getDocs(query(relationshipsCollection, where("status", "==", "active"))),
        ]);

      setMetrics({
        totalStartups: startupsSnap.size,
        totalMentors: mentorsSnap.size,
        totalUsers: usersSnap.size,
        pendingApplications: pendingSnap.size,
        activeRelationships: relSnap.size,
      });
    } catch {
      // Silently fail — metrics will show 0
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, refresh: fetchMetrics };
}
