"use client";

import { useState, useEffect } from "react";
import { onSnapshot, query, where } from "firebase/firestore";
import { Briefcase, MessageSquare, Target, Star, CheckCircle2, TrendingUp, Calendar } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { relationshipsCollection } from "@/firebase/collections";
import { getStartupById } from "@/services/firebase/firestore.service";
import { completeRelationship } from "@/services/matching/matching.service";
import { formatDate, formatScore } from "@/lib/formatters";
import type { RelationshipRecord } from "@/types/matching.types";
import type { StartupDocument } from "@/types/startup.types";
import { Skeleton } from "@/components/ui/skeleton";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

interface RelationshipWithStartup {
  relationship: RelationshipRecord;
  startup: StartupDocument;
}

function RelationshipHealth({ score, meetings }: { score: number; meetings: number }) {
  if (score >= 70 && meetings >= 2) return <Badge className="bg-green-100 text-green-800 text-xs">Excellent</Badge>;
  if (score >= 40 || meetings >= 1) return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Growing</Badge>;
  return <Badge className="bg-red-100 text-red-800 text-xs">Needs Attention</Badge>;
}

export default function MentorRelationshipsPage() {
  const { user } = useAuth();
  const [relationships, setRelationships] = useState<RelationshipWithStartup[]>([]);
  const [loading, setLoading] = useState(true);
  const [completeDialog, setCompleteDialog] = useState<{ open: boolean; relId: string; startupName: string }>({ open: false, relId: "", startupName: "" });
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "mentor") return;

    const q = query(
      relationshipsCollection,
      where("mentorId", "==", user.entityId),
      where("status", "==", "active")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const rels = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const rel = { ...docSnap.data(), id: docSnap.id } as RelationshipRecord;
          const startupResult = await getStartupById(rel.startupId);
          return startupResult.data ? { relationship: rel, startup: startupResult.data } : null;
        })
      );
      setRelationships(rels.filter(Boolean) as RelationshipWithStartup[]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.entityId, user?.role]);

  async function handleComplete() {
    if (!completeDialog.relId) return;
    setCompleting(true);
    const result = await completeRelationship(completeDialog.relId);
    if (result.error) { toast.error(result.error.message); setCompleting(false); return; }
    toast.success("Mentorship completed! Don't forget to leave feedback.");
    setCompleteDialog({ open: false, relId: "", startupName: "" });
    setCompleting(false);
  }

  const avgEngagement = relationships.length > 0
    ? Math.round(relationships.reduce((s, r) => s + r.relationship.engagementScore, 0) / relationships.length)
    : 0;
  const totalMeetings = relationships.reduce((s, r) => s + r.relationship.meetingCount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Relationships</h1>
        <p className="mt-1 text-muted-foreground">Your active mentorship engagements with startups.</p>
      </div>

      {/* Summary */}
      {!loading && relationships.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-card px-4 py-3 flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-muted-foreground/50" />
            <div><p className="text-2xl font-bold">{relationships.length}</p><p className="text-xs text-muted-foreground">Active Mentorships</p></div>
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
              <Skeleton className="h-5 w-32" /><Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" /><Skeleton className="h-8 w-full" />
            </CardContent></Card>
          ))}
        </div>
      )}

      {!loading && relationships.length === 0 && (
        <div className="rounded-md border border-dashed px-4 py-12 text-center">
          <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="font-medium text-muted-foreground">No active relationships yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Express interest in startups to get started.</p>
        </div>
      )}

      {!loading && relationships.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {relationships.map(({ relationship, startup }) => (
            <Card key={relationship.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{startup.name}</CardTitle>
                  <RelationshipHealth score={relationship.engagementScore} meetings={relationship.meetingCount} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="default" className="text-xs">{startup.industry}</Badge>
                  <Badge variant="secondary" className="text-xs">{startup.stage}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Engagement bar */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Engagement</span>
                    <span className="font-medium">{formatScore(relationship.engagementScore)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className={`h-full transition-all duration-700 ${relationship.engagementScore >= 70 ? "bg-green-500" : relationship.engagementScore >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                      style={{ width: `${relationship.engagementScore}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div className="flex justify-between"><span>Meetings</span><span className="font-medium text-foreground">{relationship.meetingCount}</span></div>
                  <div className="flex justify-between"><span>Since</span><span className="text-foreground">{formatDate(relationship.createdAt)}</span></div>
                </div>

                {startup.goals && startup.goals.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {startup.goals.slice(0, 2).map((g) => <Badge key={g} variant="outline" className="text-xs">{g}</Badge>)}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link href={`/messages/${relationship.id}`}>
                    <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs">
                      <MessageSquare className="h-3.5 w-3.5" /> Message
                    </Button>
                  </Link>
                  <Link href={`/milestones/${relationship.id}`}>
                    <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs">
                      <Target className="h-3.5 w-3.5" /> Milestones
                    </Button>
                  </Link>
                  <Link href={`/feedback/${relationship.id}`}>
                    <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs">
                      <Star className="h-3.5 w-3.5" /> Feedback
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-1.5 text-xs text-green-700 border-green-300 hover:bg-green-50"
                    onClick={() => setCompleteDialog({ open: true, relId: relationship.id, startupName: startup.name })}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Complete Dialog */}
      <Dialog open={completeDialog.open} onOpenChange={(o) => !o && setCompleteDialog({ open: false, relId: "", startupName: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Mentorship with {completeDialog.startupName}?</DialogTitle>
            <DialogDescription>
              This will mark the mentorship as completed. You'll still be able to view history and leave feedback. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteDialog({ open: false, relId: "", startupName: "" })}>Cancel</Button>
            <Button onClick={handleComplete} disabled={completing} className="gap-2">
              {completing && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              Complete Mentorship
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
