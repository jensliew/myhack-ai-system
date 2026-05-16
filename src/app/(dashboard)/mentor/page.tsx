"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getDocs, query, where } from "firebase/firestore";
import { Briefcase, Heart, ArrowRight } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useStartupDiscovery } from "@/hooks/useStartupDiscovery";
import { relationshipsCollection } from "@/firebase/collections";
import { MetricCard } from "@/components/charts/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StartupDocument } from "@/types/startup.types";

export default function MentorDashboardPage() {
  const { user } = useAuth();
  const { allStartups, loading: startupsLoading } = useStartupDiscovery();
  const [activeCount, setActiveCount] = useState(0);

  const fetchRelationshipCount = useCallback(async () => {
    if (!user) return;
    try {
      const q = query(
        relationshipsCollection,
        where("mentorId", "==", user.entityId),
        where("status", "==", "active")
      );
      const snapshot = await getDocs(q);
      setActiveCount(snapshot.size);
    } catch {
      // Silently fail
    }
  }, [user]);

  useEffect(() => {
    fetchRelationshipCount();
  }, [fetchRelationshipCount]);

  // Show top 6 startups as a preview (no interested button)
  const previewStartups = allStartups.slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mentor Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Overview of your mentorship activities.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          title="Available Startups"
          value={allStartups.length}
          icon={Briefcase}
        />
        <MetricCard
          title="Active Mentorships"
          value={activeCount}
          icon={Heart}
        />
        <MetricCard
          title="Total in Ecosystem"
          value={allStartups.length + activeCount}
          icon={Briefcase}
          description="Startups + relationships"
        />
      </div>

      {/* Recent Startups Preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Startups</h2>
          <Link href="/mentor/startups">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>

        {startupsLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        {!startupsLoading && previewStartups.length === 0 && (
          <div className="rounded-md border border-dashed px-4 py-8 text-center">
            <p className="text-muted-foreground">No startups available yet.</p>
          </div>
        )}

        {!startupsLoading && previewStartups.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {previewStartups.map((startup) => (
              <StartupPreviewCard key={startup.id} startup={startup} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Simple startup card without the Interested button — for dashboard overview */
function StartupPreviewCard({ startup }: { startup: StartupDocument }) {
  return (
    <Card className="transition-shadow duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{startup.name}</CardTitle>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="default" className="text-xs">{startup.industry}</Badge>
          <Badge variant="secondary" className="text-xs">{startup.stage}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {startup.description}
        </p>
      </CardContent>
    </Card>
  );
}
