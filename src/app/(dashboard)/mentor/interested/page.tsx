"use client";

import { useState, useEffect, useCallback } from "react";
import { getDocs, query, where } from "firebase/firestore";
import { Heart } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { mentorInterestsCollection } from "@/firebase/collections";
import { getStartupById } from "@/services/firebase/firestore.service";
import { formatDate } from "@/lib/formatters";
import type { InterestRecord } from "@/types/matching.types";
import type { StartupDocument } from "@/types/startup.types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface InterestWithStartup {
  interest: InterestRecord;
  startup: StartupDocument;
}

export default function MentorInterestedPage() {
  const { user } = useAuth();
  const [interests, setInterests] = useState<InterestWithStartup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInterests = useCallback(async () => {
    if (!user || user.role !== "mentor") return;

    setLoading(true);
    try {
      const q = query(
        mentorInterestsCollection,
        where("mentorId", "==", user.entityId),
        where("status", "==", "pending")
      );
      const snapshot = await getDocs(q);

      const rels = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const interest = { ...docSnap.data(), id: docSnap.id } as InterestRecord;
          const startupResult = await getStartupById(interest.startupId);
          return startupResult.data ? { interest, startup: startupResult.data } : null;
        })
      );

      setInterests(rels.filter(Boolean) as InterestWithStartup[]);
    } catch {
      // Silently fail
    }
    setLoading(false);
  }, [user?.entityId, user?.role]);

  useEffect(() => {
    if (!user) return;
    fetchInterests();
  }, [user?.entityId, fetchInterests]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Interested Startups</h1>
        <p className="mt-1 text-muted-foreground">
          Startups you&apos;ve expressed interest in. Waiting for their response.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {!loading && interests.length === 0 && (
        <div className="rounded-md border border-dashed px-4 py-8 text-center">
          <Heart className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground">No pending interests yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Browse startups and express interest to get started.
          </p>
        </div>
      )}

      {!loading && interests.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {interests.map(({ interest, startup }) => (
            <Card key={interest.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{startup.name}</CardTitle>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="default" className="text-xs">{startup.industry}</Badge>
                  <Badge variant="secondary" className="text-xs">{startup.stage}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="line-clamp-2">{startup.description}</p>
                <div className="flex justify-between pt-2 border-t">
                  <span>Status</span>
                  <Badge variant="outline" className="text-xs">Pending</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Expressed</span>
                  <span>{formatDate(interest.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
