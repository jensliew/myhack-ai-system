import { addDoc, getDocs, updateDoc, doc, query, where, onSnapshot, Timestamp, writeBatch } from "firebase/firestore";
import { db } from "@/firebase/config";
import { notificationsCollection } from "@/firebase/collections";
import type { NotificationDocument } from "@/types/matching.types";
import type { ServiceResult } from "@/types/common.types";

export async function createNotification(
  userId: string,
  type: NotificationDocument["type"],
  title: string,
  body: string,
  link?: string
): Promise<void> {
  try {
    await addDoc(notificationsCollection, {
      userId,
      type,
      title,
      body,
      read: false,
      link,
      createdAt: Timestamp.now(),
    } as Omit<NotificationDocument, "id">);
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}

export function subscribeToNotifications(
  userId: string,
  callback: (notifications: NotificationDocument[]) => void
): () => void {
  // Query without orderBy to avoid composite index requirement
  // Sort client-side instead
  const q = query(
    notificationsCollection,
    where("userId", "==", userId)
  );
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs
      .map((d) => ({ ...d.data(), id: d.id })) as NotificationDocument[];
    // Sort client-side by createdAt descending
    notifications.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
    callback(notifications);
  });
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(notificationsCollection, notificationId), { read: true });
  } catch (err) {
    console.error("Failed to mark notification read:", err);
  }
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  try {
    const q = query(notificationsCollection, where("userId", "==", userId), where("read", "==", false));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => batch.update(d.ref, { read: true }));
    await batch.commit();
  } catch (err) {
    console.error("Failed to mark all notifications read:", err);
  }
}
