"use client";

import Link from "next/link";
import { AuthProvider } from "@/providers/auth-provider";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen relative overflow-hidden">
        {/* Left panel — branding (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12">
          {/* Background image */}
          <div className="absolute inset-0 z-0">
            <img
              src="/assets/blue-futuristic-waves-background-with-computer-code-technology_53876-119584.avif"
              alt=""
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-slate-900/80" />
          </div>

          {/* Content */}
          <div className="relative z-10">
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-sm font-bold text-white">N</span>
              </div>
              <span className="text-xl font-semibold text-white tracking-tight">Nexora</span>
            </Link>
          </div>

          <div className="relative z-10 space-y-4">
            <h2 className="text-3xl font-semibold text-white leading-tight tracking-tight">
              Where ecosystems grow smarter
            </h2>
            <p className="text-blue-200/80 text-[14px] leading-relaxed max-w-md">
              AI-powered mentor matching, verification, and engagement analytics — all in one platform built for innovation ecosystems.
            </p>
            <div className="flex items-center gap-5 pt-4">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[12px] text-blue-200/70">AI Matching</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                <span className="text-[12px] text-blue-200/70">Smart Verification</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                <span className="text-[12px] text-blue-200/70">Analytics</span>
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <p className="text-xs text-blue-300/50">
              © 2026 Nexora. AI-Powered Ecosystem Intelligence.
            </p>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-background relative">
          {/* Background dot grid */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />
          {/* Warm amber glow top-right */}
          <div className="pointer-events-none absolute -top-20 -right-20 w-[400px] h-[400px] bg-amber-300/[0.07] rounded-full blur-3xl" />
          {/* Cool teal glow bottom-left */}
          <div className="pointer-events-none absolute -bottom-20 -left-20 w-[350px] h-[350px] bg-teal-400/[0.06] rounded-full blur-3xl" />
          {/* Mobile logo (shown only on small screens) */}
          <Link href="/" className="mb-8 text-center lg:hidden hover:opacity-80 transition-opacity relative z-10">
            <div className="flex items-center justify-center gap-2.5 mb-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-sm font-bold text-white">N</span>
              </div>
              <span className="text-xl font-semibold text-foreground tracking-tight">Nexora</span>
            </div>
            <p className="text-[12px] text-muted-foreground">
              AI-Powered Ecosystem Intelligence
            </p>
          </Link>

          <div className="w-full max-w-md relative z-10">{children}</div>
        </div>
      </div>
    </AuthProvider>
  );
}
