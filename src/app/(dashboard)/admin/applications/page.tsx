"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getDocs, query, where, updateDoc, doc, Timestamp } from "firebase/firestore";
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Sparkles,
  FileText,
  Shield,
  Brain,
  User,
  Briefcase,
  TrendingUp,
} from "lucide-react";

import { usersCollection } from "@/firebase/collections";
import { getStartupById, getMentorById } from "@/services/firebase/firestore.service";
import { analyzeApplication } from "@/services/ai/verification.service";
import type { UserDocument } from "@/types/user.types";
import type { VerificationResult } from "@/types/ai.types";
import { Skeleton } from "@/components/ui/skeleton";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PendingApplication {
  user: UserDocument;
  verification: VerificationResult | null;
  verifying: boolean;
  expanded: boolean;
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<PendingApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});

  const fetchPendingApplications = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(usersCollection, where("profileStatus", "==", "pending"));
      const snapshot = await getDocs(q);
      const apps: PendingApplication[] = snapshot.docs.map((docSnap) => ({
        user: { ...docSnap.data(), id: docSnap.id } as UserDocument,
        verification: null,
        verifying: false,
        expanded: false,
      }));
      setApplications(apps);
    } catch {
      toast.error("Failed to fetch pending applications.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPendingApplications();
  }, [fetchPendingApplications]);

  async function handleVerify(userId: string) {
    setApplications((prev) =>
      prev.map((app) => (app.user.id === userId ? { ...app, verifying: true } : app))
    );

    const app = applications.find((a) => a.user.id === userId);
    if (!app) return;

    let profileData: Record<string, unknown> = {
      email: app.user.email,
      role: app.user.role,
      entityId: app.user.entityId,
    };

    if (app.user.role === "startup") {
      const result = await getStartupById(app.user.entityId);
      if (result.data) {
        profileData = {
          ...profileData,
          name: result.data.name,
          industry: result.data.industry,
          stage: result.data.stage,
          fundingStage: result.data.fundingStage,
          goals: result.data.goals,
          description: result.data.description,
          teamSize: result.data.teamSize,
          location: result.data.location,
        };
      }
    } else if (app.user.role === "mentor") {
      const result = await getMentorById(app.user.entityId);
      if (result.data) {
        profileData = {
          ...profileData,
          name: result.data.name,
          expertise: result.data.expertise,
          industrySpecialization: result.data.industrySpecialization,
          experience: result.data.experience,
          availability: result.data.availability,
          bio: result.data.bio,
          mentorshipCount: result.data.mentorshipCount,
          successRate: result.data.successRate,
          location: result.data.location,
        };
      }
    }

    const result = await analyzeApplication(
      userId,
      app.user.role as "startup" | "mentor",
      profileData,
      []
    );
    setApplications((prev) =>
      prev.map((a) =>
        a.user.id === userId
          ? { ...a, verification: result.data, verifying: false, expanded: true }
          : a
      )
    );
  }

  async function handleDecision(userId: string, decision: "approved" | "rejected") {
    setActionLoading((prev) => ({ ...prev, [userId]: decision }));
    try {
      await updateDoc(doc(usersCollection, userId), {
        profileStatus: decision,
        updatedAt: Timestamp.now(),
      });
      setApplications((prev) => prev.filter((app) => app.user.id !== userId));
      toast.success(`Application ${decision}.`);
    } catch {
      toast.error("Failed to update application status.");
    }
    setActionLoading((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  }

  const recommendationConfig = (rec: string) => {
    switch (rec) {
      case "approve":
        return {
          label: "Approve",
          className: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: CheckCircle,
          color: "emerald",
        };
      case "reject":
        return {
          label: "Reject",
          className: "bg-rose-50 text-rose-700 border-rose-200",
          icon: XCircle,
          color: "rose",
        };
      default:
        return {
          label: "Needs Review",
          className: "bg-amber-50 text-amber-700 border-amber-200",
          icon: Clock,
          color: "amber",
        };
    }
  };

  const priorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "text-rose-700 bg-rose-50 border-rose-200";
      case "medium":
        return "text-amber-700 bg-amber-50 border-amber-200";
      default:
        return "text-blue-700 bg-blue-50 border-blue-200";
    }
  };

  const priorityDot = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-rose-500";
      case "medium":
        return "bg-amber-500";
      default:
        return "bg-blue-500";
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Review pending applications with AI verification.
          </p>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6 space-y-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-9 w-44" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
            <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0.5 gap-1">
              <Shield className="h-3 w-3 text-primary" />
              AI Verification
            </Badge>
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Review pending applications with Gemini-powered profile analysis and recommendations.
          </p>
        </div>
        {applications.length > 0 && (
          <Badge
            variant="outline"
            className="text-[12px] px-3 py-1.5 border-amber-200 bg-amber-50 text-amber-700 gap-1.5"
          >
            <Clock className="h-3.5 w-3.5" />
            {applications.length} Pending
          </Badge>
        )}
      </div>

      {/* Empty State */}
      {applications.length === 0 && (
        <div className="rounded-xl border-2 border-dashed px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 mx-auto mb-4">
            <CheckCircle className="h-7 w-7 text-emerald-500" />
          </div>
          <p className="text-[15px] font-medium text-foreground">All caught up!</p>
          <p className="text-[12px] text-muted-foreground mt-1">
            No pending applications to review.
          </p>
        </div>
      )}

      {/* Application Cards */}
      <div className="space-y-5">
        {applications.map(({ user, verification, verifying, expanded }) => {
          const recConfig = verification ? recommendationConfig(verification.recommendation) : null;
          const RecIcon = recConfig?.icon;
          const isStartup = user.role === "startup";

          return (
            <Card key={user.id} className="overflow-hidden">
              {/* Card Header with role indicator */}
              <CardHeader className="pb-4 border-b bg-gradient-to-r from-slate-50/80 to-transparent">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Role Avatar */}
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
                        isStartup ? "bg-blue-50" : "bg-teal-50"
                      }`}
                    >
                      {isStartup ? (
                        <Briefcase className="h-5 w-5 text-blue-600" />
                      ) : (
                        <User className="h-5 w-5 text-teal-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[14px] font-semibold">{user.email}</p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize px-2 py-0.5 ${
                            isStartup
                              ? "text-blue-700 border-blue-200 bg-blue-50"
                              : "text-teal-700 border-teal-200 bg-teal-50"
                          }`}
                        >
                          {user.role}
                        </Badge>
                        {verification && recConfig && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2 py-0.5 border gap-1 ${recConfig.className}`}
                          >
                            {RecIcon && <RecIcon className="h-3 w-3" />}
                            AI: {recConfig.label}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Entity: {user.entityId}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-5 space-y-4">
                {/* AI Verification Trigger */}
                {!verification && !verifying && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVerify(user.id)}
                    className="gap-2 cursor-pointer border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50"
                  >
                    <Sparkles className="h-4 w-4" />
                    Run AI Verification
                  </Button>
                )}

                {/* Loading State */}
                {verifying && (
                  <div className="rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50/50 border border-indigo-100 px-5 py-4 flex items-center gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 shrink-0">
                      <Loader2 className="h-4.5 w-4.5 text-indigo-600 animate-spin" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-indigo-900">
                        Analyzing application...
                      </p>
                      <p className="text-[11px] text-indigo-600 mt-0.5">
                        Gemini is reviewing profile completeness, credentials, and fit.
                      </p>
                    </div>
                  </div>
                )}

                {/* Verification Results */}
                {verification && (
                  <div className="space-y-4">
                    {/* AI Assessment Summary */}
                    <div className="rounded-xl border bg-card overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 to-transparent border-b">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-primary" />
                          <span className="text-[13px] font-semibold">AI Assessment</span>
                        </div>
                        <button
                          onClick={() =>
                            setApplications((prev) =>
                              prev.map((a) =>
                                a.user.id === user.id ? { ...a, expanded: !a.expanded } : a
                              )
                            )
                          }
                          className="text-[11px] text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
                        >
                          {expanded ? (
                            <>
                              <ChevronUp className="h-3 w-3" />
                              Collapse
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3" />
                              Expand
                            </>
                          )}
                        </button>
                      </div>
                      <div className="px-4 py-3 space-y-2">
                        {verification.summary.completenessAssessment && (
                          <p className="text-[13px] text-foreground leading-relaxed">
                            {verification.summary.completenessAssessment}
                          </p>
                        )}
                        {verification.summary.industryClassification && (
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="text-[10px] px-2 py-0.5 bg-violet-50 text-violet-700 border-violet-200"
                            >
                              <TrendingUp className="h-2.5 w-2.5 mr-1" />
                              {verification.summary.industryClassification}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expanded && (
                      <div className="space-y-4 pl-1">
                        {/* Missing Info */}
                        {(verification as any).missing_info?.length > 0 && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                              </div>
                              <span className="text-[13px] font-semibold text-amber-800">
                                Outstanding Items
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1.5 py-0 border-amber-300 text-amber-600 ml-auto"
                              >
                                {(verification as any).missing_info.length} items
                              </Badge>
                            </div>
                            <ul className="space-y-1.5">
                              {(verification as any).missing_info.map(
                                (item: string, i: number) => (
                                  <li
                                    key={i}
                                    className="text-[12px] text-amber-800 flex items-center gap-2"
                                  >
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                                    {item.replace(/_/g, " ")}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}

                        {/* Improvement Suggestions */}
                        {(verification as any).improvement_suggestions?.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100">
                                <FileText className="h-3.5 w-3.5 text-blue-600" />
                              </div>
                              <span className="text-[13px] font-semibold">
                                Improvement Suggestions
                              </span>
                            </div>
                            <div className="space-y-2">
                              {(verification as any).improvement_suggestions.map(
                                (s: any, i: number) => (
                                  <div
                                    key={i}
                                    className={`rounded-xl border p-4 ${priorityColor(s.priority)}`}
                                  >
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <span
                                        className={`h-2 w-2 rounded-full ${priorityDot(s.priority)}`}
                                      />
                                      <Badge
                                        variant="outline"
                                        className={`text-[9px] px-1.5 py-0 capitalize ${priorityColor(s.priority)}`}
                                      >
                                        {s.priority}
                                      </Badge>
                                    </div>
                                    <p className="text-[13px] font-medium">{s.suggestion}</p>
                                    {s.expected_impact && (
                                      <p className="text-[11px] mt-1.5 opacity-80">
                                        <span className="font-medium">Expected impact:</span>{" "}
                                        {s.expected_impact}
                                      </p>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Admin Decision Buttons */}
                <div className="flex items-center gap-3 pt-2 border-t">
                  <Button
                    size="sm"
                    onClick={() => handleDecision(user.id, "approved")}
                    disabled={!!actionLoading[user.id]}
                    className="gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-[13px]"
                  >
                    {actionLoading[user.id] === "approved" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDecision(user.id, "rejected")}
                    disabled={!!actionLoading[user.id]}
                    className="gap-1.5 cursor-pointer text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 text-[13px]"
                  >
                    {actionLoading[user.id] === "rejected" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
