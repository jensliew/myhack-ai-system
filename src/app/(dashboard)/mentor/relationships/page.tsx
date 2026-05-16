"use client";

import { useState, useEffect, useCallback } from "react";
import { getDocs, query, where } from "firebase/firestore";
import { Briefcase } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { relationshipsCollection } from "@/firebase/collections";
import { getStartupById } from "@/services/firebase/firestore.service";
import { formatDate, formatScore } from "@/lib/formatters";
import type { RelationshipRecord } from "@/types/matching.types";
import type { StartupDocument } from "@/types/startup.types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RelationshipWithStartup {
  relationship: RelationshipRecord;
  startup: StartupDocument;
}

export default function MentorRelationshipsPage() {
  const { user } = useAuth();
  const [relationships, setRelationships] = useState<RelationshipWithStartup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRelationships = useCallback(async () => {
    if (!user || user.role !== "mentor") return;

    setLoading(true);
    try {
      const q = query(
        relationshipsCollection,
        where("mentorId", "==", user.entityId),
        where("status", "==", "active")
      );
      const snapshot = await getDocs(q);

      const rels = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const rel = { ...docSnap.data(), id: docSnap.id } as RelationshipRecord;
          const startupResult = await getStartupById(rel.startupId);
          return startupResult.data ? { relationship: rel, startup: startupResult.data } : null;
        })
      );

      setRelationships(rels.filter(Boolean) as RelationshipWithStartup[]);
    } catch {
      // Silently fail
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchRelationships();
  }, [fetchRelationships]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Relationships</h1>
        <p className="mt-1 text-muted-foreground">
          Your active mentorship engagements with startups.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {!loading && relationships.length === 0 && (
        <div className="rounded-md border border-dashed px-4 py-8 text-center">
          <Briefcase className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground">No active relationships yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Express interest in startups to get started.
          </p>
        </div>
      )}

      {!loading && relationships.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {relationships.map(({ relationship, startup }) => (
            <Card key={relationship.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{startup.name}</CardTitle>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="default" className="text-xs">{startup.industry}</Badge>
                  <Badge variant="secondary" className="text-xs">{startup.stage}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Engagement Score</span>
                  <span className="font-medium text-foreground">
                    {formatScore(relationship.engagementScore)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Meetings</span>
                  <span className="font-medium text-foreground">{relationship.meetingCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Since</span>
                  <span>{formatDate(relationship.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Source</span>
                  <Badge variant="outline" className="text-xs">
                    {relationship.source === "ai_recommendation" ? "AI Match" : "Your Interest"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
