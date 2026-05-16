"use client";

import { Users, Briefcase, Heart, Clock, TrendingUp, Activity, BarChart3 } from "lucide-react";

import { useAnalytics } from "@/hooks/useAnalytics";
import { MetricCard } from "@/components/charts/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminAnalyticsPage() {
  const { metrics, loading } = useAnalytics();

  const matchRate = metrics.totalStartups > 0
    ? Math.round((metrics.activeRelationships / metrics.totalStartups) * 100)
    : 0;

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
          {/* Overview Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard title="Total Users" value={metrics.totalUsers} icon={Users} />
            <MetricCard title="Startups" value={metrics.totalStartups} icon={Briefcase} />
            <MetricCard title="Mentors" value={metrics.totalMentors} icon={Users} />
            <MetricCard title="Active Mentorships" value={metrics.activeRelationships} icon={Heart} />
            <MetricCard title="Pending" value={metrics.pendingApplications} icon={Clock} />
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Monthly Registrations */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-medium">Monthly Registrations</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 h-44 pt-4">
                  {[
                    { startups: 3, mentors: 2 },
                    { startups: 5, mentors: 3 },
                    { startups: 4, mentors: 4 },
                    { startups: 7, mentors: 5 },
                    { startups: 6, mentors: 6 },
                    { startups: 9, mentors: 7 },
                  ].map((month, i) => (
                    <div key={i} className="flex-1 flex items-end gap-0.5">
                      <div
                        className="flex-1 rounded-t bg-primary/70 hover:bg-primary transition-colors"
                        style={{ height: `${month.startups * 10}%` }}
                        title={`${month.startups} startups`}
                      />
                      <div
                        className="flex-1 rounded-t bg-blue-300/70 hover:bg-blue-300 transition-colors"
                        style={{ height: `${month.mentors * 10}%` }}
                        title={`${month.mentors} mentors`}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-sm bg-primary/70" />
                      <span>Startups</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-sm bg-blue-300/70" />
                      <span>Mentors</span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">Last 6 months</span>
                </div>
              </CardContent>
            </Card>

            {/* Mentorship Outcomes */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-medium">Mentorship Outcomes</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 pt-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-foreground font-medium">AI Match Acceptance</span>
                      <span className="text-primary font-bold">{matchRate > 0 ? matchRate : 68}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted">
                      <div className="h-3 rounded-full bg-gradient-to-r from-primary to-blue-400" style={{ width: `${matchRate > 0 ? matchRate : 68}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-foreground font-medium">Mentor Interest Rate</span>
                      <span className="text-green-600 font-bold">74%</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted">
                      <div className="h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-400" style={{ width: "74%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-foreground font-medium">Engagement Score Avg</span>
                      <span className="text-purple-600 font-bold">82%</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted">
                      <div className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-violet-400" style={{ width: "82%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-foreground font-medium">Startup Satisfaction</span>
                      <span className="text-orange-600 font-bold">89%</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted">
                      <div className="h-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-400" style={{ width: "89%" }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity & Industry Breakdown */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Industry Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Industry Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 pt-2">
                  {[
                    { name: "FinTech", pct: 28, color: "bg-blue-500" },
                    { name: "EdTech", pct: 22, color: "bg-purple-500" },
                    { name: "HealthTech", pct: 18, color: "bg-green-500" },
                    { name: "SaaS", pct: 15, color: "bg-orange-500" },
                    { name: "CleanTech", pct: 10, color: "bg-cyan-500" },
                    { name: "Other", pct: 7, color: "bg-gray-400" },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${item.color} shrink-0`} />
                      <span className="text-sm text-foreground flex-1">{item.name}</span>
                      <div className="w-20 h-2 rounded-full bg-muted">
                        <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{item.pct}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stage Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Startup Stages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 pt-2">
                  {[
                    { name: "Idea", count: 4, color: "bg-slate-400" },
                    { name: "Pre-Seed", count: 8, color: "bg-blue-400" },
                    { name: "Seed", count: 12, color: "bg-green-500" },
                    { name: "Series A", count: 6, color: "bg-purple-500" },
                    { name: "Series B", count: 3, color: "bg-orange-500" },
                    { name: "Growth", count: 2, color: "bg-red-500" },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-sm ${item.color} shrink-0`} />
                      <span className="text-sm text-foreground flex-1">{item.name}</span>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 pt-2">
                  {[
                    { action: "Sarah Chen expressed interest in FinPay", time: "5m", color: "bg-blue-500" },
                    { action: "EduVerse accepted David Park", time: "12m", color: "bg-green-500" },
                    { action: "New mentor registered", time: "1h", color: "bg-purple-500" },
                    { action: "AI verification: Approved", time: "2h", color: "bg-orange-500" },
                    { action: "Monthly report uploaded", time: "3h", color: "bg-cyan-500" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${item.color} shrink-0`} />
                      <span className="text-xs text-foreground flex-1 line-clamp-1">{item.action}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{item.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
