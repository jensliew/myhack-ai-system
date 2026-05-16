"use client";

import { Users, Briefcase, Heart, Clock, TrendingUp, Activity, PieChart } from "lucide-react";

import { useAnalytics } from "@/hooks/useAnalytics";
import { MetricCard } from "@/components/charts/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  const { metrics, loading } = useAnalytics();

  // Simulated chart data based on metrics
  const matchRate = metrics.totalStartups > 0
    ? Math.round((metrics.activeRelationships / metrics.totalStartups) * 100)
    : 0;

  const approvalRate = metrics.totalStartups + metrics.totalMentors > 0
    ? Math.round(((metrics.totalStartups + metrics.totalMentors) / ((metrics.totalStartups + metrics.totalMentors) + metrics.pendingApplications)) * 100)
    : 0;

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
        <>
          {/* Metric Cards */}
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

          {/* Charts Row */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Ecosystem Growth Chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-medium">Ecosystem Growth</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-1 h-40 pt-4">
                  {[20, 35, 28, 45, 52, 48, 65, 72, 68, 80, 85, 92].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t bg-primary/70 transition-all duration-500 hover:bg-primary"
                        style={{ height: `${h}%` }}
                      />
                      <span className="text-[9px] text-muted-foreground">
                        {["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i]}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">Monthly active users over the past year</p>
              </CardContent>
            </Card>

            {/* Match Rate */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-medium">AI Match Rate</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center pt-4">
                <div className="relative h-32 w-32">
                  <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="12" className="text-muted/30" />
                    <circle
                      cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="12"
                      className="text-primary"
                      strokeDasharray={`${matchRate * 3.14} 314`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{matchRate}%</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">Startups with active mentors</p>
              </CardContent>
            </Card>
          </div>

          {/* Second Row */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Engagement Activity */}
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
                    { action: "Mentor expressed interest", time: "2 min ago", color: "bg-blue-500" },
                    { action: "Startup accepted mentor", time: "15 min ago", color: "bg-green-500" },
                    { action: "New startup registered", time: "1 hour ago", color: "bg-purple-500" },
                    { action: "AI verification completed", time: "2 hours ago", color: "bg-orange-500" },
                    { action: "Document uploaded", time: "3 hours ago", color: "bg-cyan-500" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${item.color}`} />
                      <span className="text-sm text-foreground flex-1">{item.action}</span>
                      <span className="text-xs text-muted-foreground">{item.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Platform Health */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-medium">Platform Health</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 pt-2">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Approval Rate</span>
                      <span className="font-medium">{approvalRate}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-green-500" style={{ width: `${approvalRate}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Mentor Engagement</span>
                      <span className="font-medium">73%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-blue-500" style={{ width: "73%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">AI Accuracy</span>
                      <span className="font-medium">87%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-purple-500" style={{ width: "87%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Startup Retention</span>
                      <span className="font-medium">91%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-orange-500" style={{ width: "91%" }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
