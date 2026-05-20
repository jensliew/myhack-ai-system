"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

import {
  uploadDocument,
  getDocuments,
  deleteDocument,
} from "@/services/documents/document.service";
import { useAuth } from "@/hooks/useAuth";
import type { DocumentMetadataRecord, DocumentUploadParams } from "@/types/document.types";
import type { ServiceError } from "@/types/common.types";

/**
 * Hook for managing document uploads, listing, and deletion.
 */
export function useDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentMetadataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<ServiceError | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!user?.entityId || user.role !== "startup") return;

    setLoading(true);
    setError(null);
    const result = await getDocuments(user.entityId);

    if (result.error) {
      setError(result.error);
      console.error("fetchDocuments error:", result.error);
    } else {
      setDocuments(result.data ?? []);
    }

    setLoading(false);
  }, [user?.entityId, user?.role]);

  // Fetch on mount and whenever entityId changes
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUpload = useCallback(
    async (params: Omit<DocumentUploadParams, "startupId" | "uploadedBy">) => {
      if (!user || user.role !== "startup") return;

      setUploading(true);

      const result = await uploadDocument({
        ...params,
        startupId: user.entityId,
        uploadedBy: user.id,
      });

      setUploading(false);

      if (result.error) {
        toast.error(result.error.message);
        return;
      }

      if (result.data) {
        setDocuments((prev) => [result.data!, ...prev]);
        toast.success("Document uploaded successfully.");
        
        // Refetch documents after a short delay to ensure Firestore is updated
        setTimeout(() => {
          fetchDocuments();
        }, 1000);
      }
    },
    [user, fetchDocuments]
  );

  const handleDelete = useCallback(
    async (documentId: string, fileUrl: string) => {
      const result = await deleteDocument(documentId, fileUrl);

      if (result.error) {
        toast.error(result.error.message);
        return;
      }

      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
      toast.success("Document deleted.");
    },
    []
  );

  return {
    documents,
    loading,
    uploading,
    error,
    handleUpload,
    handleDelete,
    refresh: fetchDocuments,
  };
}
