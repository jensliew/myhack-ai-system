"use client";

import { useState, useRef } from "react";
import { FileText, Upload, Trash2, Loader2, Eye, EyeOff, Brain, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";

import { useDocuments } from "@/hooks/useDocuments";
import { formatDate } from "@/lib/formatters";
import { MAX_FILE_SIZE_BYTES } from "@/lib/validators";
import type { DocumentType, DocumentVisibility } from "@/types/document.types";
import { Skeleton } from "@/components/ui/skeleton";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const documentTypeConfig: Record<DocumentType, { label: string; description: string; color: string }> = {
  "meeting-minutes": { label: "Meeting Minutes", description: "Track mentor-startup meetings", color: "bg-blue-100 text-blue-800" },
  "monthly-report": { label: "Monthly Report", description: "Monthly progress updates", color: "bg-purple-100 text-purple-800" },
  "general": { label: "General", description: "Other documents", color: "bg-gray-100 text-gray-800" },
};

export default function StartupDocumentsPage() {
  const { documents, loading, uploading, handleUpload, handleDelete } = useDocuments();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>("general");
  const [visibility, setVisibility] = useState<DocumentVisibility>("public");
  const [fileError, setFileError] = useState<string | null>(null);

  const meetingMinutesCount = documents.filter(d => d.documentType === "meeting-minutes").length;
  const monthlyReportCount = documents.filter(d => d.documentType === "monthly-report").length;

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
    await handleUpload({ file: selectedFile, documentType, visibility });
    setSelectedFile(null);
    setDocumentType("general");
    setVisibility("public");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="mt-1 text-muted-foreground">Upload and manage your startup documents. AI analyzes each document automatically.</p>
      </div>

      {/* Stats */}
      {documents.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-card px-4 py-3 flex items-center gap-3">
            <FileText className="h-8 w-8 text-muted-foreground/50" />
            <div>
              <p className="text-2xl font-bold">{documents.length}</p>
              <p className="text-xs text-muted-foreground">Total Documents</p>
            </div>
          </div>
          <div className="rounded-lg border bg-card px-4 py-3 flex items-center gap-3">
            <Brain className="h-8 w-8 text-blue-500/50" />
            <div>
              <p className="text-2xl font-bold">{meetingMinutesCount}</p>
              <p className="text-xs text-muted-foreground">Meeting Minutes</p>
            </div>
          </div>
          <div className="rounded-lg border bg-card px-4 py-3 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-purple-500/50" />
            <div>
              <p className="text-2xl font-bold">{monthlyReportCount}</p>
              <p className="text-xs text-muted-foreground">Monthly Reports</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Document
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">File <span className="text-destructive">*</span></Label>
              <input
                ref={fileInputRef}
                id="file"
                type="file"
                onChange={handleFileChange}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
              {fileError && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{fileError}</p>}
              {selectedFile && <p className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" />{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</p>}
              <p className="text-xs text-muted-foreground">Max file size: 10 MB. Supported: .txt, .pdf, .doc, .docx</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Document Type <span className="text-destructive">*</span></Label>
                <Select value={documentType} onValueChange={(v) => setDocumentType(v as DocumentType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(documentTypeConfig).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        <div>
                          <div className="font-medium">{config.label}</div>
                          <div className="text-xs text-muted-foreground">{config.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select value={visibility} onValueChange={(v) => setVisibility(v as DocumentVisibility)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2"><Eye className="h-3.5 w-3.5" />Public (mentors & admin)</div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2"><EyeOff className="h-3.5 w-3.5" />Private (startup only)</div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {documentType === "meeting-minutes" && (
              <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-700 flex items-start gap-2">
                <Brain className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                AI will analyze this meeting minutes to extract engagement score, key topics, action items, and update your mentor relationship metrics.
              </div>
            )}
            {documentType === "monthly-report" && (
              <div className="rounded-md bg-purple-50 border border-purple-200 px-3 py-2 text-xs text-purple-700 flex items-start gap-2">
                <TrendingUp className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                AI will analyze this report to assess project health, milestones, and success score.
              </div>
            )}

            <Button type="submit" disabled={!selectedFile || uploading} className="gap-2">
              {uploading ? <><Loader2 className="h-4 w-4 animate-spin" />Uploading & Analyzing...</> : <><Upload className="h-4 w-4" />Upload Document</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Document List */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Your Documents</h2>

        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-md border px-4 py-3">
                <Skeleton className="h-5 w-5 rounded" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && documents.length === 0 && (
          <div className="rounded-md border border-dashed px-4 py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="font-medium text-muted-foreground">No documents yet</p>
            <p className="text-sm text-muted-foreground mt-1">Upload meeting minutes or monthly reports to track your progress with mentors.</p>
          </div>
        )}

        {!loading && documents.length > 0 && (
          <div className="space-y-2">
            {documents.map((document) => {
              const typeConfig = documentTypeConfig[document.documentType as DocumentType] ?? documentTypeConfig.general;
              return (
                <div key={document.id} className="flex items-center justify-between rounded-md border px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{document.fileName}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <Badge className={`text-xs ${typeConfig.color}`}>{typeConfig.label}</Badge>
                        <Badge variant={document.visibility === "public" ? "secondary" : "outline"} className="text-xs">
                          {document.visibility === "public" ? <><Eye className="h-3 w-3 mr-1" />Public</> : <><EyeOff className="h-3 w-3 mr-1" />Private</>}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(document.createdAt)}</span>
                        {(document.documentType === "meeting-minutes" || document.documentType === "monthly-report") && (
                          <Badge variant="outline" className="text-xs text-green-700 border-green-200 bg-green-50">
                            <Brain className="h-3 w-3 mr-1" />AI Analyzed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </a>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(document.id, document.fileUrl)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
