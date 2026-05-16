import { Timestamp } from "firebase/firestore";

/**
 * Supported document types for uploads.
 */
export type DocumentType = "meeting-minutes" | "monthly-report" | "general";

/**
 * Document visibility levels.
 */
export type DocumentVisibility = "public" | "private";

/**
 * Firestore document schema for the `documents` collection.
 */
export interface DocumentMetadataRecord {
  id: string; // Auto-generated
  startupId: string; // Reference to startups collection
  uploadedBy: string; // Reference to users collection
  fileName: string;
  fileUrl: string; // Firebase Storage download URL
  fileSize: number; // Bytes
  documentType: DocumentType;
  visibility: DocumentVisibility;
  createdAt: Timestamp;
}

/**
 * Parameters for the document upload function.
 */
export interface DocumentUploadParams {
  file: File;
  startupId: string;
  uploadedBy: string;
  documentType: DocumentType;
  visibility: DocumentVisibility;
}
