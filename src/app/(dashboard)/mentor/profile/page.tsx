"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { mentorsCollection } from "@/firebase/collections";
import type { MentorDocument, MentorAvailability } from "@/types/mentor.types";
import { Progress } from "@/components/ui/progress";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function MentorProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [expertise, setExpertise] = useState("");
  const [industrySpecialization, setIndustrySpecialization] = useState("");
  const [experience, setExperience] = useState("");
  const [availability, setAvailability] = useState<MentorAvailability>("part-time");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");

  // Profile completeness
  const completenessFields = [
    { label: "Full Name", filled: !!name.trim() },
    { label: "Expertise", filled: expertise.trim().split(",").filter(Boolean).length >= 2 },
    { label: "Industry", filled: !!industrySpecialization.trim() },
    { label: "Experience", filled: !!experience.trim() },
    { label: "Availability", filled: !!availability },
    { label: "Bio", filled: bio.trim().length >= 50 },
    { label: "Location", filled: !!location.trim() },
  ];
  const completedCount = completenessFields.filter(f => f.filled).length;
  const completenessPercent = Math.round((completedCount / completenessFields.length) * 100);
  const completenessColor = completenessPercent >= 80 ? "text-green-600" : completenessPercent >= 50 ? "text-yellow-600" : "text-red-600";

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      try {
        const docRef = doc(mentorsCollection, user.entityId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as MentorDocument;
          setName(data.name ?? "");
          setExpertise(data.expertise?.join(", ") ?? "");
          setIndustrySpecialization(data.industrySpecialization?.join(", ") ?? "");
          setExperience(data.experience ?? "");
          setAvailability(data.availability ?? "part-time");
          setBio(data.bio ?? "");
          setLocation(data.location ?? "");
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

    const profileData = {
      userId: user.id,
      name,
      expertise: expertise.split(",").map((e) => e.trim()).filter(Boolean),
      industrySpecialization: industrySpecialization.split(",").map((i) => i.trim()).filter(Boolean),
      experience,
      availability,
      bio,
      location,
      updatedAt: Timestamp.now(),
    };

    try {
      const docRef = doc(mentorsCollection, user.entityId);
      const existing = await getDoc(docRef);
      if (existing.exists()) {
        await setDoc(docRef, { ...profileData, createdAt: existing.data().createdAt, mentorshipCount: existing.data().mentorshipCount ?? 0, successRate: existing.data().successRate ?? 0 }, { merge: true });
      } else {
        await setDoc(docRef, { ...profileData, id: user.entityId, createdAt: Timestamp.now(), mentorshipCount: 0, successRate: 0 });
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
        <h1 className="text-2xl font-bold tracking-tight">Mentor Profile</h1>
        <p className="mt-1 text-muted-foreground">Manage your mentor profile visible to startups and admins.</p>
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
            <p className="text-xs text-muted-foreground mt-2">A complete profile improves AI matching and increases startup interest. Add at least 2 expertise areas and a detailed bio.</p>
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
                <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g., Raj Patel" />
              </div>
              <div className="space-y-2">
                <Label>Availability <span className="text-destructive">*</span></Label>
                <Select value={availability} onValueChange={(v) => setAvailability(v as MentorAvailability)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="limited">Limited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Singapore" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Experience <span className="text-destructive">*</span></Label>
                <Input id="experience" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g., 10+ years in FinTech" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expertise">
                Expertise <span className="text-destructive">*</span>
                <span className="text-xs text-muted-foreground ml-1">(comma-separated, min 2)</span>
              </Label>
              <Input id="expertise" value={expertise} onChange={(e) => setExpertise(e.target.value)} placeholder="e.g., Product Strategy, Fundraising, Go-to-Market, Scaling Teams" />
              <p className="text-xs text-muted-foreground">{expertise.split(",").filter(s => s.trim()).length} areas added</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">
                Industry Specialization <span className="text-destructive">*</span>
                <span className="text-xs text-muted-foreground ml-1">(comma-separated)</span>
              </Label>
              <Input id="industry" value={industrySpecialization} onChange={(e) => setIndustrySpecialization(e.target.value)} placeholder="e.g., FinTech, SaaS, HealthTech" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="bio">Bio <span className="text-destructive">*</span></Label>
                <span className={`text-xs ${bio.length >= 50 ? "text-green-600" : "text-muted-foreground"}`}>{bio.length} chars {bio.length < 50 && "(min 50)"}</span>
              </div>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Tell startups about your background, experience, and how you can help them succeed..."
              />
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
