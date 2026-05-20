"use client";

import { useState, useEffect, useCallback } from "react";
import { getDocs, query, where } from "firebase/firestore";
import { Heart, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/hooks/useAuth";
import { mentorInterestsCollection } from "@/firebase/collections";
import { getStartupById } from "@/services/firebase/firestore.service";
import { formatDate } from "@/lib/formatters";
import type { InterestRecord } from "@/types/matching.types";
import type { StartupDocument } from "@/types/startup.types";
import { Skeleton } from "@/components/ui/skeleton";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface InterestWithStartup {
  interest: InterestRecord;
  startup: StartupDocument;
  daysWaiting: number;
}

export default function MentorInterestedPage() {
  const { user } = useAuth();
  const [interests, setInterests] = useState<InterestWithStartup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInterests = useCallback(async () => {
    if (!user || user.role !== "mentor") return;
    setLoading(true);
    try {
      const q = query(
        mentorInterestsCollection,
        where("mentorId", "==", user.entityId),
        where("status", "==", "pending")
      );
      const snapshot = await getDocs(q);

      const rels = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const interest = { ...docSnap.data(), id: docSnap.id } as InterestRecord;
          const startupResult = await getStartupById(interest.startupId);
          if (!startupResult.data) return null;

          const createdMs = interest.createdAt?.seconds ? interest.createdAt.seconds * 1000 : Date.now();
          const daysWaiting = Math.floor((Date.now() - createdMs) / (1000 * 60 * 60 * 24));

          return { interest, startup: startupResult.data, daysWaiting };
        })
      );

      setInterests(rels.filter(Boolean) as InterestWithStartup[]);
    } catch { /* Silently fail */ }
    setLoading(false);
  }, [user?.entityId, user?.role]);

  useEffect(() => {
    if (!user) return;
    fetchInterests();
  }, [user?.entityId, fetchInterests]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Interested Startups</h1>
          <p className="mt-1 text-muted-foreground">Startups you&apos;ve expressed interest in. Waiting for their response.</p>
        </div>
        {interests.length > 0 && (
          <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1">
            <Heart className="h-3.5 w-3.5 mr-1" />
            {interests.length} Pending
          </Badge>
        )}
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6 space-y-3"><Skeleton className="h-5 w-32" /><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-full" /></CardContent></Card>
          ))}
        </div>
      )}

      {!loading && interests.length === 0 && (
        <div className="rounded-md border border-dashed px-4 py-12 text-center">
          <Heart className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="font-medium text-muted-foreground">No pending interests yet</p>
          <p className="text-sm text-muted-foreground mt-1">Browse startups and express interest to connect with founders.</p>
          <Link href="/mentor/matching" className="mt-4 inline-block">
            <Button size="sm" className="gap-2">
              Find Startups <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      {!loading && interests.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {interests.map(({ interest, startup, daysWaiting }) => (
            <Card key={interest.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{startup.name}</CardTitle>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="default" className="text-xs">{startup.industry}</Badge>
                  <Badge variant="secondary" className="text-xs">{startup.stage}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {startup.description && (
                  <p className="line-clamp-2 text-xs">{startup.description}</p>
                )}
                {startup.goals && startup.goals.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {startup.goals.slice(0, 2).map((goal) => (
                      <Badge key={goal} variant="outline" className="text-xs">{goal}</Badge>
                    ))}
                  </div>
                )}
                <div className="pt-2 border-t space-y-1.5">
                  <div className="flex justify-between">
                    <span>Status</span>
                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                      <Clock className="h-3 w-3 mr-1" />Awaiting Response
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Expressed</span>
                    <span>{formatDate(interest.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Waiting</span>
                    <span className={daysWaiting > 7 ? "text-orange-600 font-medium" : ""}>
                      {daysWaiting === 0 ? "Today" : `${daysWaiting} day${daysWaiting !== 1 ? "s" : ""}`}
                    </span>
                  </div>
                </div>
                {daysWaiting > 7 && (
                  <p className="text-xs text-orange-600 bg-orange-50 rounded px-2 py-1">
                    No response yet. The startup may still be reviewing applications.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
