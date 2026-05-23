import { getStartupById, getApprovedMentors, getActiveRelationships } from "@/services/firebase/firestore.service";
import { getInterestedMentorsForStartup } from "@/services/matching/interest.service";
import type { ServiceResult } from "@/types/common.types";

export interface TieredMentorRecommendation {
  mentorId: string;
  compatibilityScore: number;
  reasoning: string;
  tierLabel: string;
  tier: number;
  modelUsed: "gemini" | "gemma";
}

export interface TieredRecommendationsResult {
  previousCollaborations: TieredMentorRecommendation[];
  aiSuggested: TieredMentorRecommendation[];
  interested: TieredMentorRecommendation[];
}

/**
 * Tiered mentor discovery via Express AI backend:
 * 1) Previous collaborations  2) AI suggested  3) Expressed interest
 */
export async function getTieredRecommendations(
  startupId: string
): Promise<ServiceResult<TieredRecommendationsResult>> {
  try {
    const startupResult = await getStartupById(startupId);
    if (startupResult.error || !startupResult.data) {
      return {
        data: null,
        error: {
          code: "ai/startup-not-found",
          message: "Startup profile not found.",
          retryable: false,
        },
      };
    }

    const mentorsResult = await getApprovedMentors(50);
    if (mentorsResult.error || !mentorsResult.data) {
      return {
        data: null,
        error: {
          code: "ai/mentors-not-found",
          message: "No mentors available.",
          retryable: true,
        },
      };
    }

    const interestedResult = await getInterestedMentorsForStartup(startupId);
    const interestedMentorIds =
      interestedResult.data?.map((i) => i.mentorId) ?? [];

    // Get active relationships to exclude from ALL tiers
    const activeRelResult = await getActiveRelationships(startupId);
    const activeMentorIds =
      activeRelResult.data?.map((r) => r.mentorId) ?? [];

    // Filter out active mentors from interested list too
    const filteredInterestedMentorIds = interestedMentorIds.filter(
      (id) => !activeMentorIds.includes(id)
    );

    const response = await fetch("/api/ai/matching/mentors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startup: startupResult.data,
        mentors: mentorsResult.data.mentors,
        interestedMentorIds: filteredInterestedMentorIds,
        activeMentorIds,
        explainTop: 3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        data: null,
        error: {
          code: `ai/http-${response.status}`,
          message:
            (errorData as { error?: string }).error ??
            "Failed to load mentor recommendations.",
          retryable: response.status >= 500,
        },
      };
    }

    const data = (await response.json()) as TieredRecommendationsResult;
    return { data, error: null };
  } catch {
    return {
      data: null,
      error: {
        code: "ai/network-error",
        message: "Network error. Is the AI backend running on port 3001? Run: cd ai-backend && npm start",
        retryable: true,
      },
    };
  }
}
