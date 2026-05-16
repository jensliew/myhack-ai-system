"use client";

import { Users, Briefcase, Heart, Clock } from "lucide-react";

import { useAnalytics } from "@/hooks/useAnalytics";
import { MetricCard } from "@/components/charts/MetricCard";

export default function AdminDashboardPage() {
  const { metrics, loading } = useAnalytics();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Overview of ecosystem metrics and platform activity.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {!loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Startups"
            value={metrics.totalStartups}
            icon={Briefcase}
            description="Registered startups"
          />
          <MetricCard
            title="Total Mentors"
            value={metrics.totalMentors}
            icon={Users}
            description="Registered mentors"
          />
          <MetricCard
            title="Active Mentorships"
            value={metrics.activeRelationships}
            icon={Heart}
            description="Ongoing relationships"
          />
          <MetricCard
            title="Pending Applications"
            value={metrics.pendingApplications}
            icon={Clock}
            description="Awaiting review"
          />
        </div>
      )}
    </div>
  );
}
