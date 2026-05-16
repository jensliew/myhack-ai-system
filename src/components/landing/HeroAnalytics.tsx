"use client";

import { useState, useEffect } from "react";
import { Shield, CheckCircle, XCircle, Loader2 } from "lucide-react";

/**
 * Animated AI Verification mockup showing the admin verification flow.
 * Demonstrates cursor clicking "Run AI Verification" and showing results.
 */
export function HeroAnalytics() {
  const [fadeIn, setFadeIn] = useState(false);
  const [phase, setPhase] = useState<"idle" | "clicking" | "loading" | "result-mentor" | "pause" | "clicking2" | "loading2" | "result-startup">("idle");
  const [cursorPos, setCursorPos] = useState({ x: 75, y: 25 });
  const [showClick, setShowClick] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 600);
    return () => clearTimeout(timer);
  }, []);

  // Animation loop
  useEffect(() => {
    if (!fadeIn) return;

    const timers: NodeJS.Timeout[] = [];

    // Phase 1: Cursor moves to "Run AI Verification" button on mentor card
    timers.push(setTimeout(() => { setCursorPos({ x: 62, y: 38 }); setPhase("clicking"); }, 1200));
    // Click
    timers.push(setTimeout(() => setShowClick(true), 2000));
    timers.push(setTimeout(() => { setShowClick(false); setPhase("loading"); }, 2300));
    // Show mentor result (approve)
    timers.push(setTimeout(() => setPhase("result-mentor"), 3800));
    // Pause
    timers.push(setTimeout(() => setPhase("pause"), 6500));
    // Move cursor to startup card
    timers.push(setTimeout(() => { setCursorPos({ x: 62, y: 72 }); setPhase("clicking2"); }, 7200));
    // Click
    timers.push(setTimeout(() => setShowClick(true), 8000));
    timers.push(setTimeout(() => { setShowClick(false); setPhase("loading2"); }, 8300));
    // Show startup result (reject)
    timers.push(setTimeout(() => setPhase("result-startup"), 9800));
    // Reset loop
    timers.push(setTimeout(() => {
      setPhase("idle");
      setCursorPos({ x: 75, y: 25 });
    }, 13000));
    timers.push(setTimeout(() => setPhase("idle"), 13500));

    return () => timers.forEach(clearTimeout);
  }, [fadeIn, phase === "idle" ? "restart" : ""]);

  // Restart loop
  useEffect(() => {
    if (phase === "idle" && fadeIn) {
      const t = setTimeout(() => {
        setCursorPos({ x: 62, y: 38 });
        setPhase("clicking");
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [phase, fadeIn]);

  return (
    <div
      className={`w-full max-w-3xl transition-all duration-700 ${
        fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="rounded-xl border bg-background shadow-xl overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2.5">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-foreground">Admin — AI Verification</span>
          <span className="ml-auto text-[10px] text-muted-foreground">Powered by Gemini</span>
        </div>

        <div className="p-4 space-y-4 min-h-[320px]">
          {/* Mentor Application Card */}
          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Sarah Chen</p>
                <p className="text-[10px] text-muted-foreground">Mentor · San Francisco, USA</p>
              </div>
              <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full">mentor</span>
            </div>
            <div className="flex flex-wrap gap-1">
              <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">FinTech</span>
              <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">SaaS</span>
              <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Product Strategy</span>
            </div>
            <p className="text-[10px] text-muted-foreground line-clamp-1">
              15 years in SaaS product development. Founded 2 successful B2B companies...
            </p>

            {/* Verification result area */}
            {(phase === "loading" || phase === "result-mentor" || phase === "pause" || phase === "clicking2" || phase === "loading2" || phase === "result-startup") ? (
              phase === "loading" ? (
                <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 animate-in fade-in duration-200">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  <span className="text-[10px] text-muted-foreground">Analyzing profile with AI...</span>
                </div>
              ) : (
                <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-[10px] font-semibold text-green-700">AI Recommendation: Approve</span>
                  </div>
                  <p className="text-[9px] text-green-700/80 mt-1 leading-relaxed">
                    Highly qualified mentor with 15 years experience. 20+ startups mentored with 3 exits. Strong FinTech/SaaS expertise. Profile is complete and verified.
                  </p>
                </div>
              )
            ) : (
              <div className="flex gap-2">
                <div className="px-3 py-1.5 rounded-md bg-primary text-[10px] text-white font-medium">
                  Run AI Verification
                </div>
              </div>
            )}
          </div>

          {/* Startup Application Card */}
          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">RandomApp</p>
                <p className="text-[10px] text-muted-foreground">Startup · Unknown</p>
              </div>
              <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full">startup</span>
            </div>
            <div className="flex flex-wrap gap-1">
              <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Other</span>
              <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Idea Stage</span>
            </div>
            <p className="text-[10px] text-muted-foreground line-clamp-1">
              An app idea. Not sure what it does yet.
            </p>

            {/* Verification result area */}
            {(phase === "loading2" || phase === "result-startup") ? (
              phase === "loading2" ? (
                <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 animate-in fade-in duration-200">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  <span className="text-[10px] text-muted-foreground">Analyzing profile with AI...</span>
                </div>
              ) : (
                <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5 text-red-600" />
                    <span className="text-[10px] font-semibold text-red-700">AI Recommendation: Reject</span>
                  </div>
                  <p className="text-[9px] text-red-700/80 mt-1 leading-relaxed">
                    Incomplete application. No clear product description, vague goals, unknown location, no website. Insufficient information for ecosystem participation.
                  </p>
                </div>
              )
            ) : (
              <div className="flex gap-2">
                <div className="px-3 py-1.5 rounded-md bg-primary text-[10px] text-white font-medium">
                  Run AI Verification
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Animated cursor */}
        <div
          className="absolute pointer-events-none transition-all duration-700 ease-in-out z-10"
          style={{
            left: `${cursorPos.x}%`,
            top: `${cursorPos.y}%`,
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            className={`drop-shadow-md transition-transform duration-150 ${
              showClick ? "scale-75" : "scale-100"
            }`}
          >
            <path
              d="M5 3L19 12L12 13L9 20L5 3Z"
              fill="#1E40AF"
              stroke="#1E3A8A"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          {showClick && (
            <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-primary/30 animate-ping" />
          )}
        </div>
      </div>
    </div>
  );
}
