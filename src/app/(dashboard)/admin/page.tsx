"use client";

import Link from "next/link";
import { Users, Briefcase, Heart, Clock, ArrowRight, AlertTriangle, CheckCircle2, TrendingUp, BarChart3 } from "lucide-react";

import { useAnalytics } from "@/hooks/useAnalytics";
import { MetricCard } from "@/components/charts/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardPage() {
  const { metrics, loading } = useAnalytics();

  const matchRate = metrics.totalStartups > 0
    ? Math.round((metrics.activeRelationships / metrics.totalStartups) * 100)
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-8 w-16 mb-2" /><Skeleton className="h-4 w-24" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Overview of ecosystem metrics and platform activity.</p>
      </div>

      {/* Alert for pending applications */}
      {metrics.pendingApplications > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">{metrics.pendingApplications} application{metrics.pendingApplications !== 1 ? "s" : ""}</span> pending review.
            </p>
          </div>
          <Link href="/admin/applications">
            <Button size="sm" className="gap-1.5 bg-yellow-600 hover:bg-yellow-700 text-white">
              Review Now <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Startups" value={metrics.totalStartups} icon={Briefcase} description="Registered startups" />
        <MetricCard title="Total Mentors" value={metrics.totalMentors} icon={Users} description="Registered mentors" />
        <MetricCard title="Active Mentorships" value={metrics.activeRelationships} icon={Heart} description="Ongoing relationships" />
        <MetricCard title="Pending Applications" value={metrics.pendingApplications} icon={Clock} description="Awaiting review" />
      </div>

      {/* Quick Actions + Ecosystem Health */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Review Applications", href: "/admin/applications", icon: Clock, badge: metrics.pendingApplications > 0 ? String(metrics.pendingApplications) : null, color: "text-yellow-600" },
              { label: "View Analytics", href: "/admin/analytics", icon: BarChart3, badge: null, color: "text-blue-600" },
              { label: "Manage Users", href: "/admin/users", icon: Users, badge: String(metrics.totalUsers), color: "text-purple-600" },
            ].map(({ label, href, icon: Icon, badge, color }) => (
              <Link key={href} href={href}>
                <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${color}`} />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Ecosystem Health */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ecosystem Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                label: "Mentorship Coverage",
                value: `${matchRate}%`,
                status: matchRate >= 60 ? "Healthy" : matchRate >= 30 ? "Growing" : "Needs Attention",
                badgeClass: matchRate >= 60 ? "bg-green-100 text-green-800" : matchRate >= 30 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800",
                barClass: matchRate >= 60 ? "bg-green-500" : matchRate >= 30 ? "bg-yellow-500" : "bg-red-500",
                barWidth: matchRate,
              },
              {
                label: "Mentor-Startup Ratio",
                value: `${metrics.totalMentors}:${metrics.totalStartups}`,
                status: metrics.totalMentors >= metrics.totalStartups ? "Balanced" : "Need More Mentors",
                badgeClass: metrics.totalMentors >= metrics.totalStartups ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800",
                barClass: metrics.totalMentors >= metrics.totalStartups ? "bg-green-500" : "bg-orange-500",
                barWidth: metrics.totalStartups > 0 ? Math.min((metrics.totalMentors / metrics.totalStartups) * 100, 100) : 0,
              },
              {
                label: "Application Pipeline",
                value: `${metrics.pendingApplications} pending`,
                status: metrics.pendingApplications === 0 ? "Clear" : metrics.pendingApplications <= 5 ? "Active" : "High Volume",
                badgeClass: metrics.pendingApplications === 0 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800",
                barClass: "bg-yellow-500",
                barWidth: Math.min(metrics.pendingApplications * 10, 100),
              },
            ].map(({ label, value, status, badgeClass, barClass, barWidth }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{value}</span>
                    <Badge className={`text-xs ${badgeClass}`}>{status}</Badge>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className={`h-full ${barClass} transition-all duration-700`} style={{ width: `${barWidth}%` }} />
                </div>
              </div>
            ))}

            <div className="pt-2 border-t flex items-center gap-2">
              {metrics.pendingApplications === 0 && metrics.activeRelationships > 0 ? (
                <><CheckCircle2 className="h-4 w-4 text-green-500" /><span className="text-xs text-green-700">Ecosystem is healthy</span></>
              ) : (
                <><TrendingUp className="h-4 w-4 text-blue-500" /><span className="text-xs text-muted-foreground">Platform is growing</span></>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
