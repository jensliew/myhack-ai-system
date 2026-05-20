"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, CheckCircle2, Circle, Clock, AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { createMilestone, getMilestonesForRelationship, updateMilestoneStatus, deleteMilestone } from "@/services/milestones/milestone.service";
import { relationshipsCollection, mentorsCollection, startupsCollection } from "@/firebase/collections";
import type { MilestoneDocument, RelationshipRecord } from "@/types/matching.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const statusConfig: Record<MilestoneDocument["status"], { label: string; icon: React.ElementType; className: string }> = {
  pending: { label: "Pending", icon: Circle, className: "text-muted-foreground" },
  in_progress: { label: "In Progress", icon: Clock, className: "text-blue-600" },
  completed: { label: "Completed", icon: CheckCircle2, className: "text-green-600" },
  overdue: { label: "Overdue", icon: AlertTriangle, className: "text-red-600" },
};

function formatDate(ts: any): string {
  if (!ts?.seconds) return "";
  return new Date(ts.seconds * 1000).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export default function MilestonesPage() {
  const { relationshipId } = useParams<{ relationshipId: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [milestones, setMilestones] = useState<MilestoneDocument[]>([]);
  const [otherName, setOtherName] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    async function load() {
      if (!user || !relationshipId) return;
      const relSnap = await getDoc(doc(relationshipsCollection, relationshipId));
      if (!relSnap.exists()) return;
      const rel = { ...relSnap.data(), id: relSnap.id } as RelationshipRecord;

      if (user.role === "startup") {
        const snap = await getDoc(doc(mentorsCollection, rel.mentorId));
        if (snap.exists()) setOtherName(snap.data()?.name ?? "Mentor");
      } else {
        const snap = await getDoc(doc(startupsCollection, rel.startupId));
        if (snap.exists()) setOtherName(snap.data()?.name ?? "Startup");
      }

      const result = await getMilestonesForRelationship(relationshipId);
      if (result.data) setMilestones(result.data);
      setLoading(false);
    }
    load();
  }, [user, relationshipId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !title.trim()) return;
    setSaving(true);

    const result = await createMilestone({
      relationshipId,
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate ? { seconds: new Date(dueDate).getTime() / 1000, nanoseconds: 0 } as any : undefined,
      status: "pending",
      createdBy: user.id,
    });

    if (result.error) { toast.error(result.error.message); setSaving(false); return; }
    if (result.data) setMilestones((prev) => [...prev, result.data!]);
    setTitle(""); setDescription(""); setDueDate("");
    setShowForm(false);
    toast.success("Milestone created!");
    setSaving(false);
  }

  async function handleStatusChange(id: string, status: MilestoneDocument["status"]) {
    const result = await updateMilestoneStatus(id, status);
    if (result.error) { toast.error(result.error.message); return; }
    setMilestones((prev) => prev.map((m) => m.id === id ? { ...m, status } : m));
    if (status === "completed") toast.success("Milestone completed! 🎉");
  }

  async function handleDelete(id: string) {
    const result = await deleteMilestone(id);
    if (result.error) { toast.error(result.error.message); return; }
    setMilestones((prev) => prev.filter((m) => m.id !== id));
    toast.success("Milestone deleted.");
  }

  const completed = milestones.filter(m => m.status === "completed").length;
  const progress = milestones.length > 0 ? Math.round((completed / milestones.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Milestones</h1>
          <p className="text-sm text-muted-foreground">Track goals with {otherName}</p>
        </div>
      </div>

      {/* Progress */}
      {milestones.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Overall Progress</span>
              <span className="font-bold text-primary">{completed}/{milestones.length} completed ({progress}%)</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-primary transition-all duration-700" style={{ width: `${progress}%` }} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Milestone */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Goals & Milestones</h2>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Milestone
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3"><CardTitle className="text-sm">New Milestone</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Complete MVP prototype" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="desc">Description</Label>
                <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What needs to be done?" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="due">Due Date</Label>
                <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={saving} className="gap-1.5">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Create
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading && <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}

      {!loading && milestones.length === 0 && (
        <div className="rounded-md border border-dashed px-4 py-12 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="font-medium text-muted-foreground">No milestones yet</p>
          <p className="text-sm text-muted-foreground mt-1">Add milestones to track your progress together.</p>
        </div>
      )}

      <div className="space-y-3">
        {milestones.map((m) => {
          const cfg = statusConfig[m.status];
          const Icon = cfg.icon;
          const isOverdue = m.dueDate && m.status !== "completed" && (m.dueDate as any).seconds * 1000 < Date.now();

          return (
            <Card key={m.id} className={m.status === "completed" ? "opacity-75" : ""}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${cfg.className}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium ${m.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{m.title}</p>
                      <Badge className={`text-xs shrink-0 ${m.status === "completed" ? "bg-green-100 text-green-800" : m.status === "in_progress" ? "bg-blue-100 text-blue-800" : isOverdue ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}>
                        {isOverdue ? "Overdue" : cfg.label}
                      </Badge>
                    </div>
                    {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
                    {m.dueDate && <p className={`text-xs mt-1 ${isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>Due: {formatDate(m.dueDate)}</p>}
                    {m.completedAt && <p className="text-xs text-green-600 mt-0.5">Completed: {formatDate(m.completedAt)}</p>}

                    {/* Actions */}
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {m.status !== "completed" && (
                        <>
                          {m.status === "pending" && (
                            <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => handleStatusChange(m.id, "in_progress")}>Start</Button>
                          )}
                          {m.status === "in_progress" && (
                            <Button size="sm" className="h-6 text-xs px-2 bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange(m.id, "completed")}>
                              <CheckCircle2 className="h-3 w-3 mr-1" />Complete
                            </Button>
                          )}
                          {m.status === "pending" && (
                            <Button size="sm" variant="outline" className="h-6 text-xs px-2 text-destructive hover:text-destructive" onClick={() => handleDelete(m.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
