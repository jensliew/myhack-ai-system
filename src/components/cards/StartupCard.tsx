"use client";

import { Loader2, Building2, Target, TrendingUp } from "lucide-react";

import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StartupDocument } from "@/types/startup.types";

interface StartupCardProps {
  startup: StartupDocument;
  onInterested?: () => void;
  isInterested?: boolean;
  isLoading?: boolean;
}

const stageLabels: Record<string, string> = {
  idea: "Idea",
  "pre-seed": "Pre-Seed",
  seed: "Seed",
  "series-a": "Series A",
  "series-b": "Series B",
  growth: "Growth",
};

export function StartupCard({
  startup,
  onInterested,
  isInterested = false,
  isLoading = false,
}: StartupCardProps) {
  return (
    <Card className="cursor-pointer transition-shadow duration-200 hover:shadow-md flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold leading-tight text-foreground">
            {startup.name}
          </h3>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Badge variant="default" className="text-xs">
            {startup.industry}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {stageLabels[startup.stage] || startup.stage}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-5">
          {startup.description}
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4 shrink-0" />
            <span>{startup.fundingStage}</span>
          </div>

          {startup.goals.length > 0 && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <Target className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="line-clamp-2">
                {startup.goals.join(", ")}
              </span>
            </div>
          )}

          {startup.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4 shrink-0" />
              <span>{startup.location}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={isInterested ? "secondary" : "default"}
          disabled={isInterested || isLoading}
          onClick={(e) => {
            e.stopPropagation();
            onInterested?.();
          }}
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isInterested ? "Interested" : "Interested"}
        </Button>
      </CardFooter>
    </Card>
  );
}
