import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import {
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import { storage } from "@/firebase/config";
import { documentsCollection, relationshipsCollection, mentorsCollection, usersCollection } from "@/firebase/collections";
import { createNotification } from "@/services/notifications/notification.service";
import { validateFileSize, MAX_FILE_SIZE_BYTES } from "@/lib/validators";
import type { ServiceResult } from "@/types/common.types";
import type {
  DocumentMetadataRecord,
  DocumentUploadParams,
  DocumentVisibility,
} from "@/types/document.types";

/**
 * Uploads a document to Firebase Storage and creates a metadata record in Firestore.
 * Also sends the document to AI backend for analysis.
 */
export async function uploadDocument(
  params: DocumentUploadParams
): Promise<ServiceResult<DocumentMetadataRecord>> {
  try {
    // Validate file size
    const sizeError = validateFileSize(params.file.size);
    if (sizeError) {
      return {
        data: null,
        error: {
          code: "document/file-too-large",
          message: sizeError.message,
          retryable: false,
        },
      };
    }

    // Generate a unique document ID
    const docId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const storagePath = `documents/${params.startupId}/${docId}/${params.file.name}`;

    // Upload to Firebase Storage
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, params.file);
    const fileUrl = await getDownloadURL(storageRef);

    // Create metadata record in Firestore
    const metadata: Omit<DocumentMetadataRecord, "id"> = {
      startupId: params.startupId,
      uploadedBy: params.uploadedBy,
      fileName: params.file.name,
      fileUrl,
      fileSize: params.file.size,
      documentType: params.documentType,
      visibility: params.visibility,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(documentsCollection, metadata);

    // Send document to AI backend for analysis (fire and forget)
    analyzeDocumentAsync(params.file, params.documentType, params.startupId).catch(
      (err) => console.error("Document analysis failed:", err)
    );

    // Notify mentor(s) about the new document upload
    try {
      const relSnap = await getDocs(
        query(relationshipsCollection, where("startupId", "==", params.startupId), where("status", "==", "active"))
      );
      for (const relDoc of relSnap.docs) {
        const mentorUserSnap = await getDocs(
          query(usersCollection, where("entityId", "==", relDoc.data().mentorId))
        );
        if (!mentorUserSnap.empty) {
          await createNotification(
            mentorUserSnap.docs[0].id,
            "document_uploaded",
            "New document uploaded",
            `Your startup uploaded a new ${params.documentType.replace("-", " ")}: ${params.file.name}`,
            `/mentor/relationships`
          );
        }
      }
    } catch { /* Non-critical */ }

    return {
      data: { ...metadata, id: docRef.id } as DocumentMetadataRecord,
      error: null,
    };
  } catch (error: unknown) {
    const err = error as { code?: string };
    return {
      data: null,
      error: {
        code: err.code ?? "document/upload-failed",
        message: "Failed to upload document. Please try again.",
        retryable: true,
      },
    };
  }
}

/**
 * Sends document content to AI backend for analysis (async, non-blocking).
 * Also updates the relationship engagement score and meeting count.
 * For meeting minutes, extracts mentor name and updates the correct relationship.
 */
async function analyzeDocumentAsync(
  file: File,
  documentType: string,
  startupId: string
): Promise<void> {
  try {
    const content = await file.text();

    // Get all active relationships for this startup
    const q = query(
      relationshipsCollection,
      where("startupId", "==", startupId),
      where("status", "==", "active")
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.warn("No active relationships found for startup, skipping analysis");
      return;
    }

    // Use first relationship's mentorId as default
    const firstRelationship = snapshot.docs[0].data();
    let mentorId = firstRelationship.mentorId;

    // Send to AI backend for analysis
    const response = await fetch("/api/ai/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: documentType,
        content,
        startup_id: startupId,
        mentor_id: mentorId,
        title: file.name,
        period: new Date().toISOString().split("T")[0],
      }),
    });

    if (!response.ok) {
      console.error("AI analysis failed:", await response.text());
      return;
    }

    const analysisResult = await response.json();
    console.log("Document analyzed successfully:", analysisResult);

    // Extract engagement score
    let engagementScore = 50;
    if (analysisResult.analysis?.engagement_score !== undefined) {
      engagementScore = analysisResult.analysis.engagement_score;
    } else if (analysisResult.engagement_score !== undefined) {
      engagementScore = analysisResult.engagement_score;
    }

    // For meeting minutes: try to match extracted mentor name to correct relationship
    if (documentType === "meeting-minutes") {
      const extractedMentorName: string | null =
        analysisResult.analysis?.mentor_name ??
        analysisResult.mentor_name ??
        null;

      if (extractedMentorName) {
        console.log(`Extracted mentor name from meeting minutes: "${extractedMentorName}"`);

        // Check each active relationship's mentor name
        for (const relDoc of snapshot.docs) {
          const relData = relDoc.data();
          const relMentorId = relData.mentorId;

          // Fetch mentor profile to get their name
          const mentorDocSnap = await getDocs(
            query(mentorsCollection, where("id", "==", relMentorId))
          );

          // Try direct doc fetch by ID
          const { getDoc } = await import("firebase/firestore");
          const mentorRef = doc(mentorsCollection, relMentorId);
          const mentorDoc = await getDoc(mentorRef);

          if (mentorDoc.exists()) {
            const mentorData = mentorDoc.data();
            const storedName = (mentorData?.name ?? "").toLowerCase();
            const extracted = extractedMentorName.toLowerCase();

            // Match if names overlap (partial match)
            const storedParts = storedName.split(" ");
            const extractedParts = extracted.split(" ");
            const hasMatch = storedParts.some((p: string) =>
              extractedParts.some((e: string) => p.length > 2 && e.length > 2 && (p.includes(e) || e.includes(p)))
            );

            if (hasMatch) {
              mentorId = relMentorId;
              console.log(`Matched mentor "${extractedMentorName}" → mentorId: ${mentorId}`);
              break;
            }
          }
        }
      }

      await updateRelationshipEngagement(startupId, mentorId, engagementScore, documentType);
    } else {
      await updateRelationshipEngagement(startupId, mentorId, engagementScore, documentType);
    }
  } catch (error) {
    console.error("Error analyzing document:", error);
  }
}

/**
 * Updates the relationship engagement score and meeting count.
 * meetingCount is calculated from actual meeting-minutes documents in Firestore,
 * NOT incremented - this ensures it always reflects the real count.
 */
async function updateRelationshipEngagement(
  startupId: string,
  mentorId: string,
  engagementScore: number,
  documentType: string
): Promise<void> {
  try {
    const q = query(
      relationshipsCollection,
      where("startupId", "==", startupId),
      where("mentorId", "==", mentorId),
      where("status", "==", "active")
    );
    const snapshot = await getDocs(q);

    // Count actual meeting-minutes documents in Firestore for this startup
    // This is the source of truth - never increment, always recalculate
    let actualMeetingCount = 0;
    if (documentType === "meeting-minutes") {
      const meetingDocsQuery = query(
        documentsCollection,
        where("startupId", "==", startupId),
        where("documentType", "==", "meeting-minutes")
      );
      const meetingDocsSnapshot = await getDocs(meetingDocsQuery);
      actualMeetingCount = meetingDocsSnapshot.size;
      console.log(`Actual meeting-minutes documents in Firestore: ${actualMeetingCount}`);
    }

    for (const docSnap of snapshot.docs) {
      const relationshipRef = doc(relationshipsCollection, docSnap.id);
      const currentData = docSnap.data();

      // Use actual document count for meeting-minutes, keep existing for other types
      const finalMeetingCount = documentType === "meeting-minutes"
        ? actualMeetingCount
        : (currentData.meetingCount || 0);

      await updateDoc(relationshipRef, {
        engagementScore: Math.min(Math.max(engagementScore, 0), 100),
        meetingCount: finalMeetingCount,
        lastInteraction: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      console.log(
        `Updated relationship ${docSnap.id}: engagementScore=${engagementScore}, meetingCount=${finalMeetingCount}`
      );
    }
  } catch (error) {
    console.error("Error updating relationship engagement:", error);
  }
}

/**
 * Fetches documents for a startup with optional visibility filter.
 */
export async function getDocuments(
  startupId: string,
  visibility?: DocumentVisibility
): Promise<ServiceResult<DocumentMetadataRecord[]>> {
  try {
    // Query without orderBy to avoid composite index requirement
    const q = query(
      documentsCollection,
      where("startupId", "==", startupId)
    );
    const snapshot = await getDocs(q);

    let documents: DocumentMetadataRecord[] = snapshot.docs.map((docSnap) => ({
      ...docSnap.data(),
      id: docSnap.id,
    })) as DocumentMetadataRecord[];

    // Filter by visibility if specified
    if (visibility) {
      documents = documents.filter((doc) => doc.visibility === visibility);
    }

    // Sort client-side by createdAt descending (avoids composite index requirement)
    documents.sort((a, b) => {
      const aTime = a.createdAt?.seconds ?? 0;
      const bTime = b.createdAt?.seconds ?? 0;
      return bTime - aTime;
    });

    return { data: documents, error: null };
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error("getDocuments error:", err);
    return {
      data: null,
      error: {
        code: err.code ?? "document/fetch-failed",
        message: "Failed to fetch documents.",
        retryable: true,
      },
    };
  }
}

/**
 * Deletes a document from Firebase Storage and removes its metadata from Firestore.
 */
export async function deleteDocument(
  documentId: string,
  fileUrl: string
): Promise<ServiceResult<void>> {
  try {
    // Delete from Storage
    const storageRef = ref(storage, fileUrl);
    try {
      await deleteObject(storageRef);
    } catch {
      // File may already be deleted — continue with metadata removal
    }

    // Delete metadata from Firestore
    const docRef = doc(documentsCollection, documentId);
    await deleteDoc(docRef);

    return { data: undefined, error: null };
  } catch (error: unknown) {
    const err = error as { code?: string };
    return {
      data: null,
      error: {
        code: err.code ?? "document/delete-failed",
        message: "Failed to delete document.",
        retryable: true,
      },
    };
  }
}
