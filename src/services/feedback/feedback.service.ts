import { addDoc, getDocs, query, where, Timestamp } from "firebase/firestore";
import { feedbackCollection } from "@/firebase/collections";
import type { FeedbackDocument } from "@/types/matching.types";
import type { ServiceResult } from "@/types/common.types";

export async function submitFeedback(
  data: Omit<FeedbackDocument, "id" | "createdAt">
): Promise<ServiceResult<FeedbackDocument>> {
  try {
    // Check if already submitted
    const existing = await getDocs(
      query(feedbackCollection, where("relationshipId", "==", data.relationshipId), where("fromUserId", "==", data.fromUserId))
    );
    if (!existing.empty) {
      return { data: null, error: { code: "feedback/already-submitted", message: "You have already submitted feedback for this relationship.", retryable: false } };
    }

    const ref = await addDoc(feedbackCollection, { ...data, createdAt: Timestamp.now() } as Omit<FeedbackDocument, "id">);
    return { data: { ...data, id: ref.id, createdAt: Timestamp.now() } as FeedbackDocument, error: null };
  } catch (err: any) {
    return { data: null, error: { code: "feedback/submit-failed", message: "Failed to submit feedback.", retryable: true } };
  }
}

export async function getFeedbackForRelationship(
  relationshipId: string
): Promise<ServiceResult<FeedbackDocument[]>> {
  try {
    const snapshot = await getDocs(query(feedbackCollection, where("relationshipId", "==", relationshipId)));
    const feedback = snapshot.docs.map((d) => ({ ...d.data(), id: d.id })) as FeedbackDocument[];
    return { data: feedback, error: null };
  } catch {
    return { data: null, error: { code: "feedback/fetch-failed", message: "Failed to fetch feedback.", retryable: true } };
  }
}

export async function hasSubmittedFeedback(
  relationshipId: string,
  userId: string
): Promise<boolean> {
  try {
    const snapshot = await getDocs(
      query(feedbackCollection, where("relationshipId", "==", relationshipId), where("fromUserId", "==", userId))
    );
    return !snapshot.empty;
  } catch {
    return false;
  }
}
