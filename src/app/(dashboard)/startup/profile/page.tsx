"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { startupsCollection } from "@/firebase/collections";
import type { StartupDocument, StartupStage } from "@/types/startup.types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STAGE_OPTIONS: { value: StartupStage; label: string }[] = [
  { value: "idea", label: "Idea" },
  { value: "pre-seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series-a", label: "Series A" },
  { value: "series-b", label: "Series B" },
  { value: "growth", label: "Growth" },
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
        }
      } catch {
        // Profile doesn't exist yet — that's fine
      }
      setLoading(false);
    }
    fetchProfile();
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);

    const profileData: Record<string, unknown> = {
      userId: user.id,
      name,
      industry,
      stage,
      fundingStage,
      goals: goals.split(",").map((g) => g.trim()).filter(Boolean),
      description,
      teamSize: parseInt(teamSize) || 1,
      location,
      updatedAt: Timestamp.now(),
    };

    // Only include website if it has a value
    if (website.trim()) {
      profileData.website = website.trim();
    }

    try {
      const docRef = doc(startupsCollection, user.entityId);
      const existing = await getDoc(docRef);

      if (existing.exists()) {
        await setDoc(docRef, { ...profileData, createdAt: existing.data().createdAt }, { merge: true });
      } else {
        await setDoc(docRef, { ...profileData, id: user.entityId, createdAt: Timestamp.now() });
      }

      toast.success("Profile saved.");
    } catch {
      toast.error("Failed to save profile.");
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Startup Profile</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your startup information visible to mentors and admins.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Startup Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Industry</Label>
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
                <Label>Stage</Label>
                <Select value={stage} onValueChange={(v) => setStage(v as StartupStage)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STAGE_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
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
                <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goals">Goals (comma-separated)</Label>
              <Input id="goals" value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="e.g., Scale to SEA, Raise Series A" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Describe your startup..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website (optional)</Label>
              <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
            </div>

            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
