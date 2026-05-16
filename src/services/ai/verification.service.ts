import type { ServiceResult } from "@/types/common.types";
import type { VerificationResult } from "@/types/ai.types";

/**
 * Analyzes an application by calling the /api/ai/verification Route Handler.
 */
export async function analyzeApplication(
  applicationId: string,
  applicationType: "startup" | "mentor",
  applicationData: Record<string, unknown>,
  documentNames: string[]
): Promise<ServiceResult<VerificationResult>> {
  try {
    const response = await fetch("/api/ai/verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicationId,
        applicationType,
        applicationData,
        documentNames,
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
            "Failed to verify application.",
          retryable: response.status >= 500,
        },
      };
    }

    const data = (await response.json()) as VerificationResult;
    return { data, error: null };
  } catch {
    return {
      data: null,
      error: {
        code: "ai/network-error",
        message: "Network error during verification. Please try again.",
        retryable: true,
      },
    };
  }
}
