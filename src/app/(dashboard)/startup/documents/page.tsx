"use client";

import { useState, useRef, useCallback } from "react";
import {
  FileText,
  Upload,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  Brain,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  CloudUpload,
  File,
  Sparkles,
} from "lucide-react";

import { useDocuments } from "@/hooks/useDocuments";
import { formatDate } from "@/lib/formatters";
import { MAX_FILE_SIZE_BYTES } from "@/lib/validators";
import type { DocumentType, DocumentVisibility } from "@/types/document.types";
import { Skeleton } from "@/components/ui/skeleton";

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

const documentTypeConfig: Record<
  DocumentType,
  { label: string; description: string; color: string; iconColor: string; bgColor: string }
> = {
  "meeting-minutes": {
    label: "Meeting Minutes",
    description: "Track mentor-startup meetings",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    iconColor: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  "monthly-report": {
    label: "Monthly Report",
    description: "Monthly progress updates",
    color: "bg-violet-50 text-violet-700 border-violet-200",
    iconColor: "text-violet-500",
    bgColor: "bg-violet-50",
  },
  general: {
    label: "General",
    description: "Other documents",
    color: "bg-slate-50 text-slate-700 border-slate-200",
    iconColor: "text-slate-500",
    bgColor: "bg-slate-50",
  },
};

export default function StartupDocumentsPage() {
  const { documents, loading, uploading, handleUpload, handleDelete } = useDocuments();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>("general");
  const [visibility, setVisibility] = useState<DocumentVisibility>("public");
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const meetingMinutesCount = documents.filter((d) => d.documentType === "meeting-minutes").length;
  const monthlyReportCount = documents.filter((d) => d.documentType === "monthly-report").length;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    validateAndSetFile(file);
  }

  function validateAndSetFile(file: File | null) {
    setFileError(null);
    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      setFileError("File size exceeds 10 MB limit.");
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] ?? null;
    validateAndSetFile(file);
  }, []);

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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Upload and manage your documents. AI analyzes meeting minutes and reports automatically.
          </p>
        </div>
        <Badge variant="secondary" className="text-[10px] font-medium px-2 py-1 gap-1">
          <Sparkles className="h-3 w-3 text-primary" />
          AI-Powered Analysis
        </Badge>
      </div>

      {/* Stats */}
      {documents.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-slate-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                <FileText className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{documents.length}</p>
                <p className="text-[11px] text-muted-foreground">Total Documents</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                <Brain className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-blue-700">{meetingMinutesCount}</p>
                <p className="text-[11px] text-muted-foreground">Meeting Minutes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-violet-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50">
                <TrendingUp className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-violet-700">{monthlyReportCount}</p>
                <p className="text-[11px] text-muted-foreground">Monthly Reports</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upload Section */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-transparent border-b pb-4">
          <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Upload className="h-3.5 w-3.5 text-primary" />
            </div>
            Upload Document
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : selectedFile
                    ? "border-emerald-300 bg-emerald-50/50"
                    : "border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="file"
              />

              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-foreground">{selectedFile.name}</p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">
                      {(selectedFile.size / 1024).toFixed(1)} KB — Ready to upload
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-[11px] text-muted-foreground mt-1 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    Change file
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/60">
                    <CloudUpload className="h-7 w-7 text-muted-foreground/60" />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-foreground">
                      Drop your file here, or <span className="text-primary">browse</span>
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      Supports .txt, .pdf, .doc, .docx — Max 10 MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {fileError && (
              <div className="rounded-lg bg-destructive/5 border border-destructive/20 px-4 py-2.5 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-[12px] text-destructive">{fileError}</p>
              </div>
            )}

            {/* Type & Visibility */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">
                  Document Type <span className="text-destructive">*</span>
                </Label>
                <Select value={documentType} onValueChange={(v) => setDocumentType(v as DocumentType)}>
                  <SelectTrigger className="text-[13px] cursor-pointer h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(documentTypeConfig).map(([value, config]) => (
                      <SelectItem key={value} value={value} className="cursor-pointer py-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${value === "meeting-minutes" ? "bg-blue-500" : value === "monthly-report" ? "bg-violet-500" : "bg-slate-400"}`} />
                          <div>
                            <div className="text-[13px] font-medium">{config.label}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Visibility</Label>
                <Select value={visibility} onValueChange={(v) => setVisibility(v as DocumentVisibility)}>
                  <SelectTrigger className="text-[13px] cursor-pointer h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public" className="cursor-pointer py-2.5">
                      <div className="flex items-center gap-2 text-[13px]">
                        <Eye className="h-3.5 w-3.5 text-emerald-500" />
                        Public (mentors & admin)
                      </div>
                    </SelectItem>
                    <SelectItem value="private" className="cursor-pointer py-2.5">
                      <div className="flex items-center gap-2 text-[13px]">
                        <EyeOff className="h-3.5 w-3.5 text-amber-500" />
                        Private (startup only)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* AI Analysis Info Banners */}
            {documentType === "meeting-minutes" && (
              <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-100 px-5 py-4 flex items-start gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 shrink-0">
                  <Brain className="h-4.5 w-4.5 text-blue-600" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-blue-900">AI Analysis Enabled</p>
                  <p className="text-[12px] text-blue-700/80 mt-0.5 leading-relaxed">
                    Gemini will extract engagement score, key discussion topics, action items, and automatically update your mentor relationship metrics.
                  </p>
                </div>
              </div>
            )}
            {documentType === "monthly-report" && (
              <div className="rounded-xl bg-gradient-to-r from-violet-50 to-purple-50/50 border border-violet-100 px-5 py-4 flex items-start gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 shrink-0">
                  <TrendingUp className="h-4.5 w-4.5 text-violet-600" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-violet-900">AI Analysis Enabled</p>
                  <p className="text-[12px] text-violet-700/80 mt-0.5 leading-relaxed">
                    Gemini will assess project health, milestone progress, and compute a success score for your startup automatically.
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center gap-3 pt-1">
              <Button
                type="submit"
                disabled={!selectedFile || uploading}
                className="gap-2 text-[13px] px-6 cursor-pointer"
                size="lg"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading & Analyzing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload Document
                  </>
                )}
              </Button>
              {!selectedFile && (
                <p className="text-[11px] text-muted-foreground">Select a file to continue</p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Document List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-semibold">Your Documents</h2>
          {documents.length > 0 && (
            <p className="text-[11px] text-muted-foreground">{documents.length} document{documents.length !== 1 ? "s" : ""}</p>
          )}
        </div>

        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border px-5 py-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && documents.length === 0 && (
          <div className="rounded-xl border-2 border-dashed px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/60 mx-auto mb-4">
              <File className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-[15px] font-medium text-muted-foreground">No documents yet</p>
            <p className="text-[12px] text-muted-foreground/70 mt-1 max-w-sm mx-auto">
              Upload meeting minutes or monthly reports to track your progress and get AI-powered insights.
            </p>
          </div>
        )}

        {!loading && documents.length > 0 && (
          <div className="space-y-2">
            {documents.map((document) => {
              const typeConfig =
                documentTypeConfig[document.documentType as DocumentType] ?? documentTypeConfig.general;
              return (
                <div
                  key={document.id}
                  className="flex items-center justify-between rounded-xl border px-5 py-4 hover:bg-muted/20 transition-all duration-150 group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${typeConfig.bgColor}`}
                    >
                      <FileText className={`h-4.5 w-4.5 ${typeConfig.iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium truncate">{document.fileName}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-2 py-0.5 border ${typeConfig.color}`}
                        >
                          {typeConfig.label}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${document.visibility === "public" ? "text-emerald-700 border-emerald-200 bg-emerald-50" : "text-amber-700 border-amber-200 bg-amber-50"}`}>
                          {document.visibility === "public" ? (
                            <>
                              <Eye className="h-2.5 w-2.5 mr-0.5" />
                              Public
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-2.5 w-2.5 mr-0.5" />
                              Private
                            </>
                          )}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(document.createdAt)}
                        </span>
                        {(document.documentType === "meeting-minutes" ||
                          document.documentType === "monthly-report") && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-2 py-0.5 text-emerald-700 border-emerald-200 bg-emerald-50 gap-0.5"
                          >
                            <Sparkles className="h-2.5 w-2.5" />
                            AI Analyzed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary cursor-pointer"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(document.id, document.fileUrl)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer"
                    >
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
