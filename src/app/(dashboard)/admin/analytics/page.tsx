"use client";

import { Users, Briefcase, Heart, Clock, TrendingUp, Award, Activity } from "lucide-react";

import { useAnalytics } from "@/hooks/useAnalytics";
import { MetricCard } from "@/components/charts/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAnalyticsPage() {
  const { metrics, loading } = useAnalytics();

  const matchRate = metrics.totalStartups > 0
    ? Math.round((metrics.activeRelationships / metrics.totalStartups) * 100)
    : 0;

  const approvalRate = metrics.totalUsers > 0
    ? Math.round(((metrics.totalStartups + metrics.totalMentors) / metrics.totalUsers) * 100)
    : 0;

  const avgMentorsPerStartup = metrics.totalStartups > 0
    ? (metrics.activeRelationships / metrics.totalStartups).toFixed(1)
    : "0";

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="mt-1 text-muted-foreground">Detailed ecosystem analytics and engagement metrics.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-8 w-16 mb-2" /><Skeleton className="h-4 w-24" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-muted-foreground">
          Detailed ecosystem analytics and engagement metrics.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard title="Total Users" value={metrics.totalUsers} icon={Users} color="violet" />
        <MetricCard title="Startups" value={metrics.totalStartups} icon={Briefcase} color="blue" />
        <MetricCard title="Mentors" value={metrics.totalMentors} icon={Users} color="teal" />
        <MetricCard title="Active Mentorships" value={metrics.activeRelationships} icon={Heart} color="rose" />
        <MetricCard title="Pending" value={metrics.pendingApplications} icon={Clock} color="amber" />
      </div>

      {/* Derived Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Match Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{matchRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Startups with active mentors</p>
            <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-primary transition-all duration-700" style={{ width: `${matchRate}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4" /> Approval Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{approvalRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Applications approved</p>
            <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-green-500 transition-all duration-700" style={{ width: `${approvalRate}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" /> Avg Mentors / Startup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{avgMentorsPerStartup}</div>
            <p className="text-xs text-muted-foreground mt-1">Active mentors per startup</p>
            <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${Math.min(Number(avgMentorsPerStartup) * 33, 100)}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ecosystem Breakdown */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Startups", value: metrics.totalStartups, total: metrics.totalUsers, color: "bg-blue-500" },
              { label: "Mentors", value: metrics.totalMentors, total: metrics.totalUsers, color: "bg-purple-500" },
              { label: "Pending", value: metrics.pendingApplications, total: metrics.totalUsers, color: "bg-yellow-500" },
            ].map(({ label, value, total, color }) => {
              const pct = total > 0 ? Math.round((value / total) * 100) : 0;
              return (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{value} <span className="text-muted-foreground">({pct}%)</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ecosystem Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                label: "Mentorship Coverage",
                value: matchRate,
                status: matchRate >= 60 ? "Healthy" : matchRate >= 30 ? "Growing" : "Needs Attention",
                color: matchRate >= 60 ? "text-green-600" : matchRate >= 30 ? "text-yellow-600" : "text-red-600",
                bg: matchRate >= 60 ? "bg-green-100 text-green-800" : matchRate >= 30 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800",
              },
              {
                label: "Application Pipeline",
                value: metrics.pendingApplications,
                status: metrics.pendingApplications === 0 ? "Clear" : metrics.pendingApplications <= 5 ? "Active" : "High Volume",
                color: metrics.pendingApplications === 0 ? "text-green-600" : "text-yellow-600",
                bg: metrics.pendingApplications === 0 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800",
              },
              {
                label: "Mentor-Startup Ratio",
                value: metrics.totalMentors,
                status: metrics.totalMentors >= metrics.totalStartups ? "Balanced" : "Mentor Needed",
                color: metrics.totalMentors >= metrics.totalStartups ? "text-green-600" : "text-orange-600",
                bg: metrics.totalMentors >= metrics.totalStartups ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800",
              },
            ].map(({ label, status, bg }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Badge className={`text-xs ${bg}`}>{status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Ecosystem Summary</p>
              <p className="text-sm text-muted-foreground mt-1">
                The platform has <strong>{metrics.totalUsers}</strong> registered users with <strong>{metrics.activeRelationships}</strong> active mentorships.
                {metrics.pendingApplications > 0 && ` There are ${metrics.pendingApplications} pending application${metrics.pendingApplications > 1 ? "s" : ""} awaiting review.`}
                {matchRate > 0 && ` ${matchRate}% of startups have active mentor relationships.`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
