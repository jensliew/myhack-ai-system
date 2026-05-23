"use client";

import type { ProjectPhase } from "@/types/startup.types";
import { CheckCircle2, Circle } from "lucide-react";

interface ProjectPhaseIndicatorProps {
  currentPhase: ProjectPhase;
  className?: string;
}

const PHASES: { value: ProjectPhase; label: string; description: string; color: string }[] = [
  { value: "initial", label: "Initial", description: "Matching", color: "bg-blue-500" },
  { value: "processing", label: "Processing", description: "Active", color: "bg-emerald-500" },
  { value: "final", label: "Final", description: "Feedback", color: "bg-violet-500" },
];

export function ProjectPhaseIndicator({ currentPhase, className = "" }: ProjectPhaseIndicatorProps) {
  const currentIndex = PHASES.findIndex((p) => p.value === currentPhase);
  const progressPercent = ((currentIndex + 1) / PHASES.length) * 100;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm font-semibold text-primary">{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Phase Steps */}
      <div className="relative">
        {/* Connecting line (full width behind circles) */}
        <div className="absolute top-5 left-5 right-5 h-1 bg-muted rounded-full" />
        {/* Active portion of connecting line */}
        <div
          className="absolute top-5 left-5 h-1 rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 via-emerald-500 to-violet-500"
          style={{
            width: currentIndex === 0
              ? "0%"
              : `calc(${(currentIndex / (PHASES.length - 1)) * 100}% - 40px)`,
          }}
        />

        {/* Phase circles and labels */}
        <div className="relative flex items-start justify-between">
          {PHASES.map((phase, index) => (
            <div key={phase.value} className="flex flex-col items-center">
              {/* Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 ${
                  index <= currentIndex
                    ? `${phase.color} text-white shadow-lg`
                    : "bg-background text-muted-foreground border-2 border-muted-foreground/20"
                }`}
              >
                {index <= currentIndex ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </div>

              {/* Label */}
              <div className="text-center mt-3">
                <p className={`text-sm font-semibold transition-colors ${
                  index <= currentIndex ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {phase.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{phase.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
