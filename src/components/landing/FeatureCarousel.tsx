"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Brain,
  Users,
  BarChart3,
  Shield,
  Zap,
  Globe,
  FileText,
  Heart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  illustration: React.ReactNode;
}

const features: Feature[] = [
  {
    icon: Brain,
    title: "AI Mentor Matching",
    subtitle: "Powered by Gemini",
    description:
      "Our AI analyzes startup profiles, mentor expertise, and historical outcomes to generate compatibility scores with explainable reasoning.",
    highlights: [
      "Compatibility scoring (0-100%)",
      "Explainable AI reasoning",
      "Improves with every interaction",
    ],
    illustration: (
      <div className="relative w-full h-48 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-8 w-20 h-20 rounded-full border-2 border-primary/30" />
          <div className="absolute bottom-6 right-12 w-16 h-16 rounded-full border-2 border-primary/20" />
          <div className="absolute top-12 right-8 w-12 h-12 rounded-full border-2 border-primary/40" />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Startup</span>
          </div>
          <div className="flex flex-col items-center">
            <Brain className="h-8 w-8 text-primary animate-pulse" />
            <div className="w-16 h-0.5 bg-primary/30 mt-1" />
            <span className="text-xs text-primary font-medium mt-1">92% Match</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Mentor</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: Users,
    title: "Mentor Discovery",
    subtitle: "Browse & Express Interest",
    description:
      "Mentors browse startup listings with powerful search and filters. Express interest with one click — startups see who's interested and decide.",
    highlights: [
      "Search by industry, stage, funding",
      "One-click interest expression",
      "Startup has final authority",
    ],
    illustration: (
      <div className="relative w-full h-48 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border flex items-center justify-center p-4">
        <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
          {["FinTech", "EdTech", "SaaS", "HealthTech"].map((industry) => (
            <div
              key={industry}
              className="rounded-md border bg-background px-3 py-2 text-center"
            >
              <p className="text-xs font-medium text-foreground">{industry}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Seed Stage</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: Shield,
    title: "AI Verification",
    subtitle: "Automated Screening",
    description:
      "AI analyzes application profiles and generates verification summaries with approve/reject/review recommendations for admin decision-making.",
    highlights: [
      "Profile completeness analysis",
      "Industry classification",
      "Admin retains final decision",
    ],
    illustration: (
      <div className="relative w-full h-48 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border flex items-center justify-center p-4">
        <div className="w-full max-w-xs space-y-2">
          <div className="rounded-md border bg-background p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">AI Recommendation</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Approve</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Complete profile with verified industry data...
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 rounded-md bg-primary px-3 py-1.5 text-center text-xs text-white">Approve</div>
            <div className="flex-1 rounded-md border px-3 py-1.5 text-center text-xs">Reject</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: BarChart3,
    title: "Ecosystem Analytics",
    subtitle: "Data-Driven Decisions",
    description:
      "Real-time dashboards showing ecosystem growth, active mentorships, engagement metrics, and mentorship quality indicators.",
    highlights: [
      "Real-time metrics dashboard",
      "Mentorship engagement tracking",
      "Growth and health indicators",
    ],
    illustration: (
      <div className="relative w-full h-48 rounded-lg bg-gradient-to-br from-purple-50 to-violet-50 border flex items-center justify-center p-4">
        <div className="w-full max-w-xs">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-md border bg-background p-2 text-center">
              <p className="text-lg font-bold text-primary">24</p>
              <p className="text-[10px] text-muted-foreground">Startups</p>
            </div>
            <div className="rounded-md border bg-background p-2 text-center">
              <p className="text-lg font-bold text-primary">18</p>
              <p className="text-[10px] text-muted-foreground">Mentors</p>
            </div>
            <div className="rounded-md border bg-background p-2 text-center">
              <p className="text-lg font-bold text-primary">12</p>
              <p className="text-[10px] text-muted-foreground">Active</p>
            </div>
          </div>
          <div className="mt-3 flex items-end gap-1 h-12">
            {[40, 55, 35, 70, 60, 80, 75, 90].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-primary/20"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: FileText,
    title: "Document Management",
    subtitle: "Secure & Organized",
    description:
      "Upload meeting minutes, monthly reports, and progress documents with public/private visibility controls. Keep your mentorship organized.",
    highlights: [
      "Public & private visibility",
      "Meeting minutes & reports",
      "Secure Firebase Storage",
    ],
    illustration: (
      <div className="relative w-full h-48 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 border flex items-center justify-center p-4">
        <div className="w-full max-w-xs space-y-2">
          {["Meeting Minutes - Q1 Review", "Monthly Report - March", "Pitch Deck v2"].map((name) => (
            <div key={name} className="flex items-center gap-2 rounded-md border bg-background px-3 py-2">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-foreground truncate">{name}</span>
              <span className="ml-auto text-[10px] text-muted-foreground shrink-0">Public</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: Zap,
    title: "Behavioral Learning",
    subtitle: "Smarter Over Time",
    description:
      "Every accept, reject, interest click, and profile view feeds back into the recommendation engine. The more you use it, the better it gets.",
    highlights: [
      "Tracks all interactions",
      "Learns from outcomes",
      "Personalized recommendations",
    ],
    illustration: (
      <div className="relative w-full h-48 rounded-lg bg-gradient-to-br from-cyan-50 to-sky-50 border flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <span className="text-xs">✓</span>
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 block">Accept</span>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <span className="text-xs">✗</span>
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 block">Reject</span>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                <span className="text-xs">👁</span>
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 block">View</span>
            </div>
          </div>
          <Zap className="h-5 w-5 text-primary" />
          <div className="rounded-md border bg-background px-4 py-2">
            <span className="text-xs font-medium text-primary">Better Recommendations</span>
          </div>
        </div>
      </div>
    ),
  },
];

export function FeatureCarousel() {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % features.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + features.length) % features.length);
  }, []);

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, next]);

  const feature = features[current];
  const Icon = feature.icon;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Main Content */}
      <div key={current} className="grid gap-8 lg:grid-cols-2 items-center min-h-[400px] animate-in fade-in slide-in-from-right-4 duration-500">
        {/* Left: Text */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400/30 to-blue-500/10 border border-blue-400/20">
              <Icon className="h-5 w-5 text-blue-300" />
            </div>
            <span className="text-sm font-semibold text-blue-300">{feature.subtitle}</span>
          </div>

          <h3 className="text-2xl font-bold text-white lg:text-3xl">
            {feature.title}
          </h3>

          <p className="text-blue-200/70 leading-relaxed text-base">
            {feature.description}
          </p>

          <ul className="space-y-3 pt-2">
            {feature.highlights.map((highlight) => (
              <li key={highlight} className="flex items-center gap-3 text-sm text-blue-100/80">
                <div className="h-5 w-5 rounded-full bg-blue-400/20 flex items-center justify-center shrink-0">
                  <div className="h-2 w-2 rounded-full bg-blue-400" />
                </div>
                {highlight}
              </li>
            ))}
          </ul>
        </div>

        {/* Right: Illustration */}
        <div className="flex items-center justify-center">
          {feature.illustration}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        {/* Dots */}
        <div className="flex items-center gap-2">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                index === current
                  ? "w-8 bg-blue-400"
                  : "w-2 bg-blue-300/30 hover:bg-blue-300/50"
              }`}
              aria-label={`Go to feature ${index + 1}`}
            />
          ))}
        </div>

        {/* Arrows */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={prev}
            className="h-9 w-9 cursor-pointer"
            aria-label="Previous feature"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={next}
            className="h-9 w-9 cursor-pointer"
            aria-label="Next feature"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
