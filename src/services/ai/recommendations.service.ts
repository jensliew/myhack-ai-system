import { addDoc, Timestamp } from "firebase/firestore";

import { getStartupById, getApprovedMentors } from "@/services/firebase/firestore.service";
import { aiRecommendationsCollection } from "@/firebase/collections";
import type { ServiceResult } from "@/types/common.types";
import type { AIRecommendation } from "@/types/ai.types";

/**
 * Fetches AI-generated mentor recommendations for a startup.
 * 1. Fetches startup and mentor data from Firestore (client-side)
 * 2. Sends data to /api/ai/recommendations Route Handler (server-side AI call)
 * 3. Stores results in Firestore (client-side)
 */
export async function getRecommendations(
  startupId: string,
  userId: string
): Promise<ServiceResult<AIRecommendation[]>> {
  try {
    // Fetch startup profile from Firestore (client-side)
    const startupResult = await getStartupById(startupId);
    if (startupResult.error || !startupResult.data) {
      return {
        data: null,
        error: {
          code: "ai/startup-not-found",
          message: "Startup profile not found. Please complete your profile first.",
          retryable: false,
        },
      };
    }

    // Fetch mentors from Firestore (client-side)
    const mentorsResult = await getApprovedMentors(50);
    if (mentorsResult.error || !mentorsResult.data) {
      return {
        data: null,
        error: {
          code: "ai/mentors-not-found",
          message: "No mentors available for matching.",
          retryable: true,
        },
      };
    }

    if (mentorsResult.data.mentors.length === 0) {
      return { data: [], error: null };
    }

    // Call the AI Route Handler with the data
    const response = await fetch("/api/ai/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startup: startupResult.data,
        mentors: mentorsResult.data.mentors,
        history: [],
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
            "Failed to generate recommendations.",
          retryable: response.status >= 500,
        },
      };
    }

    const data = (await response.json()) as {
      recommendations: Array<{
        mentorId: string;
        compatibilityScore: number;
        reasoning: string;
        modelUsed: "gemini" | "gemma";
      }>;
      modelUsed: "gemini" | "gemma";
    };

    // Store recommendations in Firestore (client-side)
    const now = Timestamp.now();
    const storedRecommendations: AIRecommendation[] = [];

    for (const rec of data.recommendations) {
      const recData: Omit<AIRecommendation, "id"> = {
        startupId,
        mentorId: rec.mentorId,
        compatibilityScore: rec.compatibilityScore,
        reasoning: rec.reasoning,
        modelUsed: rec.modelUsed ?? data.modelUsed,
        status: "pending",
        createdAt: now,
      };

      const docRef = await addDoc(aiRecommendationsCollection, recData);
      storedRecommendations.push({ ...recData, id: docRef.id } as AIRecommendation);
    }

    return { data: storedRecommendations, error: null };
  } catch {
    return {
      data: null,
      error: {
        code: "ai/network-error",
        message: "Network error. Please check your connection and try again.",
        retryable: true,
      },
    };
  }
}
