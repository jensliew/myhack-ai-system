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
} from "firebase/firestore";

import { storage } from "@/firebase/config";
import { documentsCollection } from "@/firebase/collections";
import { validateFileSize, MAX_FILE_SIZE_BYTES } from "@/lib/validators";
import type { ServiceResult } from "@/types/common.types";
import type {
  DocumentMetadataRecord,
  DocumentUploadParams,
  DocumentVisibility,
} from "@/types/document.types";

/**
 * Uploads a document to Firebase Storage and creates a metadata record in Firestore.
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
 * Fetches documents for a startup with optional visibility filter.
 */
export async function getDocuments(
  startupId: string,
  visibility?: DocumentVisibility
): Promise<ServiceResult<DocumentMetadataRecord[]>> {
  try {
    const constraints = [
      where("startupId", "==", startupId),
      orderBy("createdAt", "desc"),
    ];

    if (visibility) {
      constraints.splice(1, 0, where("visibility", "==", visibility));
    }

    const q = query(documentsCollection, ...constraints);
    const snapshot = await getDocs(q);

    const documents: DocumentMetadataRecord[] = snapshot.docs.map((docSnap) => ({
      ...docSnap.data(),
      id: docSnap.id,
    })) as DocumentMetadataRecord[];

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
