"use client";

import { Users, Briefcase, Heart, Clock, TrendingUp } from "lucide-react";

import { useAnalytics } from "@/hooks/useAnalytics";
import { MetricCard } from "@/components/charts/MetricCard";

export default function AdminAnalyticsPage() {
  const { metrics, loading } = useAnalytics();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-muted-foreground">
          Detailed ecosystem analytics and engagement metrics.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {!loading && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard
              title="Total Users"
              value={metrics.totalUsers}
              icon={Users}
            />
            <MetricCard
              title="Startups"
              value={metrics.totalStartups}
              icon={Briefcase}
            />
            <MetricCard
              title="Mentors"
              value={metrics.totalMentors}
              icon={Users}
            />
            <MetricCard
              title="Active Mentorships"
              value={metrics.activeRelationships}
              icon={Heart}
            />
            <MetricCard
              title="Pending"
              value={metrics.pendingApplications}
              icon={Clock}
            />
          </div>

          <div className="rounded-md border p-6 text-center text-muted-foreground">
            <TrendingUp className="mx-auto h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">
              Detailed charts and trend analysis will be available as more data is collected.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
