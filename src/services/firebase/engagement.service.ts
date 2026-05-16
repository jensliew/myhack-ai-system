import { addDoc, Timestamp } from "firebase/firestore";

import { engagementHistoryCollection } from "@/firebase/collections";
import type { ServiceResult } from "@/types/common.types";
import type { EngagementHistoryDocument } from "@/types/matching.types";

type ActionType = "interested" | "accepted" | "rejected" | "viewed";
type TargetType = "mentor" | "startup";

/**
 * Records an engagement event in the engagement_history collection.
 * Used for behavioral learning and AI recommendation improvement.
 */
export async function recordEngagement(
  userId: string,
  actionType: ActionType,
  targetId: string,
  targetType: TargetType,
  metadata?: Record<string, unknown>
): Promise<ServiceResult<EngagementHistoryDocument>> {
  try {
    const now = Timestamp.now();

    const engagementData: Omit<EngagementHistoryDocument, "id"> = {
      userId,
      actionType,
      targetId,
      targetType,
      metadata,
      createdAt: now,
    };

    const docRef = await addDoc(engagementHistoryCollection, engagementData);

    return {
      data: { ...engagementData, id: docRef.id } as EngagementHistoryDocument,
      error: null,
    };
  } catch (error: unknown) {
    const err = error as { code?: string };
    return {
      data: null,
      error: {
        code: err.code ?? "engagement/record-failed",
        message: "Failed to record engagement.",
        retryable: true,
      },
    };
  }
}

/**
 * Records a profile view event.
 */
export async function recordProfileView(
  userId: string,
  targetId: string,
  targetType: TargetType
): Promise<void> {
  // Fire and forget — don't block the UI for analytics
  recordEngagement(userId, "viewed", targetId, targetType).catch(() => {
    // Silently fail for view tracking
  });
}
