"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { startupsCollection } from "@/firebase/collections";
import type { StartupDocument, StartupStage, ProjectPhase } from "@/types/startup.types";
import { Progress } from "@/components/ui/progress";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const STAGE_OPTIONS: { value: StartupStage; label: string }[] = [
  { value: "idea", label: "Idea" },
  { value: "pre-seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series-a", label: "Series A" },
  { value: "series-b", label: "Series B" },
  { value: "growth", label: "Growth" },
];

const PHASE_OPTIONS: { value: ProjectPhase; label: string; description: string }[] = [
  { value: "initial", label: "Initial", description: "Matching phase - selecting mentors" },
  { value: "processing", label: "Processing", description: "Active mentorship - uploading documents" },
  { value: "final", label: "Final", description: "Feedback phase - completing evaluation" },
];

export default function StartupProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [stage, setStage] = useState<StartupStage>("idea");
  const [fundingStage, setFundingStage] = useState("");
  const [goals, setGoals] = useState("");
  const [description, setDescription] = useState("");
  const [teamSize, setTeamSize] = useState("1");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [projectPhase, setProjectPhase] = useState<ProjectPhase>("initial");

  // Profile completeness
  const completenessFields = [
    { label: "Startup Name", filled: !!name.trim() },
    { label: "Industry", filled: !!industry },
    { label: "Stage", filled: !!stage },
    { label: "Funding Stage", filled: !!fundingStage },
    { label: "Goals", filled: !!goals.trim() },
    { label: "Description", filled: description.trim().length >= 50 },
    { label: "Team Size", filled: parseInt(teamSize) > 0 },
    { label: "Location", filled: !!location.trim() },
    { label: "Website", filled: !!website.trim() },
  ];
  const completedCount = completenessFields.filter(f => f.filled).length;
  const completenessPercent = Math.round((completedCount / completenessFields.length) * 100);
  const completenessColor = completenessPercent >= 80 ? "text-green-600" : completenessPercent >= 50 ? "text-yellow-600" : "text-red-600";

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      try {
        const docRef = doc(startupsCollection, user.entityId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as StartupDocument;
          setName(data.name ?? "");
          setIndustry(data.industry ?? "");
          setStage(data.stage ?? "idea");
          setFundingStage(data.fundingStage ?? "");
          setGoals(data.goals?.join(", ") ?? "");
          setDescription(data.description ?? "");
          setTeamSize(String(data.teamSize ?? 1));
          setLocation(data.location ?? "");
          setWebsite(data.website ?? "");
          setProjectPhase(data.projectPhase ?? "initial");
        }
      } catch { /* Profile doesn't exist yet */ }
      setLoading(false);
    }
    fetchProfile();
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const profileData: Partial<StartupDocument> = {
      userId: user.id,
      name,
      industry,
      stage,
      fundingStage,
      goals: goals.split(",").map((g) => g.trim()).filter(Boolean),
      description,
      teamSize: parseInt(teamSize) || 1,
      location,
      projectPhase,
      updatedAt: Timestamp.now(),
    };
    if (website.trim()) profileData.website = website.trim();

    try {
      const docRef = doc(startupsCollection, user.entityId);
      const existing = await getDoc(docRef);
      if (existing.exists()) {
        await setDoc(docRef, profileData, { merge: true });
      } else {
        await setDoc(docRef, { ...profileData, id: user.entityId, createdAt: Timestamp.now() } as StartupDocument);
      }
      toast.success("Profile saved successfully.");
    } catch {
      toast.error("Failed to save profile.");
    }
    setSaving(false);
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Startup Profile</h1>
        <p className="mt-1 text-muted-foreground">Manage your startup information visible to mentors and admins.</p>
      </div>

      {/* Profile Completeness */}
      <Card className={completenessPercent >= 80 ? "border-green-200 bg-green-50/50" : completenessPercent >= 50 ? "border-yellow-200 bg-yellow-50/50" : "border-red-200 bg-red-50/50"}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Profile Completeness</span>
            <span className={`text-sm font-bold ${completenessColor}`}>{completenessPercent}%</span>
          </div>
          <Progress value={completenessPercent} className="h-2" />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {completenessFields.map(({ label, filled }) => (
              <Badge key={label} variant="outline" className={`text-xs gap-1 ${filled ? "border-green-300 text-green-700 bg-green-50" : "border-red-200 text-red-600 bg-red-50"}`}>
                {filled ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                {label}
              </Badge>
            ))}
          </div>
          {completenessPercent < 80 && (
            <p className="text-xs text-muted-foreground mt-2">Complete your profile to improve AI matching accuracy and increase mentor interest.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Startup Name <span className="text-destructive">*</span></Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g., SeaTong" />
              </div>
              <div className="space-y-2">
                <Label>Industry <span className="text-destructive">*</span></Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                  <SelectContent>
                    {["FinTech", "HealthTech", "EdTech", "E-Commerce", "SaaS", "AI/ML", "CleanTech", "AgriTech", "Logistics", "Other"].map((ind) => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Stage <span className="text-destructive">*</span></Label>
                <Select value={stage} onValueChange={(v) => setStage(v as StartupStage)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STAGE_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Funding Stage</Label>
                <Select value={fundingStage} onValueChange={setFundingStage}>
                  <SelectTrigger><SelectValue placeholder="Select funding stage" /></SelectTrigger>
                  <SelectContent>
                    {["Bootstrapped", "Pre-Seed", "Seed", "Series A", "Series B", "Series C+"].map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="teamSize">Team Size</Label>
                <Input id="teamSize" type="number" min="1" value={teamSize} onChange={(e) => setTeamSize(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Kuala Lumpur, Malaysia" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Project Phase</Label>
                <Select value={projectPhase} onValueChange={(v) => setProjectPhase(v as ProjectPhase)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PHASE_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <div><div className="font-medium">{p.label}</div><div className="text-xs text-muted-foreground">{p.description}</div></div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goals">Goals <span className="text-xs text-muted-foreground">(comma-separated)</span></Label>
              <Input id="goals" value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="e.g., Scale to SEA, Raise Series A, Reach 10K users" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
                <span className={`text-xs ${description.length >= 50 ? "text-green-600" : "text-muted-foreground"}`}>{description.length} chars {description.length < 50 && "(min 50)"}</span>
              </div>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Describe your startup, the problem you solve, and your target market..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourstartup.com" />
            </div>

            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
