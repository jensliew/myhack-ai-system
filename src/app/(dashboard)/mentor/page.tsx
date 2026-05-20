"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getDocs, query, where } from "firebase/firestore";
import { Briefcase, Heart, ArrowRight, Sparkles, Users, TrendingUp, Clock } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useStartupDiscovery } from "@/hooks/useStartupDiscovery";
import { relationshipsCollection, mentorInterestsCollection } from "@/firebase/collections";
import { MetricCard } from "@/components/charts/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { StartupDocument } from "@/types/startup.types";

export default function MentorDashboardPage() {
  const { user } = useAuth();
  const { allStartups, loading: startupsLoading } = useStartupDiscovery();
  const [activeCount, setActiveCount] = useState(0);
  const [interestedCount, setInterestedCount] = useState(0);
  const [countsLoading, setCountsLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    if (!user) return;
    setCountsLoading(true);
    try {
      const [activeSnapshot, interestedSnapshot] = await Promise.all([
        getDocs(query(relationshipsCollection, where("mentorId", "==", user.entityId), where("status", "==", "active"))),
        getDocs(query(mentorInterestsCollection, where("mentorId", "==", user.entityId), where("status", "==", "pending"))),
      ]);
      setActiveCount(activeSnapshot.size);
      setInterestedCount(interestedSnapshot.size);
    } catch { /* Silently fail */ }
    setCountsLoading(false);
  }, [user]);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  const previewStartups = allStartups.slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mentor Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Overview of your mentorship activities.</p>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-4">
        <MetricCard title="Available Startups" value={countsLoading ? "—" : allStartups.length} icon={Briefcase} description="Startups seeking mentors" />
        <MetricCard title="Pending Interests" value={countsLoading ? "—" : interestedCount} icon={Heart} description="Awaiting startup response" />
        <MetricCard title="Active Mentorships" value={countsLoading ? "—" : activeCount} icon={TrendingUp} description="Ongoing relationships" />
        <MetricCard title="Ecosystem Size" value={countsLoading ? "—" : allStartups.length + activeCount} icon={Users} description="Startups + relationships" />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* AI Matching */}
        <div className="rounded-lg border bg-gradient-to-r from-primary/10 to-primary/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">AI Startup Matching</h3>
              </div>
              <p className="text-sm text-muted-foreground">Get personalised startup recommendations based on your expertise and industry.</p>
            </div>
            <Link href="/mentor/matching" className="shrink-0">
              <Button size="sm" className="gap-1.5">
                View Matches <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Pending Interests */}
        <div className={`rounded-lg border p-4 ${interestedCount > 0 ? "bg-yellow-50 border-yellow-200" : "bg-card"}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-yellow-600" />
                <h3 className="font-semibold">Pending Interests</h3>
              </div>
              {interestedCount > 0 ? (
                <p className="text-sm text-muted-foreground">
                  You have <span className="font-semibold text-yellow-700">{interestedCount}</span> startup{interestedCount !== 1 ? "s" : ""} awaiting your interest response.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No pending interests. Browse startups to express interest.</p>
              )}
            </div>
            <Link href="/mentor/interested" className="shrink-0">
              <Button size="sm" variant="outline" className="gap-1.5">
                View <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Browse Startups Preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Browse Startups</h2>
            <p className="text-sm text-muted-foreground">Startups currently seeking mentors</p>
          </div>
          <Link href="/mentor/startups">
            <Button variant="ghost" size="sm" className="gap-1.5">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {startupsLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}><CardContent className="pt-6 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
              </CardContent></Card>
            ))}
          </div>
        )}

        {!startupsLoading && previewStartups.length === 0 && (
          <div className="rounded-md border border-dashed px-4 py-8 text-center">
            <Briefcase className="mx-auto h-10 w-10 text-muted-foreground/30 mb-2" />
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

      {/* Active Relationships Link */}
      {activeCount > 0 && (
        <div className="rounded-lg border bg-green-50 border-green-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <h3 className="font-semibold text-green-800">Active Mentorships</h3>
              </div>
              <p className="text-sm text-green-700">
                You have <span className="font-semibold">{activeCount}</span> active mentorship{activeCount !== 1 ? "s" : ""}. Track engagement and meetings.
              </p>
            </div>
            <Link href="/mentor/relationships">
              <Button size="sm" variant="outline" className="gap-1.5 border-green-300 text-green-700 hover:bg-green-100">
                View <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function StartupPreviewCard({ startup }: { startup: StartupDocument }) {
  return (
    <Card className="transition-shadow duration-200 hover:shadow-md cursor-pointer">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{startup.name}</CardTitle>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="default" className="text-xs">{startup.industry}</Badge>
          <Badge variant="secondary" className="text-xs">{startup.stage}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">{startup.description}</p>
        {startup.goals && startup.goals.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {startup.goals.slice(0, 2).map((goal) => (
              <Badge key={goal} variant="outline" className="text-xs">{goal}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
