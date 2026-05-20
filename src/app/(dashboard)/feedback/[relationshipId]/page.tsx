"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Star, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { submitFeedback, hasSubmittedFeedback, getFeedbackForRelationship } from "@/services/feedback/feedback.service";
import { createNotification } from "@/services/notifications/notification.service";
import { relationshipsCollection, mentorsCollection, startupsCollection, usersCollection } from "@/firebase/collections";
import type { RelationshipRecord, FeedbackDocument } from "@/types/matching.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const HIGHLIGHT_OPTIONS = [
  "Great communicator", "Very knowledgeable", "Always available",
  "Practical advice", "Strong network", "Helped with fundraising",
  "Technical expertise", "Strategic thinking", "Motivating", "Patient mentor",
];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`h-8 w-8 transition-colors ${(hover || value) >= star ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
          />
        </button>
      ))}
    </div>
  );
}

const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

export default function FeedbackPage() {
  const { relationshipId } = useParams<{ relationshipId: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [otherName, setOtherName] = useState("");
  const [otherEntityId, setOtherEntityId] = useState("");
  const [otherUserId, setOtherUserId] = useState("");
  const [relationship, setRelationship] = useState<RelationshipRecord | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<FeedbackDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user || !relationshipId) return;
      const relSnap = await getDoc(doc(relationshipsCollection, relationshipId));
      if (!relSnap.exists()) return;
      const rel = { ...relSnap.data(), id: relSnap.id } as RelationshipRecord;
      setRelationship(rel);

      // Get other party info
      if (user.role === "startup") {
        const snap = await getDoc(doc(mentorsCollection, rel.mentorId));
        if (snap.exists()) { setOtherName(snap.data()?.name ?? "Mentor"); setOtherEntityId(rel.mentorId); }
        // Get mentor's userId for notification
        const usersSnap = await getDoc(doc(usersCollection, rel.mentorId));
        if (usersSnap.exists()) setOtherUserId(usersSnap.id);
      } else {
        const snap = await getDoc(doc(startupsCollection, rel.startupId));
        if (snap.exists()) { setOtherName(snap.data()?.name ?? "Startup"); setOtherEntityId(rel.startupId); }
      }

      const submitted = await hasSubmittedFeedback(relationshipId, user.id);
      setAlreadySubmitted(submitted);

      const feedbackResult = await getFeedbackForRelationship(relationshipId);
      if (feedbackResult.data) setExistingFeedback(feedbackResult.data);

      setLoading(false);
    }
    load();
  }, [user, relationshipId]);

  const toggleHighlight = (h: string) => {
    setHighlights((prev) => prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h]);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !relationship || rating === 0 || wouldRecommend === null) {
      toast.error("Please provide a rating and recommendation answer.");
      return;
    }
    setSubmitting(true);

    const result = await submitFeedback({
      relationshipId,
      fromUserId: user.id,
      fromRole: user.role as "startup" | "mentor",
      toEntityId: otherEntityId,
      rating,
      comment,
      highlights,
      wouldRecommend,
    });

    if (result.error) {
      toast.error(result.error.message);
      setSubmitting(false);
      return;
    }

    // Send notification to other party
    if (otherUserId) {
      await createNotification(
        otherUserId,
        "feedback_received",
        "New Feedback Received",
        `You received a ${rating}-star feedback from your mentorship.`,
        `/feedback/${relationshipId}`
      );
    }

    toast.success("Feedback submitted! Thank you.");
    setAlreadySubmitted(true);
    setSubmitting(false);
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mentorship Feedback</h1>
          <p className="text-sm text-muted-foreground">Share your experience with {otherName}</p>
        </div>
      </div>

      {/* Existing feedback from other party */}
      {existingFeedback.filter(f => f.fromUserId !== user?.id).map((f) => (
        <Card key={f.id} className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Feedback from {user?.role === "startup" ? "Mentor" : "Startup"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(s => <Star key={s} className={`h-4 w-4 ${f.rating >= s ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />)}
              <span className="text-sm ml-2 font-medium">{ratingLabels[f.rating]}</span>
            </div>
            {f.comment && <p className="text-sm text-muted-foreground">{f.comment}</p>}
            {f.highlights.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {f.highlights.map(h => <Badge key={h} variant="secondary" className="text-xs">{h}</Badge>)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Would recommend: <span className="font-medium">{f.wouldRecommend ? "Yes ✓" : "No"}</span></p>
          </CardContent>
        </Card>
      ))}

      {alreadySubmitted ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-3" />
            <p className="font-semibold text-green-800">Feedback Submitted!</p>
            <p className="text-sm text-green-700 mt-1">Thank you for sharing your experience.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rate Your Experience with {otherName}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Star Rating */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Overall Rating <span className="text-destructive">*</span></label>
                <StarRating value={rating} onChange={setRating} />
                {rating > 0 && <p className="text-sm text-muted-foreground">{ratingLabels[rating]}</p>}
              </div>

              {/* Highlights */}
              <div className="space-y-2">
                <label className="text-sm font-medium">What stood out? <span className="text-xs text-muted-foreground">(select all that apply)</span></label>
                <div className="flex flex-wrap gap-2">
                  {HIGHLIGHT_OPTIONS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => toggleHighlight(h)}
                      className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${highlights.includes(h) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Comments <span className="text-xs text-muted-foreground">(optional)</span></label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  placeholder={`Share your experience working with ${otherName}...`}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {/* Would Recommend */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Would you recommend this {user?.role === "startup" ? "mentor" : "startup"}? <span className="text-destructive">*</span></label>
                <div className="flex gap-3">
                  {[true, false].map((val) => (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() => setWouldRecommend(val)}
                      className={`flex-1 rounded-md border py-2 text-sm font-medium transition-colors ${wouldRecommend === val ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}
                    >
                      {val ? "Yes, I would" : "No, I wouldn't"}
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" disabled={submitting || rating === 0 || wouldRecommend === null} className="w-full gap-2">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting...</> : "Submit Feedback"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
