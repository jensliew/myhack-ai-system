"use client";

import { Loader2, Award, Briefcase, MapPin, Clock } from "lucide-react";

import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MentorDocument } from "@/types/mentor.types";

interface MentorCardProps {
  mentor: MentorDocument;
  compatibilityScore?: number;
  reasoning?: string;
  onAccept?: () => void;
  onReject?: () => void;
  isAcceptLoading?: boolean;
  isRejectLoading?: boolean;
  source?: "ai" | "interest";
}

const availabilityLabels: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  limited: "Limited",
};

export function MentorCard({
  mentor,
  compatibilityScore,
  reasoning,
  onAccept,
  onReject,
  isAcceptLoading = false,
  isRejectLoading = false,
  source = "ai",
}: MentorCardProps) {
  return (
    <Card className="flex flex-col h-full transition-shadow duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold leading-tight text-foreground">
            {mentor.name}
          </h3>
          {compatibilityScore !== undefined && (
            <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1">
              <span className="text-sm font-bold text-primary">
                {compatibilityScore}%
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {mentor.expertise.slice(0, 3).map((exp) => (
            <Badge key={exp} variant="default" className="text-xs">
              {exp}
            </Badge>
          ))}
          {mentor.expertise.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{mentor.expertise.length - 3}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {/* AI Reasoning */}
        {reasoning && source === "ai" && (
          <div className="rounded-md bg-muted/50 px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              AI Match Reasoning
            </p>
            <p className="text-sm text-foreground">{reasoning}</p>
          </div>
        )}

        {/* Industry specialization */}
        {mentor.industrySpecialization.length > 0 && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Briefcase className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{mentor.industrySpecialization.join(", ")}</span>
          </div>
        )}

        {/* Success rate and mentorship count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Award className="h-4 w-4 shrink-0" />
          <span>
            {mentor.successRate}% success rate · {mentor.mentorshipCount}{" "}
            mentorships
          </span>
        </div>

        {/* Availability */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 shrink-0" />
          <span>{availabilityLabels[mentor.availability] ?? mentor.availability}</span>
        </div>

        {/* Location */}
        {mentor.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{mentor.location}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="gap-2">
        <Button
          className="flex-1"
          variant="default"
          disabled={isAcceptLoading || isRejectLoading}
          onClick={(e) => {
            e.stopPropagation();
            onAccept?.();
          }}
        >
          {isAcceptLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Accept
        </Button>
        <Button
          className="flex-1"
          variant="outline"
          disabled={isAcceptLoading || isRejectLoading}
          onClick={(e) => {
            e.stopPropagation();
            onReject?.();
          }}
        >
          {isRejectLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Reject
        </Button>
      </CardFooter>
    </Card>
  );
}
