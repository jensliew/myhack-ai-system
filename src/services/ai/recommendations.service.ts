import type { ServiceResult } from "@/types/common.types";
import type { AIRecommendation } from "@/types/ai.types";

/**
 * Fetches AI-generated mentor recommendations for a startup
 * by calling the /api/ai/recommendations Route Handler.
 */
export async function getRecommendations(
  startupId: string,
  userId: string
): Promise<ServiceResult<AIRecommendation[]>> {
  try {
    const response = await fetch("/api/ai/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startupId, userId }),
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
      recommendations: AIRecommendation[];
    };

    return { data: data.recommendations, error: null };
  } catch (error: unknown) {
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
