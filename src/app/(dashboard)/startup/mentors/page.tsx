"use client";

import { useState, useEffect, useCallback } from "react";
import { getDocs, query, where } from "firebase/firestore";
import { Users } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { relationshipsCollection } from "@/firebase/collections";
import { getMentorById } from "@/services/firebase/firestore.service";
import { formatDate, formatScore } from "@/lib/formatters";
import type { RelationshipRecord } from "@/types/matching.types";
import type { MentorDocument } from "@/types/mentor.types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RelationshipWithMentor {
  relationship: RelationshipRecord;
  mentor: MentorDocument;
}

export default function StartupMentorsPage() {
  const { user } = useAuth();
  const [relationships, setRelationships] = useState<RelationshipWithMentor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRelationships = useCallback(async () => {
    if (!user || user.role !== "startup") return;

    setLoading(true);
    try {
      const q = query(
        relationshipsCollection,
        where("startupId", "==", user.entityId),
        where("status", "==", "active")
      );
      const snapshot = await getDocs(q);

      const rels = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const rel = { ...docSnap.data(), id: docSnap.id } as RelationshipRecord;
          const mentorResult = await getMentorById(rel.mentorId);
          return mentorResult.data ? { relationship: rel, mentor: mentorResult.data } : null;
        })
      );

      setRelationships(rels.filter(Boolean) as RelationshipWithMentor[]);
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
        <h1 className="text-2xl font-bold tracking-tight">My Mentors</h1>
        <p className="mt-1 text-muted-foreground">
          Your active mentorship relationships.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {!loading && relationships.length === 0 && (
        <div className="rounded-md border border-dashed px-4 py-8 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground">No active mentorships yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Accept mentors from your dashboard to start a relationship.
          </p>
        </div>
      )}

      {!loading && relationships.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {relationships.map(({ relationship, mentor }) => (
            <Card key={relationship.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{mentor.name}</CardTitle>
                <div className="flex flex-wrap gap-1.5">
                  {mentor.expertise.slice(0, 2).map((exp) => (
                    <Badge key={exp} variant="secondary" className="text-xs">{exp}</Badge>
                  ))}
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
                    {relationship.source === "ai_recommendation" ? "AI Match" : "Mentor Interest"}
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
