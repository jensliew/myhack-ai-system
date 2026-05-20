import { addDoc, query, where, onSnapshot, updateDoc, doc, getDoc, getDocs, Timestamp } from "firebase/firestore";
import { messagesCollection, relationshipsCollection, usersCollection, mentorsCollection, startupsCollection } from "@/firebase/collections";
import { createNotification } from "@/services/notifications/notification.service";
import type { MessageDocument, RelationshipRecord } from "@/types/matching.types";

export async function sendMessage(
  relationshipId: string,
  senderId: string,
  senderRole: "startup" | "mentor",
  senderName: string,
  content: string
): Promise<void> {
  await addDoc(messagesCollection, {
    relationshipId,
    senderId,
    senderRole,
    senderName,
    content: content.trim(),
    read: false,
    createdAt: Timestamp.now(),
  } as Omit<MessageDocument, "id">);

  // Notify the other party
  try {
    const relSnap = await getDoc(doc(relationshipsCollection, relationshipId));
    if (!relSnap.exists()) return;
    const rel = relSnap.data() as RelationshipRecord;

    // Determine the other party's entityId
    const otherEntityId = senderRole === "startup" ? rel.mentorId : rel.startupId;

    // Find their userId in the users collection
    const userSnap = await getDocs(
      query(usersCollection, where("entityId", "==", otherEntityId))
    );
    if (userSnap.empty) return;

    const otherUserId = userSnap.docs[0].id;

    await createNotification(
      otherUserId,
      "message_received",
      `New message from ${senderName}`,
      content.length > 60 ? content.slice(0, 60) + "..." : content,
      `/messages/${relationshipId}`
    );
  } catch (err) {
    console.error("Failed to send message notification:", err);
  }
}

export function subscribeToMessages(
  relationshipId: string,
  callback: (messages: MessageDocument[]) => void
): () => void {
  // Query without orderBy to avoid composite index requirement
  const q = query(
    messagesCollection,
    where("relationshipId", "==", relationshipId)
  );
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((d) => ({ ...d.data(), id: d.id })) as MessageDocument[];
    // Sort client-side by createdAt ascending
    messages.sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0));
    callback(messages);
  });
}

export async function markMessagesRead(
  relationshipId: string,
  currentUserId: string
): Promise<void> {
  try {
    const q = query(
      messagesCollection,
      where("relationshipId", "==", relationshipId),
      where("read", "==", false)
    );
    const snapshot = await getDocs(q);
    await Promise.all(
      snapshot.docs
        .filter((d) => d.data().senderId !== currentUserId)
        .map((d) => updateDoc(doc(messagesCollection, d.id), { read: true }))
    );
  } catch (err) {
    console.error("Failed to mark messages read:", err);
  }
}

export async function getUnreadCount(
  relationshipId: string,
  currentUserId: string
): Promise<number> {
  try {
    const q = query(
      messagesCollection,
      where("relationshipId", "==", relationshipId),
      where("read", "==", false)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.filter((d) => d.data().senderId !== currentUserId).length;
  } catch {
    return 0;
  }
}
