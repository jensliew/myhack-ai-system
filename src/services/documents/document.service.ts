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
  orderBy,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import { storage } from "@/firebase/config";
import { documentsCollection, relationshipsCollection } from "@/firebase/collections";
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
 * Also updates the relationship engagement score.
 */
async function analyzeDocumentAsync(
  file: File,
  documentType: string,
  startupId: string
): Promise<void> {
  try {
    // Read file content
    const content = await file.text();

    // Get the first active relationship for this startup to get mentor_id
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

    const firstRelationship = snapshot.docs[0].data();
    const mentorId = firstRelationship.mentorId;

    // Send to AI backend via Next.js API route
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

    // Extract engagement score from the analysis result
    let engagementScore = 50; // default
    
    if (analysisResult.analysis?.engagement_score !== undefined) {
      engagementScore = analysisResult.analysis.engagement_score;
    } else if (analysisResult.engagement_score !== undefined) {
      engagementScore = analysisResult.engagement_score;
    }

    // Update relationship engagement score and meeting count based on analysis
    await updateRelationshipEngagement(startupId, engagementScore, documentType);
  } catch (error) {
    console.error("Error analyzing document:", error);
  }
}

/**
 * Updates the relationship engagement score and meeting count based on document analysis.
 * Only updates active relationships.
 */
async function updateRelationshipEngagement(
  startupId: string,
  engagementScore: number,
  documentType: string
): Promise<void> {
  try {
    // Query for active relationships with this startup
    const q = query(
      relationshipsCollection,
      where("startupId", "==", startupId),
      where("status", "==", "active")
    );
    const snapshot = await getDocs(q);

    // Update all active relationships with the new engagement score
    for (const docSnap of snapshot.docs) {
      const relationshipRef = doc(relationshipsCollection, docSnap.id);
      const currentData = docSnap.data();
      
      // Increment meeting count if this is a meeting minutes document
      const meetingCount = documentType === "meeting-minutes" 
        ? (currentData.meetingCount || 0) + 1 
        : currentData.meetingCount || 0;

      await updateDoc(relationshipRef, {
        engagementScore: Math.min(Math.max(engagementScore, 0), 100),
        meetingCount: meetingCount,
        lastInteraction: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
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
    const constraints: any[] = [
      where("startupId", "==", startupId),
      orderBy("createdAt", "desc"),
    ];

    const q = query(documentsCollection, ...constraints);
    const snapshot = await getDocs(q);

    let documents: DocumentMetadataRecord[] = snapshot.docs.map((docSnap) => ({
      ...docSnap.data(),
      id: docSnap.id,
    })) as DocumentMetadataRecord[];

    // Filter by visibility if specified
    if (visibility) {
      documents = documents.filter((doc) => doc.visibility === visibility);
    }

    return { data: documents, error: null };
  } catch (error: unknown) {
    const err = error as { code?: string };
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
