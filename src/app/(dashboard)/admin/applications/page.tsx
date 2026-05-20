"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getDocs, query, where, updateDoc, doc, Timestamp } from "firebase/firestore";
import { CheckCircle, XCircle, Clock, Loader2, ChevronDown, ChevronUp, AlertTriangle, Sparkles, FileText } from "lucide-react";

import { usersCollection } from "@/firebase/collections";
import { getStartupById, getMentorById } from "@/services/firebase/firestore.service";
import { analyzeApplication } from "@/services/ai/verification.service";
import type { UserDocument } from "@/types/user.types";
import type { VerificationResult } from "@/types/ai.types";
import { Skeleton } from "@/components/ui/skeleton";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  useEffect(() => { fetchPendingApplications(); }, [fetchPendingApplications]);

  async function handleVerify(userId: string) {
    setApplications((prev) => prev.map((app) =>
      app.user.id === userId ? { ...app, verifying: true } : app
    ));

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
        profileData = { ...profileData, name: result.data.name, industry: result.data.industry, stage: result.data.stage, fundingStage: result.data.fundingStage, goals: result.data.goals, description: result.data.description, teamSize: result.data.teamSize, location: result.data.location };
      }
    } else if (app.user.role === "mentor") {
      const result = await getMentorById(app.user.entityId);
      if (result.data) {
        profileData = { ...profileData, name: result.data.name, expertise: result.data.expertise, industrySpecialization: result.data.industrySpecialization, experience: result.data.experience, availability: result.data.availability, bio: result.data.bio, mentorshipCount: result.data.mentorshipCount, successRate: result.data.successRate, location: result.data.location };
      }
    }

    const result = await analyzeApplication(userId, app.user.role as "startup" | "mentor", profileData, []);
    setApplications((prev) => prev.map((a) =>
      a.user.id === userId ? { ...a, verification: result.data, verifying: false, expanded: true } : a
    ));
  }

  async function handleDecision(userId: string, decision: "approved" | "rejected") {
    setActionLoading((prev) => ({ ...prev, [userId]: decision }));
    try {
      await updateDoc(doc(usersCollection, userId), { profileStatus: decision, updatedAt: Timestamp.now() });
      setApplications((prev) => prev.filter((app) => app.user.id !== userId));
      toast.success(`Application ${decision}.`);
    } catch {
      toast.error("Failed to update application status.");
    }
    setActionLoading((prev) => { const next = { ...prev }; delete next[userId]; return next; });
  }

  const recommendationConfig = (rec: string) => {
    switch (rec) {
      case "approve": return { label: "Approve", className: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle };
      case "reject": return { label: "Reject", className: "bg-red-100 text-red-800 border-red-200", icon: XCircle };
      default: return { label: "Pending Review", className: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock };
    }
  };

  const priorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high": return "text-red-600 bg-red-50 border-red-200";
      case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default: return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold tracking-tight">Applications</h1></div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6 space-y-3"><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-32" /><Skeleton className="h-8 w-36" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
          <p className="mt-1 text-muted-foreground">Review pending applications with AI verification assistance.</p>
        </div>
        {applications.length > 0 && (
          <Badge className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1">
            <Clock className="h-3.5 w-3.5 mr-1" />
            {applications.length} Pending
          </Badge>
        )}
      </div>

      {applications.length === 0 && (
        <div className="rounded-md border border-dashed px-4 py-12 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500/50 mb-3" />
          <p className="font-medium text-muted-foreground">All caught up!</p>
          <p className="text-sm text-muted-foreground mt-1">No pending applications to review.</p>
        </div>
      )}

      <div className="space-y-4">
        {applications.map(({ user, verification, verifying, expanded }) => {
          const recConfig = verification ? recommendationConfig(verification.recommendation) : null;
          const RecIcon = recConfig?.icon;

          return (
            <Card key={user.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base">{user.email}</CardTitle>
                      <Badge variant="outline" className="capitalize">{user.role}</Badge>
                      {verification && recConfig && (
                        <Badge className={`text-xs ${recConfig.className}`}>
                          {RecIcon && <RecIcon className="h-3 w-3 mr-1" />}
                          AI: {recConfig.label}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">ID: {user.entityId}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* AI Verification trigger */}
                {!verification && !verifying && (
                  <Button variant="outline" size="sm" onClick={() => handleVerify(user.id)} className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Run AI Verification
                  </Button>
                )}

                {verifying && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    AI is analyzing the application...
                  </div>
                )}

                {/* Verification Results */}
                {verification && (
                  <div className="space-y-3">
                    {/* Summary */}
                    <div className="rounded-md bg-muted/50 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">AI Assessment</span>
                        <button
                          onClick={() => setApplications(prev => prev.map(a => a.user.id === user.id ? { ...a, expanded: !a.expanded } : a))}
                          className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          {expanded ? <><ChevronUp className="h-3 w-3" />Less</> : <><ChevronDown className="h-3 w-3" />More</>}
                        </button>
                      </div>
                      {verification.summary.completenessAssessment && (
                        <p className="text-sm text-muted-foreground">{verification.summary.completenessAssessment}</p>
                      )}
                      {verification.summary.industryClassification && (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Industry:</span> {verification.summary.industryClassification}
                        </p>
                      )}
                    </div>

                    {/* Expanded: Missing Info + Improvement Suggestions */}
                    {expanded && (
                      <div className="space-y-3">
                        {/* Missing Info */}
                        {(verification as any).missing_info?.length > 0 && (
                          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              <span className="text-sm font-medium text-yellow-800">Outstanding Items</span>
                            </div>
                            <ul className="space-y-1">
                              {(verification as any).missing_info.map((item: string, i: number) => (
                                <li key={i} className="text-xs text-yellow-700 flex items-center gap-1.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 shrink-0" />
                                  {item.replace(/_/g, " ")}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Improvement Suggestions */}
                        {(verification as any).improvement_suggestions?.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Improvement Suggestions</span>
                            </div>
                            {(verification as any).improvement_suggestions.map((s: any, i: number) => (
                              <div key={i} className={`rounded-md border p-3 ${priorityColor(s.priority)}`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className={`text-xs ${priorityColor(s.priority)}`}>{s.priority}</Badge>
                                </div>
                                <p className="text-sm font-medium">{s.suggestion}</p>
                                {s.expected_impact && (
                                  <p className="text-xs mt-1 opacity-80">
                                    <span className="font-medium">Impact:</span> {s.expected_impact}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Admin Actions */}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={() => handleDecision(user.id, "approved")} disabled={!!actionLoading[user.id]} className="gap-1.5">
                    {actionLoading[user.id] === "approved" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDecision(user.id, "rejected")} disabled={!!actionLoading[user.id]} className="gap-1.5 text-destructive hover:text-destructive">
                    {actionLoading[user.id] === "rejected" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
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
