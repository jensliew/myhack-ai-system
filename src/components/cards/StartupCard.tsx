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

const industryColors: Record<string, string> = {
  FinTech: "bg-blue-50 text-blue-700 border-blue-200",
  HealthTech: "bg-rose-50 text-rose-700 border-rose-200",
  EdTech: "bg-violet-50 text-violet-700 border-violet-200",
  "E-Commerce": "bg-amber-50 text-amber-700 border-amber-200",
  SaaS: "bg-indigo-50 text-indigo-700 border-indigo-200",
  "AI/ML": "bg-cyan-50 text-cyan-700 border-cyan-200",
  CleanTech: "bg-emerald-50 text-emerald-700 border-emerald-200",
  AgriTech: "bg-lime-50 text-lime-700 border-lime-200",
  Logistics: "bg-orange-50 text-orange-700 border-orange-200",
  Other: "bg-gray-50 text-gray-700 border-gray-200",
};

const stageColors: Record<string, string> = {
  idea: "bg-slate-100 text-slate-600",
  "pre-seed": "bg-amber-50 text-amber-700",
  seed: "bg-emerald-50 text-emerald-700",
  "series-a": "bg-blue-50 text-blue-700",
  "series-b": "bg-violet-50 text-violet-700",
  growth: "bg-teal-50 text-teal-700",
};

export function StartupCard({
  startup,
  onInterested,
  isInterested = false,
  isLoading = false,
}: StartupCardProps) {
  const industryColor = industryColors[startup.industry] || industryColors.Other;
  const stageColor = stageColors[startup.stage] || "bg-gray-100 text-gray-600";

  return (
    <Card className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/20 flex flex-col h-full group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[15px] font-semibold leading-tight text-foreground group-hover:text-primary transition-colors duration-150">
            {startup.name}
          </h3>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1.5">
          <Badge variant="outline" className={`text-[11px] font-medium px-2 py-0.5 border ${industryColor}`}>
            {startup.industry}
          </Badge>
          <Badge variant="outline" className={`text-[11px] font-medium px-2 py-0.5 border-transparent ${stageColor}`}>
            {stageLabels[startup.stage] || startup.stage}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <p className="text-[13px] leading-relaxed text-muted-foreground line-clamp-3">
          {startup.description}
        </p>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
            <span className="text-[12px]">{startup.fundingStage}</span>
          </div>

          {startup.goals.length > 0 && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <Target className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
              <span className="text-[12px] line-clamp-2">
                {startup.goals.join(", ")}
              </span>
            </div>
          )}

          {startup.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 shrink-0 text-violet-500" />
              <span className="text-[12px]">{startup.location}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3">
        <Button
          className="w-full cursor-pointer text-[13px] font-medium"
          variant={isInterested ? "secondary" : "default"}
          disabled={isInterested || isLoading}
          onClick={(e) => {
            e.stopPropagation();
            onInterested?.();
          }}
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
          {isInterested ? "Interest Expressed" : "Express Interest"}
        </Button>
      </CardFooter>
    </Card>
  );
}
