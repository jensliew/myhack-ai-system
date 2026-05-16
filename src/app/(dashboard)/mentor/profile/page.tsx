"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { mentorsCollection } from "@/firebase/collections";
import type { MentorDocument, MentorAvailability } from "@/types/mentor.types";

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
      } catch {
        // Profile doesn't exist yet
      }
      setLoading(false);
    }
    fetchProfile();
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);

    const profileData: Omit<MentorDocument, "id" | "createdAt" | "mentorshipCount" | "successRate"> & { createdAt?: unknown } = {
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
        <h1 className="text-2xl font-bold tracking-tight">Mentor Profile</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your mentor profile visible to startups.
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
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Availability</Label>
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
                <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Experience</Label>
                <Input id="experience" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g., 10+ years in FinTech" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expertise">Expertise (comma-separated)</Label>
              <Input id="expertise" value={expertise} onChange={(e) => setExpertise(e.target.value)} placeholder="e.g., Product Strategy, Fundraising, Go-to-Market" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry Specialization (comma-separated)</Label>
              <Input id="industry" value={industrySpecialization} onChange={(e) => setIndustrySpecialization(e.target.value)} placeholder="e.g., FinTech, SaaS, HealthTech" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Tell startups about yourself..."
              />
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
