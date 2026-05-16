"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { useTieredStartupRecommendations } from "@/hooks/useTieredStartupRecommendations";
import type { TieredStartupRecommendation } from "@/hooks/useTieredStartupRecommendations";
import { StartupCard } from "@/components/cards/StartupCard";
import { expressInterest } from "@/services/matching/interest.service";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

type TierKey = "previousCollaborations" | "aiSuggested" | "expressedInterest";

const tierMeta: Record<
  TierKey,
  {
    title: string;
    description: string;
  }
> = {
  previousCollaborations: {
    title: "Previous Collaborations",
    description: "Startups you've worked with before",
  },
  aiSuggested: {
    title: "AI Suggested Startups",
    description: "Recommended based on your expertise and startup needs",
  },
  expressedInterest: {
    title: "Your Interests",
    description: "Startups you've expressed interest in",
  },
};

export default function MentorMatchingPage() {
  const { user } = useAuth();
  const { tiers, loading, error, refresh, removeFromTier } =
    useTieredStartupRecommendations();

  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});

  const allRecs: Array<TieredStartupRecommendation & { tierKey: TierKey }> = [
    ...tiers.previousCollaborations.map((r) => ({
      ...r,
      tierKey: "previousCollaborations" as const,
    })),
    ...tiers.aiSuggested.map((r) => ({ ...r, tierKey: "aiSuggested" as const })),
    ...tiers.expressedInterest.map((r) => ({
      ...r,
      tierKey: "expressedInterest" as const,
    })),
  ];

  async function handleInterest(startupId: string, tierKey: TierKey) {
    if (!user) return;
    setActionLoading((prev) => ({ ...prev, [startupId]: "interest" }));

    const result = await expressInterest(user.entityId, startupId, user.id);

    setActionLoading((prev) => {
      const next = { ...prev };
      delete next[startupId];
      return next;
    });

    if (result.error) {
      if (result.error.code !== "interest/already-exists") {
        toast.error(result.error.message);
      }
      return;
    }

    toast.success("Interest expressed successfully!");
    removeFromTier(startupId, tierKey);
  }

  function renderTier(tierKey: TierKey, items: TieredStartupRecommendation[]) {
    const meta = tierMeta[tierKey];

    return (
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">{meta.title}</h2>
          <p className="text-sm text-muted-foreground">{meta.description}</p>
        </div>

        {!loading && items.length === 0 && (
          <div className="rounded-md border border-dashed px-4 py-8 text-center">
            <p className="text-muted-foreground">
              No startups in this section yet.
            </p>
          </div>
        )}

        {items.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((rec) => (
              <div key={`${tierKey}-${rec.startupId}`} className="relative">
                <StartupCard
                  startup={{
                    id: rec.startupId,
                    name: rec.startupId,
                    industry: "",
                    stage: "seed",
                    fundingStage: "",
                    goals: [],
                    description: rec.reasoning,
                    teamSize: 0,
                    location: "",
                  }}
                  onInterested={() => handleInterest(rec.startupId, tierKey)}
                  isInterested={false}
                  isLoading={actionLoading[rec.startupId] === "interest"}
                />
                {/* Match score badge */}
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-semibold">
                  {rec.compatibilityScore}%
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Startup Matching</h1>
          <p className="mt-1 text-muted-foreground">
            AI-powered recommendations based on your expertise and startup needs.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error.message}
          <p className="mt-1 text-xs">
            Ensure AI backend is running: cd ai-backend && npm start (port 3002)
          </p>
        </div>
      )}

      {!loading && !error && (
        <>
          {renderTier("previousCollaborations", tiers.previousCollaborations)}
          {tiers.previousCollaborations.length > 0 && <Separator />}
          {renderTier("aiSuggested", tiers.aiSuggested)}
          {tiers.aiSuggested.length > 0 && <Separator />}
          {renderTier("expressedInterest", tiers.expressedInterest)}
        </>
      )}
    </div>
  );
}
