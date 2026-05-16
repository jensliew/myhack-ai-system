"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { useRecommendations } from "@/hooks/useRecommendations";
import { MentorCard } from "@/components/cards/MentorCard";
import {
  acceptMentor,
  rejectMentor,
  getInterestedMentors,
} from "@/services/matching/matching.service";
import { getMentorById } from "@/services/firebase/firestore.service";
import type { InterestRecord } from "@/types/matching.types";
import type { MentorDocument } from "@/types/mentor.types";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function StartupDashboardPage() {
  const { user } = useAuth();
  const { recommendations, loading: recsLoading, error: recsError, refresh, removeRecommendation } = useRecommendations();

  const [interestedMentors, setInterestedMentors] = useState<
    Array<{ interest: InterestRecord; mentor: MentorDocument }>
  >([]);
  const [interestedLoading, setInterestedLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});

  // Mentor profiles cache for AI recommendations
  const [recMentorProfiles, setRecMentorProfiles] = useState<Record<string, MentorDocument>>({});

  // Fetch interested mentors
  const fetchInterestedMentors = useCallback(async () => {
    if (!user || user.role !== "startup") return;

    setInterestedLoading(true);
    const result = await getInterestedMentors(user.entityId);

    if (result.data) {
      // Fetch mentor profiles for each interest
      const mentorsWithProfiles = await Promise.all(
        result.data.map(async (interest) => {
          const mentorResult = await getMentorById(interest.mentorId);
          return mentorResult.data
            ? { interest, mentor: mentorResult.data }
            : null;
        })
      );

      setInterestedMentors(
        mentorsWithProfiles.filter(Boolean) as Array<{
          interest: InterestRecord;
          mentor: MentorDocument;
        }>
      );
    }

    setInterestedLoading(false);
  }, [user]);

  // Fetch mentor profiles for AI recommendations
  useEffect(() => {
    async function fetchProfiles() {
      const profiles: Record<string, MentorDocument> = {};
      for (const rec of recommendations) {
        if (!recMentorProfiles[rec.mentorId]) {
          const result = await getMentorById(rec.mentorId);
          if (result.data) {
            profiles[rec.mentorId] = result.data;
          }
        }
      }
      if (Object.keys(profiles).length > 0) {
        setRecMentorProfiles((prev) => ({ ...prev, ...profiles }));
      }
    }
    if (recommendations.length > 0) {
      fetchProfiles();
    }
  }, [recommendations]);

  useEffect(() => {
    fetchInterestedMentors();
  }, [fetchInterestedMentors]);

  // Accept mentor handler
  async function handleAccept(mentorId: string, source: "ai_recommendation" | "mentor_interest") {
    if (!user) return;

    setActionLoading((prev) => ({ ...prev, [mentorId]: "accept" }));

    const result = await acceptMentor(user.entityId, mentorId, user.id, source);

    setActionLoading((prev) => {
      const next = { ...prev };
      delete next[mentorId];
      return next;
    });

    if (result.error) {
      toast.error(result.error.message);
      return;
    }

    toast.success("Mentor accepted!");

    // Remove from lists
    if (source === "ai_recommendation") {
      removeRecommendation(mentorId);
    } else {
      setInterestedMentors((prev) =>
        prev.filter((item) => item.interest.mentorId !== mentorId)
      );
    }
  }

  // Reject mentor handler
  async function handleReject(mentorId: string, source: "ai_recommendation" | "mentor_interest") {
    if (!user) return;

    setActionLoading((prev) => ({ ...prev, [mentorId]: "reject" }));

    const result = await rejectMentor(user.entityId, mentorId, user.id, source);

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

    // Remove from lists
    if (source === "ai_recommendation") {
      removeRecommendation(mentorId);
    } else {
      setInterestedMentors((prev) =>
        prev.filter((item) => item.interest.mentorId !== mentorId)
      );
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mentor Matching</h1>
          <p className="mt-1 text-muted-foreground">
            Review AI-suggested mentors and mentors who expressed interest.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={recsLoading}>
          <RefreshCw className={`h-4 w-4 ${recsLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Section 1: AI Suggested Mentors */}
      <section>
        <h2 className="text-lg font-semibold mb-4">AI Suggested Mentors</h2>

        {recsLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        {recsError && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {recsError.message}
          </div>
        )}

        {!recsLoading && !recsError && recommendations.length === 0 && (
          <div className="rounded-md border border-dashed px-4 py-8 text-center">
            <p className="text-muted-foreground">
              No AI recommendations available yet. Check back later or click Refresh.
            </p>
          </div>
        )}

        {!recsLoading && recommendations.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((rec) => {
              const mentor = recMentorProfiles[rec.mentorId];
              if (!mentor) return null;

              return (
                <MentorCard
                  key={rec.id}
                  mentor={mentor}
                  compatibilityScore={rec.compatibilityScore}
                  reasoning={rec.reasoning}
                  source="ai"
                  onAccept={() => handleAccept(rec.mentorId, "ai_recommendation")}
                  onReject={() => handleReject(rec.mentorId, "ai_recommendation")}
                  isAcceptLoading={actionLoading[rec.mentorId] === "accept"}
                  isRejectLoading={actionLoading[rec.mentorId] === "reject"}
                />
              );
            })}
          </div>
        )}
      </section>

      <Separator />

      {/* Section 2: Mentors Interested */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Mentors Interested</h2>

        {interestedLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        {!interestedLoading && interestedMentors.length === 0 && (
          <div className="rounded-md border border-dashed px-4 py-8 text-center">
            <p className="text-muted-foreground">
              No mentors have expressed interest yet.
            </p>
          </div>
        )}

        {!interestedLoading && interestedMentors.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {interestedMentors.map(({ interest, mentor }) => (
              <MentorCard
                key={interest.id}
                mentor={mentor}
                source="interest"
                onAccept={() => handleAccept(interest.mentorId, "mentor_interest")}
                onReject={() => handleReject(interest.mentorId, "mentor_interest")}
                isAcceptLoading={actionLoading[interest.mentorId] === "accept"}
                isRejectLoading={actionLoading[interest.mentorId] === "reject"}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
