"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { FileText, Users, Upload, CheckCircle2, ArrowRight, RefreshCw, Sparkles, Clock } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useTieredRecommendations } from "@/hooks/useTieredRecommendations";
import type { TieredMentorRecommendation } from "@/hooks/useTieredRecommendations";
import { MentorCard } from "@/components/cards/MentorCard";
import { ProjectPhaseIndicator } from "@/components/ProjectPhaseIndicator";
import { acceptMentor, rejectMentor } from "@/services/matching/matching.service";
import { getMentorById, getStartupById, getActiveRelationships } from "@/services/firebase/firestore.service";
import type { MentorDocument } from "@/types/mentor.types";
import type { ProjectPhase } from "@/types/startup.types";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type TierKey = "previousCollaborations" | "aiSuggested" | "interested";

const tierMeta: Record<TierKey, { title: string; description: string; source: "ai" | "interest"; acceptSource: "ai_recommendation" | "mentor_interest" }> = {
  previousCollaborations: { title: "Previous Collaborations", description: "Mentors with proven track records on the platform", source: "ai", acceptSource: "ai_recommendation" },
  aiSuggested: { title: "AI Suggested Mentors", description: "Recommended based on your startup profile and goals", source: "ai", acceptSource: "ai_recommendation" },
  interested: { title: "Mentors Interested", description: "Mentors who expressed interest in your startup", source: "interest", acceptSource: "mentor_interest" },
};

const phaseGuidance: Record<ProjectPhase, { title: string; description: string; actions: { label: string; href: string; icon: React.ElementType }[] }> = {
  initial: {
    title: "Getting Started — Find Your Mentor",
    description: "Review AI-suggested mentors below and accept one to begin your mentorship journey.",
    actions: [
      { label: "Complete Your Profile", href: "/startup/profile", icon: CheckCircle2 },
    ],
  },
  processing: {
    title: "Active Mentorship — Track Your Progress",
    description: "You have an active mentor. Upload meeting minutes and monthly reports to track engagement.",
    actions: [
      { label: "Upload Meeting Minutes", href: "/startup/documents", icon: Upload },
      { label: "View My Mentors", href: "/startup/mentors", icon: Users },
    ],
  },
  final: {
    title: "Final Phase — Complete Your Evaluation",
    description: "Your mentorship is nearing completion. Submit your feedback to close the program.",
    actions: [
      { label: "View Documents", href: "/startup/documents", icon: FileText },
      { label: "View My Mentors", href: "/startup/mentors", icon: Users },
    ],
  },
};

export default function StartupDashboardPage() {
  const { user } = useAuth();
  const { tiers, loading, error, refresh, removeFromTier, hasUpdates } =
    useTieredRecommendations();

  const [mentorProfiles, setMentorProfiles] = useState<
    Record<string, MentorDocument>
  >({});
  const [actionLoading, setActionLoading] = useState<Record<string, string>>(
    {}
  );
  const [projectPhase, setProjectPhase] = useState<ProjectPhase>("initial");
  const [activeMentorIds, setActiveMentorIds] = useState<Set<string>>(new Set());
  const activeMentorCount = activeMentorIds.size;

  // Fetch active mentor IDs to exclude from matching UI
  const fetchActiveMentorIds = useCallback(async () => {
    if (!user || user.role !== "startup") return;
    const result = await getActiveRelationships(user.entityId);
    if (result.data) {
      setActiveMentorIds(new Set(result.data.map((r) => r.mentorId)));
    }
  }, [user]);

  // Fetch project phase
  useEffect(() => {
    async function fetchPhase() {
      if (!user || user.role !== "startup") return;
      const result = await getStartupById(user.entityId);
      if (result.data?.projectPhase) {
        setProjectPhase(result.data.projectPhase);
      }
    }
    fetchPhase();
    fetchActiveMentorIds();
  }, [user, fetchActiveMentorIds]);

  const allRecs: Array<TieredMentorRecommendation & { tierKey: TierKey }> = [
    ...tiers.previousCollaborations.map((r) => ({
      ...r,
      tierKey: "previousCollaborations" as const,
    })),
    ...tiers.aiSuggested.map((r) => ({ ...r, tierKey: "aiSuggested" as const })),
    ...tiers.interested.map((r) => ({ ...r, tierKey: "interested" as const })),
  ].filter((r) => !activeMentorIds.has(r.mentorId)); // exclude active mentors

  useEffect(() => {
    async function loadProfiles() {
      const profiles: Record<string, MentorDocument> = {};
      for (const rec of allRecs) {
        if (!mentorProfiles[rec.mentorId]) {
          const result = await getMentorById(rec.mentorId);
          if (result.data) profiles[rec.mentorId] = result.data;
        }
      }
      if (Object.keys(profiles).length > 0) {
        setMentorProfiles((prev) => ({ ...prev, ...profiles }));
      }
    }
    if (allRecs.length > 0) loadProfiles();
  }, [allRecs.length, tiers, mentorProfiles]);

  async function handleAccept(mentorId: string, tierKey: TierKey) {
    if (!user) return;
    const meta = tierMeta[tierKey];
    setActionLoading((prev) => ({ ...prev, [mentorId]: "accept" }));

    const result = await acceptMentor(
      user.entityId,
      mentorId,
      user.id,
      meta.acceptSource
    );

    setActionLoading((prev) => {
      const next = { ...prev };
      delete next[mentorId];
      return next;
    });

    if (result.error) {
      toast.error(result.error.message);
      return;
    }

    toast.success("Mentor accepted! Phase changed to Processing.");
    // Remove from all tiers to prevent duplicates
    removeFromTier(mentorId, "previousCollaborations");
    removeFromTier(mentorId, "aiSuggested");
    removeFromTier(mentorId, "interested");
    // Add to active mentor IDs immediately so UI hides them
    setActiveMentorIds((prev) => new Set([...prev, mentorId]));
    
    // Refetch phase after a short delay
    setTimeout(() => {
      const fetchPhase = async () => {
        const result = await getStartupById(user.entityId);
        if (result.data?.projectPhase) {
          setProjectPhase(result.data.projectPhase);
        }
      };
      fetchPhase();
    }, 500);
    
    // Refetch tiers after a short delay to ensure Firestore is updated
    setTimeout(() => {
      refresh();
    }, 1000);
  }

  async function handleReject(mentorId: string, tierKey: TierKey) {
    if (!user) return;
    const meta = tierMeta[tierKey];
    setActionLoading((prev) => ({ ...prev, [mentorId]: "reject" }));

    const result = await rejectMentor(
      user.entityId,
      mentorId,
      user.id,
      meta.acceptSource
    );

    setActionLoading((prev) => {
      const next = { ...prev };
      delete next[mentorId];
      return next;
    });

    if (result.error) {
      toast.error(result.error.message);
      return;
    }

    toast.success("Mentor rejected.");
    removeFromTier(mentorId, tierKey);
  }

  function renderTier(tierKey: TierKey, items: TieredMentorRecommendation[]) {
    const meta = tierMeta[tierKey];
    const filteredItems = items.filter((r) => !activeMentorIds.has(r.mentorId));

    return (
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">{meta.title}</h2>
          <p className="text-sm text-muted-foreground">{meta.description}</p>
        </div>

        {!loading && filteredItems.length === 0 && (
          <div className="rounded-md border border-dashed px-4 py-8 text-center">
            <p className="text-muted-foreground text-sm">No mentors in this section yet.</p>
          </div>
        )}

        {filteredItems.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((rec) => {
              const mentor = mentorProfiles[rec.mentorId];
              if (!mentor) return null;
              return (
                <MentorCard
                  key={`${tierKey}-${rec.mentorId}`}
                  mentor={mentor}
                  compatibilityScore={rec.compatibilityScore}
                  reasoning={rec.reasoning}
                  source={meta.source}
                  onAccept={() => handleAccept(rec.mentorId, tierKey)}
                  onReject={() => handleReject(rec.mentorId, tierKey)}
                  isAcceptLoading={actionLoading[rec.mentorId] === "accept"}
                  isRejectLoading={actionLoading[rec.mentorId] === "reject"}
                />
              );
            })}
          </div>
        )}
      </section>
    );
  }

  const guidance = phaseGuidance[projectPhase];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mentor Matching</h1>
          <p className="mt-1 text-muted-foreground">
            AI-powered mentor recommendations tailored to your startup.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-emerald-100 bg-card px-4 py-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
            <Users className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-emerald-600">{activeMentorCount}</p>
            <p className="text-[11px] text-muted-foreground">Active Mentors</p>
          </div>
        </div>
        <div className="rounded-lg border border-amber-100 bg-card px-4 py-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-amber-600">{tiers.interested.filter(r => !activeMentorIds.has(r.mentorId)).length}</p>
            <p className="text-[11px] text-muted-foreground">Mentors Interested</p>
          </div>
        </div>
        <div className="rounded-lg border border-blue-100 bg-card px-4 py-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
            <Sparkles className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-blue-600">{tiers.aiSuggested.filter(r => !activeMentorIds.has(r.mentorId)).length}</p>
            <p className="text-[11px] text-muted-foreground">AI Suggestions</p>
          </div>
        </div>
      </div>

      {/* Phase Progress */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-sm font-semibold mb-4">Project Progress</h2>
        <ProjectPhaseIndicator currentPhase={projectPhase} />
      </div>

      {/* Phase Guidance Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold">{guidance.title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{guidance.description}</p>
              {guidance.actions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {guidance.actions.map(({ label, href, icon: Icon }) => (
                    <Link key={href} href={href}>
                      <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="pt-6 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-8 w-full" />
              </CardContent></Card>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p className="font-medium">{error.message}</p>
          <p className="mt-1 text-xs">Ensure AI backend is running: cd ai-backend &amp;&amp; npm start (port 3001)</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {renderTier("previousCollaborations", tiers.previousCollaborations)}
          <Separator />
          {renderTier("aiSuggested", tiers.aiSuggested)}
          <Separator />
          {renderTier("interested", tiers.interested)}
        </>
      )}
    </div>
  );
}
