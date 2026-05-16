import {
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";

import {
  relationshipsCollection,
  mentorInterestsCollection,
  aiRecommendationsCollection,
  engagementHistoryCollection,
} from "@/firebase/collections";
import type { ServiceResult } from "@/types/common.types";
import type {
  RelationshipRecord,
  InterestRecord,
  EngagementHistoryDocument,
} from "@/types/matching.types";

/**
 * Accepts a mentor for a startup, creating an active relationship.
 * Records the acceptance in engagement_history.
 */
export async function acceptMentor(
  startupId: string,
  mentorId: string,
  userId: string,
  source: "ai_recommendation" | "mentor_interest"
): Promise<ServiceResult<RelationshipRecord>> {
  try {
    const now = Timestamp.now();

    // Create relationship record
    const relationshipData: Omit<RelationshipRecord, "id"> = {
      startupId,
      mentorId,
      status: "active",
      source,
      engagementScore: 0,
      meetingCount: 0,
      lastInteraction: now,
      createdAt: now,
      updatedAt: now,
    };

    const relRef = await addDoc(relationshipsCollection, relationshipData);

    // Update the source record status
    if (source === "mentor_interest") {
      await updateInterestStatus(mentorId, startupId, "accepted");
    } else {
      await updateRecommendationStatus(mentorId, startupId, "accepted");
    }

    // Record engagement history
    const engagementData: Omit<EngagementHistoryDocument, "id"> = {
      userId,
      actionType: "accepted",
      targetId: mentorId,
      targetType: "mentor",
      createdAt: now,
    };
    await addDoc(engagementHistoryCollection, engagementData);

    return {
      data: { ...relationshipData, id: relRef.id } as RelationshipRecord,
      error: null,
    };
  } catch (error: unknown) {
    const err = error as { code?: string };
    return {
      data: null,
      error: {
        code: err.code ?? "matching/accept-failed",
        message: "Failed to accept mentor. Please try again.",
        retryable: true,
      },
    };
  }
}

/**
 * Rejects a mentor, updating the source record and recording the decision.
 */
export async function rejectMentor(
  startupId: string,
  mentorId: string,
  userId: string,
  source: "ai_recommendation" | "mentor_interest"
): Promise<ServiceResult<void>> {
  try {
    const now = Timestamp.now();

    // Update the source record status
    if (source === "mentor_interest") {
      await updateInterestStatus(mentorId, startupId, "rejected");
    } else {
      await updateRecommendationStatus(mentorId, startupId, "rejected");
    }

    // Record engagement history
    const engagementData: Omit<EngagementHistoryDocument, "id"> = {
      userId,
      actionType: "rejected",
      targetId: mentorId,
      targetType: "mentor",
      createdAt: now,
    };
    await addDoc(engagementHistoryCollection, engagementData);

    return { data: undefined, error: null };
  } catch (error: unknown) {
    const err = error as { code?: string };
    return {
      data: null,
      error: {
        code: err.code ?? "matching/reject-failed",
        message: "Failed to reject mentor. Please try again.",
        retryable: true,
      },
    };
  }
}

/**
 * Gets all mentors who have expressed interest in a specific startup.
 * Returns pending interests ordered by most recent first.
 */
export async function getInterestedMentors(
  startupId: string
): Promise<ServiceResult<InterestRecord[]>> {
  try {
    const q = query(
      mentorInterestsCollection,
      where("startupId", "==", startupId),
      where("status", "==", "pending")
    );
    const snapshot = await getDocs(q);

    const interests: InterestRecord[] = snapshot.docs.map((docSnap) => ({
      ...docSnap.data(),
      id: docSnap.id,
    })) as InterestRecord[];

    return { data: interests, error: null };
  } catch (error: unknown) {
    const err = error as { code?: string };
    return {
      data: null,
      error: {
        code: err.code ?? "matching/fetch-failed",
        message: "Failed to fetch interested mentors.",
        retryable: true,
      },
    };
  }
}

/**
 * Updates the status of a mentor interest record.
 */
async function updateInterestStatus(
  mentorId: string,
  startupId: string,
  status: "accepted" | "rejected"
): Promise<void> {
  const q = query(
    mentorInterestsCollection,
    where("mentorId", "==", mentorId),
    where("startupId", "==", startupId)
  );
  const snapshot = await getDocs(q);

  for (const docSnap of snapshot.docs) {
    await updateDoc(doc(mentorInterestsCollection, docSnap.id), {
      status,
      updatedAt: Timestamp.now(),
    });
  }
}

/**
 * Updates the status of an AI recommendation record.
 */
async function updateRecommendationStatus(
  mentorId: string,
  startupId: string,
  status: "accepted" | "rejected"
): Promise<void> {
  const q = query(
    aiRecommendationsCollection,
    where("mentorId", "==", mentorId),
    where("startupId", "==", startupId)
  );
  const snapshot = await getDocs(q);

  for (const docSnap of snapshot.docs) {
    await updateDoc(doc(aiRecommendationsCollection, docSnap.id), {
      status,
    });
  }
}
