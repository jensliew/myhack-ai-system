"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";

import { usersCollection } from "@/firebase/collections";
import { getStartupById, getMentorById } from "@/services/firebase/firestore.service";
import { analyzeApplication } from "@/services/ai/verification.service";
import type { UserDocument } from "@/types/user.types";
import type { VerificationResult } from "@/types/ai.types";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PendingApplication {
  user: UserDocument;
  verification: VerificationResult | null;
  verifying: boolean;
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

  // Run AI verification for an application
  async function handleVerify(userId: string) {
    setApplications((prev) =>
      prev.map((app) =>
        app.user.id === userId ? { ...app, verifying: true } : app
      )
    );

    const app = applications.find((a) => a.user.id === userId);
    if (!app) return;

    // Fetch full profile data for AI analysis
    let profileData: Record<string, unknown> = {
      email: app.user.email,
      role: app.user.role,
      entityId: app.user.entityId,
    };

    if (app.user.role === "startup") {
      const startupResult = await getStartupById(app.user.entityId);
      if (startupResult.data) {
        profileData = {
          ...profileData,
          name: startupResult.data.name,
          industry: startupResult.data.industry,
          stage: startupResult.data.stage,
          fundingStage: startupResult.data.fundingStage,
          goals: startupResult.data.goals,
          description: startupResult.data.description,
          teamSize: startupResult.data.teamSize,
          location: startupResult.data.location,
        };
      }
    } else if (app.user.role === "mentor") {
      const mentorResult = await getMentorById(app.user.entityId);
      if (mentorResult.data) {
        profileData = {
          ...profileData,
          name: mentorResult.data.name,
          expertise: mentorResult.data.expertise,
          industrySpecialization: mentorResult.data.industrySpecialization,
          experience: mentorResult.data.experience,
          availability: mentorResult.data.availability,
          bio: mentorResult.data.bio,
          mentorshipCount: mentorResult.data.mentorshipCount,
          successRate: mentorResult.data.successRate,
          location: mentorResult.data.location,
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
          ? { ...a, verification: result.data, verifying: false }
          : a
      )
    );
  }

  // Approve or reject an application
  async function handleDecision(userId: string, decision: "approved" | "rejected") {
    setActionLoading((prev) => ({ ...prev, [userId]: decision }));

    try {
      const userRef = doc(usersCollection, userId);
      await updateDoc(userRef, {
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

  const recommendationBadge = (rec: string) => {
    switch (rec) {
      case "approve":
        return <Badge className="bg-green-100 text-green-800">Approve</Badge>;
      case "reject":
        return <Badge className="bg-red-100 text-red-800">Reject</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
        <p className="mt-1 text-muted-foreground">
          Review pending applications with AI verification assistance.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {!loading && applications.length === 0 && (
        <div className="rounded-md border border-dashed px-4 py-8 text-center">
          <p className="text-muted-foreground">No pending applications.</p>
        </div>
      )}

      {!loading && applications.length > 0 && (
        <div className="space-y-4">
          {applications.map(({ user, verification, verifying }) => (
            <Card key={user.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{user.email}</CardTitle>
                  <Badge variant="secondary">{user.role}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Entity ID: {user.entityId}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* AI Verification */}
                {!verification && !verifying && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVerify(user.id)}
                  >
                    Run AI Verification
                  </Button>
                )}

                {verifying && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing application...
                  </div>
                )}

                {verification && (
                  <div className="rounded-md bg-muted/50 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">AI Recommendation:</span>
                      {recommendationBadge(verification.recommendation)}
                    </div>
                    {verification.summary.completenessAssessment && (
                      <p className="text-sm text-muted-foreground">
                        {verification.summary.completenessAssessment}
                      </p>
                    )}
                    {verification.summary.industryClassification && (
                      <p className="text-xs text-muted-foreground">
                        Industry: {verification.summary.industryClassification}
                      </p>
                    )}
                  </div>
                )}

                {/* Admin Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleDecision(user.id, "approved")}
                    disabled={!!actionLoading[user.id]}
                  >
                    {actionLoading[user.id] === "approved" && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDecision(user.id, "rejected")}
                    disabled={!!actionLoading[user.id]}
                  >
                    {actionLoading[user.id] === "rejected" && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
