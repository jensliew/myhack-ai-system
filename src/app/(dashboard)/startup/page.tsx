"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { useTieredRecommendations } from "@/hooks/useTieredRecommendations";
import type { TieredMentorRecommendation } from "@/hooks/useTieredRecommendations";
import { MentorCard } from "@/components/cards/MentorCard";
import { ProjectPhaseIndicator } from "@/components/ProjectPhaseIndicator";
import { acceptMentor, rejectMentor } from "@/services/matching/matching.service";
import { getMentorById, getStartupById } from "@/services/firebase/firestore.service";
import type { MentorDocument } from "@/types/mentor.types";
import type { ProjectPhase } from "@/types/startup.types";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

type TierKey = "previousCollaborations" | "aiSuggested" | "interested";

const tierMeta: Record<
  TierKey,
  {
    title: string;
    source: "ai" | "interest";
    acceptSource: "ai_recommendation" | "mentor_interest";
  }
> = {
  previousCollaborations: {
    title: "Previous Collaborations",
    source: "ai",
    acceptSource: "ai_recommendation",
  },
  aiSuggested: {
    title: "AI Suggested Mentors",
    source: "ai",
    acceptSource: "ai_recommendation",
  },
  interested: {
    title: "Mentors Interested",
    source: "interest",
    acceptSource: "mentor_interest",
  },
};

export default function StartupDashboardPage() {
  const { user } = useAuth();
  const { tiers, loading, error, refresh, removeFromTier } =
    useTieredRecommendations();

  const [mentorProfiles, setMentorProfiles] = useState<
    Record<string, MentorDocument>
  >({});
  const [actionLoading, setActionLoading] = useState<Record<string, string>>(
    {}
  );
  const [projectPhase, setProjectPhase] = useState<ProjectPhase>("initial");

  const allRecs: Array<TieredMentorRecommendation & { tierKey: TierKey }> = [
    ...tiers.previousCollaborations.map((r) => ({
      ...r,
      tierKey: "previousCollaborations" as const,
    })),
    ...tiers.aiSuggested.map((r) => ({ ...r, tierKey: "aiSuggested" as const })),
    ...tiers.interested.map((r) => ({ ...r, tierKey: "interested" as const })),
  ];

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
  }, [user]);

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

    return (
      <section>
        <h2 className="text-lg font-semibold mb-4">{meta.title}</h2>

        {!loading && items.length === 0 && (
          <div className="rounded-md border border-dashed px-4 py-8 text-center">
            <p className="text-muted-foreground">
              No mentors in this section yet.
            </p>
          </div>
        )}

        {items.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((rec) => {
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mentor Matching</h1>
          <p className="mt-1 text-muted-foreground">
            Previous collaborations first, then AI suggestions, then interested
            mentors.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-sm font-semibold mb-4">Project Progress</h2>
        <ProjectPhaseIndicator currentPhase={projectPhase} />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error.message}
          <p className="mt-1 text-xs">
            Ensure AI backend is running: cd ai-backend && npm start (port 3001)
          </p>
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
