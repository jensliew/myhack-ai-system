"use client";

import { useState, useEffect } from "react";
import { getDocs, query, where } from "firebase/firestore";
import { History, Star, Calendar, TrendingUp, MessageSquare, Target } from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/hooks/useAuth";
import { relationshipsCollection } from "@/firebase/collections";
import { getMentorById } from "@/services/firebase/firestore.service";
import { formatDate, formatScore } from "@/lib/formatters";
import type { RelationshipRecord } from "@/types/matching.types";
import type { MentorDocument } from "@/types/mentor.types";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CompletedRelationship {
  relationship: RelationshipRecord;
  mentor: MentorDocument;
}

export default function StartupHistoryPage() {
  const { user } = useAuth();
  const [completed, setCompleted] = useState<CompletedRelationship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user || user.role !== "startup") return;
      const q = query(
        relationshipsCollection,
        where("startupId", "==", user.entityId),
        where("status", "==", "completed")
      );
      const snapshot = await getDocs(q);
      const rels = await Promise.all(
        snapshot.docs.map(async (d) => {
          const rel = { ...d.data(), id: d.id } as RelationshipRecord;
          const mentorResult = await getMentorById(rel.mentorId);
          return mentorResult.data ? { relationship: rel, mentor: mentorResult.data } : null;
        })
      );
      setCompleted(rels.filter(Boolean) as CompletedRelationship[]);
      setLoading(false);
    }
    load();
  }, [user?.entityId]);

  const totalMeetings = completed.reduce((s, r) => s + r.relationship.meetingCount, 0);
  const avgEngagement = completed.length > 0
    ? Math.round(completed.reduce((s, r) => s + r.relationship.engagementScore, 0) / completed.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mentorship History</h1>
        <p className="mt-1 text-muted-foreground">Your completed mentorship relationships.</p>
      </div>

      {/* Summary */}
      {!loading && completed.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-card px-4 py-3 flex items-center gap-3">
            <History className="h-8 w-8 text-muted-foreground/50" />
            <div><p className="text-2xl font-bold">{completed.length}</p><p className="text-xs text-muted-foreground">Completed</p></div>
          </div>
          <div className="rounded-lg border bg-card px-4 py-3 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-blue-500/50" />
            <div><p className="text-2xl font-bold">{avgEngagement}%</p><p className="text-xs text-muted-foreground">Avg Engagement</p></div>
          </div>
          <div className="rounded-lg border bg-card px-4 py-3 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-purple-500/50" />
            <div><p className="text-2xl font-bold">{totalMeetings}</p><p className="text-xs text-muted-foreground">Total Meetings</p></div>
          </div>
        </div>
      )}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6 space-y-3">
              <Skeleton className="h-5 w-32" /><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-full" />
            </CardContent></Card>
          ))}
        </div>
      )}

      {!loading && completed.length === 0 && (
        <div className="rounded-md border border-dashed px-4 py-12 text-center">
          <History className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="font-medium text-muted-foreground">No completed mentorships yet</p>
          <p className="text-sm text-muted-foreground mt-1">Completed mentorships will appear here.</p>
          <Link href="/startup/mentors" className="mt-4 inline-block">
            <Button size="sm" variant="outline">View Active Mentors</Button>
          </Link>
        </div>
      )}

      {!loading && completed.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {completed.map(({ relationship, mentor }) => (
            <Card key={relationship.id} className="opacity-90 hover:opacity-100 transition-opacity">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{mentor.name}</CardTitle>
                  <Badge className="bg-gray-100 text-gray-700 text-xs">Completed</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {mentor.expertise.slice(0, 2).map((exp) => (
                    <Badge key={exp} variant="secondary" className="text-xs">{exp}</Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div className="flex justify-between"><span>Engagement</span><span className="font-medium text-foreground">{formatScore(relationship.engagementScore)}</span></div>
                  <div className="flex justify-between"><span>Meetings</span><span className="font-medium text-foreground">{relationship.meetingCount}</span></div>
                  <div className="flex justify-between"><span>Started</span><span>{formatDate(relationship.createdAt)}</span></div>
                  <div className="flex justify-between"><span>Completed</span><span>{formatDate((relationship as any).completedAt)}</span></div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Link href={`/feedback/${relationship.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs">
                      <Star className="h-3.5 w-3.5" /> Feedback
                    </Button>
                  </Link>
                  <Link href={`/milestones/${relationship.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs">
                      <Target className="h-3.5 w-3.5" /> Milestones
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
