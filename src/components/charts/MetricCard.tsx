"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export type MetricColor = "blue" | "emerald" | "amber" | "rose" | "violet" | "teal";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  color?: MetricColor;
}

const colorMap: Record<MetricColor, { bg: string; text: string; border: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100" },
  rose: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-100" },
  violet: { bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-100" },
  teal: { bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-100" },
};

export function MetricCard({ title, value, description, icon: Icon, color = "blue" }: MetricCardProps) {
  const colors = colorMap[color];

  return (
    <Card className={`relative overflow-hidden border ${colors.border}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-muted-foreground">
              {title}
            </p>
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
            {description && (
              <p className="text-[11px] text-muted-foreground/80">{description}</p>
            )}
          </div>
          {Icon && (
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colors.bg}`}>
              <Icon className={`h-4.5 w-4.5 ${colors.text}`} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
