import {
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";

import {
  mentorInterestsCollection,
  engagementHistoryCollection,
  usersCollection,
  startupsCollection,
  mentorsCollection,
} from "@/firebase/collections";
import type { ServiceResult } from "@/types/common.types";
import type { InterestRecord, EngagementHistoryDocument } from "@/types/matching.types";
import { createNotification } from "@/services/notifications/notification.service";

/**
 * Expresses a mentor's interest in a startup.
 * Creates an InterestRecord in mentor_interests collection and
 * simultaneously records the interaction in engagement_history.
 */
export async function expressInterest(
  mentorId: string,
  startupId: string,
  userId: string
): Promise<ServiceResult<InterestRecord>> {
  try {
    // Check if interest already exists
    const existing = await hasExpressedInterest(mentorId, startupId);
    if (existing) {
      return {
        data: null,
        error: {
          code: "interest/already-exists",
          message: "You have already expressed interest in this startup.",
          retryable: false,
        },
      };
    }

    const now = Timestamp.now();

    // Create interest record
    const interestData: Omit<InterestRecord, "id"> = {
      mentorId,
      startupId,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    const interestRef = await addDoc(mentorInterestsCollection, interestData);

    // Record engagement history
    const engagementData: Omit<EngagementHistoryDocument, "id"> = {
      userId,
      actionType: "interested",
      targetId: startupId,
      targetType: "startup",
      createdAt: now,
    };

    await addDoc(engagementHistoryCollection, engagementData);

    // Notify the startup that a mentor is interested
    try {
      const startupUserSnap = await getDocs(
        query(usersCollection, where("entityId", "==", startupId))
      );
      if (!startupUserSnap.empty) {
        const mentorSnap = await getDocs(
          query(mentorsCollection, where("id", "==", mentorId))
        );
        const mentorName = mentorSnap.empty ? "A mentor" : (mentorSnap.docs[0].data()?.name ?? "A mentor");
        await createNotification(
          startupUserSnap.docs[0].id,
          "mentor_interested",
          "A mentor is interested in you!",
          `${mentorName} has expressed interest in your startup. Review their profile on your dashboard.`,
          `/startup`
        );
      }
    } catch { /* Non-critical */ }

    return {
      data: { ...interestData, id: interestRef.id } as InterestRecord,
      error: null,
    };
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    return {
      data: null,
      error: {
        code: err.code ?? "interest/unknown",
        message: "Failed to express interest. Please try again.",
        retryable: true,
      },
    };
  }
}

/**
 * Checks if a mentor has already expressed interest in a specific startup.
 */
export async function hasExpressedInterest(
  mentorId: string,
  startupId: string
): Promise<boolean> {
  try {
    const q = query(
      mentorInterestsCollection,
      where("mentorId", "==", mentorId),
      where("startupId", "==", startupId)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch {
    return false;
  }
}

/**
 * Gets all startups a mentor has expressed interest in.
 * Only returns pending interests (not accepted or rejected).
 * Ordered by most recent first.
 */
export async function getInterestedStartupsForMentor(
  mentorId: string
): Promise<ServiceResult<InterestRecord[]>> {
  try {
    const q = query(
      mentorInterestsCollection,
      where("mentorId", "==", mentorId),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
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
        code: err.code ?? "interest/fetch-failed",
        message: "Failed to fetch interested startups.",
        retryable: true,
      },
    };
  }
}


/**
 * Gets all mentors who have expressed interest in a specific startup.
 * Only returns pending interests (not accepted or rejected).
 * Ordered by most recent first.
 */
export async function getInterestedMentorsForStartup(
  startupId: string
): Promise<ServiceResult<InterestRecord[]>> {
  try {
    const q = query(
      mentorInterestsCollection,
      where("startupId", "==", startupId),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
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
        code: err.code ?? "interest/fetch-failed",
        message: "Failed to fetch interested mentors.",
        retryable: true,
      },
    };
  }
}
