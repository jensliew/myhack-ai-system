"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { useTieredStartupRecommendations } from "@/hooks/useTieredStartupRecommendations";
import type { TieredStartupRecommendation } from "@/hooks/useTieredStartupRecommendations";
import { useMatching } from "@/hooks/useMatching";
import { StartupCard } from "@/components/cards/StartupCard";
import { expressInterest } from "@/services/matching/interest.service";
import { getStartupById } from "@/services/firebase/firestore.service";
import type { StartupDocument } from "@/types/startup.types";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Sparkles, Users, Zap } from "lucide-react";

type TierKey = "previousCollaborations" | "aiSuggested" | "expressedInterest";

const tierMeta: Record<
  TierKey,
  {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
  }
> = {
  previousCollaborations: {
    title: "Previous Collaborations",
    description: "Startups you've worked with before",
    icon: Users,
    accentColor: "text-emerald-600",
  },
  aiSuggested: {
    title: "AI Recommended",
    description: "Matched based on your expertise and startup needs",
    icon: Sparkles,
    accentColor: "text-primary",
  },
  expressedInterest: {
    title: "Your Interests",
    description: "Startups you've expressed interest in",
    icon: Zap,
    accentColor: "text-amber-600",
  },
};

export default function MentorMatchingPage() {
  const { user } = useAuth();
  const { tiers, loading, error, refresh, removeFromTier } =
    useTieredStartupRecommendations();
  const { isInterested } = useMatching();

  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});
  const [startupProfiles, setStartupProfiles] = useState<
    Record<string, StartupDocument>
  >({});

  // Filter out already-interested startups from recommendation tiers
  const filteredPreviousCollaborations = tiers.previousCollaborations.filter(
    (r) => !isInterested(r.startupId)
  );
  const filteredAiSuggested = tiers.aiSuggested.filter(
    (r) => !isInterested(r.startupId)
  );

  const allRecs: Array<TieredStartupRecommendation & { tierKey: TierKey }> = [
    ...filteredPreviousCollaborations.map((r) => ({
      ...r,
      tierKey: "previousCollaborations" as const,
    })),
    ...filteredAiSuggested.map((r) => ({ ...r, tierKey: "aiSuggested" as const })),
  ];

  // Fetch startup profiles
  useEffect(() => {
    async function loadProfiles() {
      const profiles: Record<string, StartupDocument> = {};
      for (const rec of allRecs) {
        if (!startupProfiles[rec.startupId]) {
          const result = await getStartupById(rec.startupId);
          if (result.data) profiles[rec.startupId] = result.data;
        }
      }
      if (Object.keys(profiles).length > 0) {
        setStartupProfiles((prev) => ({ ...prev, ...profiles }));
      }
    }
    if (allRecs.length > 0) loadProfiles();
  }, [allRecs.length, tiers, startupProfiles]);

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
    const TierIcon = meta.icon;

    return (
      <section>
        <div className="mb-5 flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-muted ${meta.accentColor}`}>
            <TierIcon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold">{meta.title}</h2>
            <p className="text-[12px] text-muted-foreground">{meta.description}</p>
          </div>
        </div>

        {!loading && items.length === 0 && (
          <div className="rounded-lg border border-dashed px-4 py-10 text-center">
            <p className="text-[13px] text-muted-foreground">
              No startups in this section yet.
            </p>
          </div>
        )}

        {items.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((rec) => {
              const startup = startupProfiles[rec.startupId];
              if (!startup) return null;

              return (
                <div key={`${tierKey}-${rec.startupId}`} className="relative">
                  <StartupCard
                    startup={{
                      ...startup,
                      description: rec.reasoning,
                    }}
                    onInterested={() => handleInterest(rec.startupId, tierKey)}
                    isInterested={false}
                    isLoading={actionLoading[rec.startupId] === "interest"}
                  />
                  {/* Match score badge */}
                  <Badge
                    className="absolute top-3 right-3 bg-primary text-primary-foreground text-[11px] font-semibold px-2 py-0.5 shadow-sm"
                  >
                    {rec.compatibilityScore}% match
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight">AI Matching</h1>
            <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0.5">
              <Sparkles className="h-3 w-3 mr-1" />
              Powered by Gemini
            </Badge>
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Personalised startup recommendations based on your expertise and their needs.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={loading}
          className="gap-1.5 text-[12px] cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-8">
          {["AI Recommended", "Previous Collaborations"].map((title) => (
            <div key={title}>
              <div className="mb-5 flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div>
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56 mt-1" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}><CardContent className="pt-5 space-y-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-9 w-full" />
                  </CardContent></Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive/30">
          <CardContent className="p-5">
            <p className="text-[13px] text-destructive font-medium">{error.message}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Ensure AI backend is running: cd ai-backend && npm start (port 3001)
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tiers */}
      {!loading && !error && (
        <>
          {renderTier("previousCollaborations", filteredPreviousCollaborations)}
          {filteredPreviousCollaborations.length > 0 && filteredAiSuggested.length > 0 && (
            <Separator />
          )}
          {renderTier("aiSuggested", filteredAiSuggested)}
        </>
      )}
    </div>
  );
}
