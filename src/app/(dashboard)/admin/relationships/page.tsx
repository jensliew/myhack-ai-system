"use client";

import { useState, useEffect, useCallback } from "react";
import { getDocs, query, where } from "firebase/firestore";
import { Search, TrendingUp, Users, CheckCircle2, Activity } from "lucide-react";

import { relationshipsCollection } from "@/firebase/collections";
import { getMentorById, getStartupById } from "@/services/firebase/firestore.service";
import { formatDate, formatScore } from "@/lib/formatters";
import type { RelationshipRecord } from "@/types/matching.types";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

interface EnrichedRelationship {
  relationship: RelationshipRecord;
  mentorName: string;
  startupName: string;
}

function HealthBadge({ score, meetings }: { score: number; meetings: number }) {
  if (score >= 70 && meetings >= 2) return <Badge className="bg-green-100 text-green-800 text-xs">Excellent</Badge>;
  if (score >= 40 || meetings >= 1) return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Growing</Badge>;
  return <Badge className="bg-red-100 text-red-800 text-xs">Needs Attention</Badge>;
}

export default function AdminRelationshipsPage() {
  const [relationships, setRelationships] = useState<EnrichedRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchRelationships = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(relationshipsCollection);
      const enriched = await Promise.all(
        snapshot.docs.map(async (d) => {
          const rel = { ...d.data(), id: d.id } as RelationshipRecord;
          const [mentorResult, startupResult] = await Promise.all([
            getMentorById(rel.mentorId),
            getStartupById(rel.startupId),
          ]);
          return {
            relationship: rel,
            mentorName: mentorResult.data?.name ?? rel.mentorId,
            startupName: startupResult.data?.name ?? rel.startupId,
          };
        })
      );
      // Sort by createdAt desc
      enriched.sort((a, b) => (b.relationship.createdAt?.seconds ?? 0) - (a.relationship.createdAt?.seconds ?? 0));
      setRelationships(enriched);
    } catch { /* Silently fail */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRelationships(); }, [fetchRelationships]);

  const filtered = relationships.filter((r) => {
    if (statusFilter && r.relationship.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return r.mentorName.toLowerCase().includes(s) || r.startupName.toLowerCase().includes(s);
    }
    return true;
  });

  const counts = {
    total: relationships.length,
    active: relationships.filter(r => r.relationship.status === "active").length,
    completed: relationships.filter(r => r.relationship.status === "completed").length,
    avgEngagement: relationships.length > 0
      ? Math.round(relationships.reduce((s, r) => s + r.relationship.engagementScore, 0) / relationships.length)
      : 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Relationships</h1>
        <p className="mt-1 text-muted-foreground">Monitor all mentor-startup relationships and engagement.</p>
      </div>

      {/* Summary */}
      {!loading && (
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: "Total", value: counts.total, icon: Users, color: "text-foreground" },
            { label: "Active", value: counts.active, icon: Activity, color: "text-green-600" },
            { label: "Completed", value: counts.completed, icon: CheckCircle2, color: "text-blue-600" },
            { label: "Avg Engagement", value: `${counts.avgEngagement}%`, icon: TrendingUp, color: "text-purple-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <Icon className={`h-8 w-8 opacity-50 ${color}`} />
                <div><p className={`text-2xl font-bold ${color}`}>{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search mentor or startup..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>
        {(search || statusFilter) && (
          <button onClick={() => { setSearch(""); setStatusFilter(""); }} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Clear
          </button>
        )}
      </div>

      {loading && (
        <div className="rounded-md border p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4"><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-16" /></div>
          ))}
        </div>
      )}

      {!loading && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Startup</TableHead>
                <TableHead>Mentor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Engagement</TableHead>
                <TableHead>Meetings</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Started</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Users className="mx-auto h-10 w-10 text-muted-foreground/30 mb-2" />
                    <p className="text-muted-foreground">No relationships found{search || statusFilter ? " matching your filters" : ""}.</p>
                  </TableCell>
                </TableRow>
              )}
              {filtered.map(({ relationship, mentorName, startupName }) => (
                <TableRow key={relationship.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{startupName}</TableCell>
                  <TableCell>{mentorName}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${relationship.status === "active" ? "bg-green-100 text-green-800" : relationship.status === "completed" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}>
                      {relationship.status}
                    </Badge>
                  </TableCell>
                  <TableCell><HealthBadge score={relationship.engagementScore} meetings={relationship.meetingCount} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-secondary overflow-hidden">
                        <div className={`h-full ${relationship.engagementScore >= 70 ? "bg-green-500" : relationship.engagementScore >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                          style={{ width: `${relationship.engagementScore}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{formatScore(relationship.engagementScore)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{relationship.meetingCount}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {relationship.source === "ai_recommendation" ? "AI Match" : "Mentor Interest"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(relationship.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length > 0 && (
            <div className="px-4 py-2 border-t text-xs text-muted-foreground">
              Showing {filtered.length} of {relationships.length} relationships
            </div>
          )}
        </div>
      )}
    </div>
  );
}
