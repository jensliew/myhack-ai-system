"use client";

import { Loader2, Award, Briefcase, MapPin, Clock, Sparkles } from "lucide-react";

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

const availabilityColors: Record<string, string> = {
  "full-time": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "part-time": "bg-amber-50 text-amber-700 border-amber-200",
  limited: "bg-rose-50 text-rose-700 border-rose-200",
};

const expertiseColors = [
  "bg-blue-50 text-blue-700 border-blue-200",
  "bg-violet-50 text-violet-700 border-violet-200",
  "bg-teal-50 text-teal-700 border-teal-200",
  "bg-indigo-50 text-indigo-700 border-indigo-200",
];

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
    <Card className="flex flex-col h-full transition-all duration-200 hover:shadow-md hover:border-primary/20 cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[15px] font-semibold leading-tight text-foreground group-hover:text-primary transition-colors duration-150">
            {mentor.name}
          </h3>
          {compatibilityScore !== undefined && (
            <Badge className="bg-primary text-primary-foreground text-[11px] font-semibold px-2 py-0.5 shrink-0">
              {compatibilityScore}% match
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1.5">
          {mentor.expertise.slice(0, 3).map((exp, i) => (
            <Badge key={exp} variant="outline" className={`text-[11px] font-medium px-2 py-0.5 border ${expertiseColors[i % expertiseColors.length]}`}>
              {exp}
            </Badge>
          ))}
          {mentor.expertise.length > 3 && (
            <Badge variant="outline" className="text-[11px] font-medium px-2 py-0.5 text-muted-foreground">
              +{mentor.expertise.length - 3}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {/* AI Reasoning */}
        {reasoning && source === "ai" && (
          <div className="rounded-lg bg-indigo-50/60 border border-indigo-100 px-3 py-2.5">
            <p className="text-[11px] font-medium text-indigo-600 mb-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI Match Reasoning
            </p>
            <p className="text-[12px] text-foreground leading-relaxed">{reasoning}</p>
          </div>
        )}

        {/* Industry specialization */}
        {mentor.industrySpecialization.length > 0 && (
          <div className="flex items-start gap-2 text-muted-foreground">
            <Briefcase className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-500" />
            <span className="text-[12px]">{mentor.industrySpecialization.join(", ")}</span>
          </div>
        )}

        {/* Success rate and mentorship count */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Award className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span className="text-[12px]">
            {mentor.successRate}% success · {mentor.mentorshipCount} mentorships
          </span>
        </div>

        {/* Availability */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
          <span className="text-[12px]">{availabilityLabels[mentor.availability] ?? mentor.availability}</span>
        </div>

        {/* Location */}
        {mentor.location && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-rose-500" />
            <span className="text-[12px]">{mentor.location}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="gap-2 pt-3">
        <Button
          className="flex-1 cursor-pointer text-[13px] font-medium"
          variant="default"
          disabled={isAcceptLoading || isRejectLoading}
          onClick={(e) => {
            e.stopPropagation();
            onAccept?.();
          }}
        >
          {isAcceptLoading && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
          Accept
        </Button>
        <Button
          className="flex-1 cursor-pointer text-[13px] font-medium"
          variant="outline"
          disabled={isAcceptLoading || isRejectLoading}
          onClick={(e) => {
            e.stopPropagation();
            onReject?.();
          }}
        >
          {isRejectLoading && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
          Reject
        </Button>
      </CardFooter>
    </Card>
  );
}
