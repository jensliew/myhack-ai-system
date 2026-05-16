"use client";

import { useState, useRef } from "react";
import { FileText, Upload, Trash2, Loader2, Eye, EyeOff } from "lucide-react";

import { useDocuments } from "@/hooks/useDocuments";
import { formatDate } from "@/lib/formatters";
import { MAX_FILE_SIZE_BYTES } from "@/lib/validators";
import type { DocumentType, DocumentVisibility } from "@/types/document.types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function StartupDocumentsPage() {
  const { documents, loading, uploading, handleUpload, handleDelete } =
    useDocuments();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>("general");
  const [visibility, setVisibility] = useState<DocumentVisibility>("public");
  const [fileError, setFileError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setFileError(null);

    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      setFileError("File size exceeds 10 MB limit.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;

    await handleUpload({
      file: selectedFile,
      documentType,
      visibility,
    });

    // Reset form
    setSelectedFile(null);
    setDocumentType("general");
    setVisibility("public");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="mt-1 text-muted-foreground">
          Upload and manage your startup documents.
        </p>
      </div>

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Document</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <input
                ref={fileInputRef}
                id="file"
                type="file"
                onChange={handleFileChange}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
              {fileError && (
                <p className="text-sm text-destructive">{fileError}</p>
              )}
              <p className="text-xs text-muted-foreground">Max file size: 10 MB</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select
                  value={documentType}
                  onValueChange={(v) => setDocumentType(v as DocumentType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting-minutes">Meeting Minutes</SelectItem>
                    <SelectItem value="monthly-report">Monthly Report</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select
                  value={visibility}
                  onValueChange={(v) => setVisibility(v as DocumentVisibility)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public (visible to mentors & admin)</SelectItem>
                    <SelectItem value="private">Private (startup only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={!selectedFile || uploading}>
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Document List */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Your Documents</h2>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        {!loading && documents.length === 0 && (
          <div className="rounded-md border border-dashed px-4 py-8 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">No documents uploaded yet.</p>
          </div>
        )}

        {!loading && documents.length > 0 && (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-md border px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.fileName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs">
                        {doc.documentType}
                      </Badge>
                      <Badge
                        variant={doc.visibility === "public" ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {doc.visibility === "public" ? (
                          <><Eye className="h-3 w-3 mr-1" />Public</>
                        ) : (
                          <><EyeOff className="h-3 w-3 mr-1" />Private</>
                        )}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(doc.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(doc.id, doc.fileUrl)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
