import { getMentorById, getApprovedStartups } from "@/services/firebase/firestore.service";
import { getInterestedStartupsForMentor } from "@/services/matching/interest.service";
import type { ServiceResult } from "@/types/common.types";

export interface TieredStartupRecommendation {
  startupId: string;
  compatibilityScore: number;
  reasoning: string;
  tierLabel: string;
  tier: number;
  modelUsed: "gemini" | "gemma";
}

export interface TieredStartupsResult {
  previousCollaborations: TieredStartupRecommendation[];
  aiSuggested: TieredStartupRecommendation[];
  expressedInterest: TieredStartupRecommendation[];
}

/**
 * Tiered startup discovery for mentors:
 * 1) Previous collaborations  2) AI suggested  3) Expressed interest
 */
export async function getTieredStartupRecommendations(
  mentorId: string
): Promise<ServiceResult<TieredStartupsResult>> {
  try {
    const mentorResult = await getMentorById(mentorId);
    if (mentorResult.error || !mentorResult.data) {
      return {
        data: null,
        error: {
          code: "ai/mentor-not-found",
          message: "Mentor profile not found.",
          retryable: false,
        },
      };
    }

    const startupsResult = await getApprovedStartups(50);
    if (startupsResult.error || !startupsResult.data) {
      return {
        data: null,
        error: {
          code: "ai/startups-not-found",
          message: "No startups available.",
          retryable: true,
        },
      };
    }

    const interestedResult = await getInterestedStartupsForMentor(mentorId);
    const interestedStartupIds =
      interestedResult.data?.map((i) => i.startupId) ?? [];

    // Call AI backend directly (rule-based matching, no API quota needed)
    const response = await fetch("http://localhost:3001/match/startups/tiered", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mentor: mentorResult.data,
        startups: startupsResult.data.startups,
        interested_startup_ids: interestedStartupIds,
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
            "Failed to load startup recommendations.",
          retryable: response.status >= 500,
        },
      };
    }

    const backendData = (await response.json()) as {
      previous_collaborations?: Array<{
        startup_id: string;
        match_percentage: number;
        ai_match_reasoning: string;
        tier_label: string;
        tier_order: number;
      }>;
      ai_suggested?: Array<{
        startup_id: string;
        match_percentage: number;
        ai_match_reasoning: string;
        tier_label: string;
        tier_order: number;
      }>;
      interested?: Array<{
        startup_id: string;
        match_percentage: number;
        reasoning: string;
        tier_label: string;
        tier_order: number;
      }>;
    };

    // Map backend response to frontend types
    const mapStartupRec = (item: any): TieredStartupRecommendation => ({
      startupId: item.startup_id,
      compatibilityScore: item.match_percentage ?? item.score ?? 50,
      reasoning: item.ai_match_reasoning ?? item.reasoning ?? "",
      tierLabel: item.tier_label ?? "",
      tier: item.tier_order ?? 0,
      modelUsed: "gemini",
    });

    const data: TieredStartupsResult = {
      previousCollaborations: (backendData.previous_collaborations ?? []).map(mapStartupRec),
      aiSuggested: (backendData.ai_suggested ?? []).map(mapStartupRec),
      expressedInterest: (backendData.interested ?? []).map(mapStartupRec),
    };

    return { data, error: null };
  } catch {
    return {
      data: null,
      error: {
        code: "ai/network-error",
        message: "Network error. Is the AI backend running on port 3002? Run: cd ai-backend && npm start",
        retryable: true,
      },
    };
  }
}
