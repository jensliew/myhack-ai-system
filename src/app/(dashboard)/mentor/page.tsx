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
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Overview of your mentorship activities and recommendations.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Available Startups" value={countsLoading ? "—" : allStartups.length} icon={Briefcase} color="blue" description="Seeking mentors" />
        <MetricCard title="Pending Interests" value={countsLoading ? "—" : interestedCount} icon={Heart} color="amber" description="Awaiting response" />
        <MetricCard title="Active Mentorships" value={countsLoading ? "—" : activeCount} icon={TrendingUp} color="emerald" description="Ongoing" />
        <MetricCard title="Ecosystem Size" value={countsLoading ? "—" : allStartups.length + activeCount} icon={Users} color="violet" description="Total connections" />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* AI Matching */}
        <Card className="border-primary/10 bg-gradient-to-br from-primary/[0.03] to-transparent">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="text-[14px] font-semibold">AI Matching</h3>
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Get personalised startup recommendations based on your expertise.
                </p>
              </div>
              <Link href="/mentor/matching" className="shrink-0">
                <Button size="sm" className="gap-1.5 text-[12px] cursor-pointer">
                  View <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Pending Interests */}
        <Card className={interestedCount > 0 ? "border-amber-200/60 bg-amber-50/30" : ""}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <h3 className="text-[14px] font-semibold">Pending Interests</h3>
                </div>
                {interestedCount > 0 ? (
                  <p className="text-[12px] text-muted-foreground leading-relaxed">
                    <span className="font-semibold text-amber-700">{interestedCount}</span> startup{interestedCount !== 1 ? "s" : ""} awaiting response.
                  </p>
                ) : (
                  <p className="text-[12px] text-muted-foreground leading-relaxed">
                    No pending interests. Browse startups to connect.
                  </p>
                )}
              </div>
              <Link href="/mentor/interested" className="shrink-0">
                <Button size="sm" variant="outline" className="gap-1.5 text-[12px] cursor-pointer">
                  View <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Browse Startups Preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[16px] font-semibold">Browse Startups</h2>
            <p className="text-[12px] text-muted-foreground">Startups currently seeking mentors</p>
          </div>
          <Link href="/mentor/startups">
            <Button variant="ghost" size="sm" className="gap-1.5 text-[12px] cursor-pointer">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {startupsLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}><CardContent className="pt-5 space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-full" />
              </CardContent></Card>
            ))}
          </div>
        )}

        {!startupsLoading && previewStartups.length === 0 && (
          <div className="rounded-lg border border-dashed px-4 py-10 text-center">
            <Briefcase className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-[13px] text-muted-foreground">No startups available yet.</p>
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
        <Card className="border-emerald-200/60 bg-emerald-50/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-[14px] font-semibold text-emerald-800">Active Mentorships</h3>
                </div>
                <p className="text-[12px] text-emerald-700">
                  <span className="font-semibold">{activeCount}</span> active mentorship{activeCount !== 1 ? "s" : ""}. Track engagement and meetings.
                </p>
              </div>
              <Link href="/mentor/relationships">
                <Button size="sm" variant="outline" className="gap-1.5 text-[12px] border-emerald-200 text-emerald-700 hover:bg-emerald-50 cursor-pointer">
                  View <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StartupPreviewCard({ startup }: { startup: StartupDocument }) {
  return (
    <Card className="transition-all duration-200 hover:shadow-sm hover:border-primary/20 cursor-pointer group">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-[14px] font-semibold group-hover:text-primary transition-colors duration-150">
          {startup.name}
        </CardTitle>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Badge variant="default" className="text-[10px] font-medium px-1.5 py-0">{startup.industry}</Badge>
          <Badge variant="secondary" className="text-[10px] font-medium px-1.5 py-0">{startup.stage}</Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed">{startup.description}</p>
        {startup.goals && startup.goals.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {startup.goals.slice(0, 2).map((goal) => (
              <Badge key={goal} variant="outline" className="text-[10px] px-1.5 py-0">{goal}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
