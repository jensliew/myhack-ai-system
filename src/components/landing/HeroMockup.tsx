"use client";

import { useState, useEffect } from "react";

/**
 * Animated dashboard mockup for the landing page hero section.
 * Features a simulated cursor that clicks "Accept" on a mentor card.
 */
export function HeroMockup() {
  const [step, setStep] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: 70, y: 30 });
  const [showClick, setShowClick] = useState(false);
  const [accepted, setAccepted] = useState<number | null>(null);
  const [fadeIn, setFadeIn] = useState(false);

  // Fade in on mount
  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Animation sequence
  useEffect(() => {
    const sequence = [
      // Step 0: cursor moves to first card's Accept button
      { delay: 1500, action: () => setCursorPos({ x: 22, y: 78 }) },
      // Step 1: click animation
      { delay: 800, action: () => setShowClick(true) },
      // Step 2: accept the card
      { delay: 300, action: () => { setShowClick(false); setAccepted(0); } },
      // Step 3: cursor moves to second card
      { delay: 1200, action: () => setCursorPos({ x: 52, y: 78 }) },
      // Step 4: click
      { delay: 800, action: () => setShowClick(true) },
      // Step 5: accept
      { delay: 300, action: () => { setShowClick(false); setAccepted(1); } },
      // Step 6: reset
      { delay: 2000, action: () => { setAccepted(null); setCursorPos({ x: 70, y: 30 }); setStep(-1); } },
    ];

    if (step >= 0 && step < sequence.length) {
      const timer = setTimeout(() => {
        sequence[step].action();
        setStep((s) => s + 1);
      }, sequence[step].delay);
      return () => clearTimeout(timer);
    } else if (step === -1) {
      // Restart loop
      const timer = setTimeout(() => setStep(0), 1000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const mentors = [
    { name: "Sarah Chen", expertise: "FinTech", score: 92 },
    { name: "David Park", expertise: "SaaS", score: 87 },
    { name: "Lisa Wong", expertise: "AI/ML", score: 81 },
  ];

  return (
    <div
      className={`mt-16 w-full max-w-5xl transition-all duration-700 ${
        fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="rounded-xl border bg-background shadow-2xl shadow-primary/5 overflow-hidden relative">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400/70" />
            <div className="h-3 w-3 rounded-full bg-yellow-400/70" />
            <div className="h-3 w-3 rounded-full bg-green-400/70" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="rounded-md bg-background border px-4 py-1 text-xs text-muted-foreground">
              nexora.app/startup
            </div>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="flex relative">
          {/* Sidebar */}
          <div className="hidden sm:flex w-48 border-r bg-muted/30 flex-col p-3 gap-1">
            <div className="text-sm font-bold text-primary px-2 py-2">Nexora</div>
            <div className="rounded-md bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
              Dashboard
            </div>
            <div className="rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors">
              Documents
            </div>
            <div className="rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors">
              Mentors
            </div>
            <div className="rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors">
              Profile
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Mentor Matching</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  AI-suggested mentors for your startup
                </p>
              </div>
              <div className="h-7 px-3 rounded-md bg-primary/10 text-xs text-primary flex items-center font-medium">
                Refresh
              </div>
            </div>

            {/* AI Suggestions */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                AI Suggested Mentors
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {mentors.map((mentor, i) => (
                  <div
                    key={mentor.name}
                    className={`rounded-lg border p-3 space-y-2 transition-all duration-500 ${
                      accepted !== null && accepted >= i
                        ? "opacity-30 scale-95"
                        : "opacity-100 scale-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-foreground">{mentor.name}</p>
                      <span className="text-xs font-bold text-primary">{mentor.score}%</span>
                    </div>
                    <div className="flex gap-1">
                      <span className="h-4 px-2 rounded-full bg-primary/10 text-[9px] text-primary flex items-center">
                        {mentor.expertise}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Strong expertise alignment with your goals...
                    </p>
                    <div className="flex gap-2 pt-1">
                      <div className="flex-1 h-6 rounded bg-primary text-[9px] text-white flex items-center justify-center font-medium">
                        Accept
                      </div>
                      <div className="flex-1 h-6 rounded border text-[9px] flex items-center justify-center text-muted-foreground">
                        Reject
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interested section preview */}
            <div className="space-y-2 pt-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Mentors Interested
              </p>
              <div className="rounded-lg border border-dashed p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  2 mentors have expressed interest
                </p>
              </div>
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
            {/* Cursor SVG */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              className={`drop-shadow-md transition-transform duration-150 ${
                showClick ? "scale-90" : "scale-100"
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
            {/* Click ripple */}
            {showClick && (
              <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary/30 animate-ping" />
            )}
          </div>

          {/* Success toast animation */}
          {accepted !== null && (
            <div className="absolute top-4 right-4 rounded-md border bg-background shadow-lg px-3 py-2 animate-in slide-in-from-top-2 fade-in duration-300">
              <p className="text-xs font-medium text-green-700">
                ✓ Mentor accepted!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
