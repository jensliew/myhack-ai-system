import { addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, Timestamp } from "firebase/firestore";
import { milestonesCollection } from "@/firebase/collections";
import type { MilestoneDocument } from "@/types/matching.types";
import type { ServiceResult } from "@/types/common.types";

export async function createMilestone(
  data: Omit<MilestoneDocument, "id" | "createdAt" | "updatedAt">
): Promise<ServiceResult<MilestoneDocument>> {
  try {
    const now = Timestamp.now();
    const ref = await addDoc(milestonesCollection, { ...data, createdAt: now, updatedAt: now } as Omit<MilestoneDocument, "id">);
    return { data: { ...data, id: ref.id, createdAt: now, updatedAt: now } as MilestoneDocument, error: null };
  } catch {
    return { data: null, error: { code: "milestone/create-failed", message: "Failed to create milestone.", retryable: true } };
  }
}

export async function getMilestonesForRelationship(
  relationshipId: string
): Promise<ServiceResult<MilestoneDocument[]>> {
  try {
    const q = query(milestonesCollection, where("relationshipId", "==", relationshipId));
    const snapshot = await getDocs(q);
    const milestones = snapshot.docs.map((d) => ({ ...d.data(), id: d.id })) as MilestoneDocument[];
    // Sort client-side to avoid composite index requirement
    milestones.sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0));
    return { data: milestones, error: null };
  } catch {
    return { data: null, error: { code: "milestone/fetch-failed", message: "Failed to fetch milestones.", retryable: true } };
  }
}

export async function updateMilestoneStatus(
  milestoneId: string,
  status: MilestoneDocument["status"]
): Promise<ServiceResult<void>> {
  try {
    const updates: Partial<MilestoneDocument> = { status, updatedAt: Timestamp.now() };
    if (status === "completed") updates.completedAt = Timestamp.now();
    await updateDoc(doc(milestonesCollection, milestoneId), updates);
    return { data: undefined, error: null };
  } catch {
    return { data: null, error: { code: "milestone/update-failed", message: "Failed to update milestone.", retryable: true } };
  }
}

export async function deleteMilestone(milestoneId: string): Promise<ServiceResult<void>> {
  try {
    await deleteDoc(doc(milestonesCollection, milestoneId));
    return { data: undefined, error: null };
  } catch {
    return { data: null, error: { code: "milestone/delete-failed", message: "Failed to delete milestone.", retryable: true } };
  }
}
