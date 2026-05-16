"use client";

import type { ProjectPhase } from "@/types/startup.types";
import { CheckCircle2, Circle } from "lucide-react";

interface ProjectPhaseIndicatorProps {
  currentPhase: ProjectPhase;
  className?: string;
}

const PHASES: { value: ProjectPhase; label: string; description: string }[] = [
  { value: "initial", label: "Initial", description: "Matching" },
  { value: "processing", label: "Processing", description: "Active" },
  { value: "final", label: "Final", description: "Feedback" },
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
      <div className="flex items-center justify-between gap-2">
        {PHASES.map((phase, index) => (
          <div key={phase.value} className="flex flex-col items-center flex-1">
            {/* Circle and Line */}
            <div className="flex items-center w-full mb-3">
              <div className="relative flex items-center justify-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    index <= currentIndex
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : "bg-muted text-muted-foreground border-2 border-muted-foreground/20"
                  }`}
                >
                  {index <= currentIndex ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </div>
              </div>
              {index < PHASES.length - 1 && (
                <div className="flex-1 h-1 mx-1">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      index < currentIndex ? "bg-primary" : "bg-muted"
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Label */}
            <div className="text-center">
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
  );
}
