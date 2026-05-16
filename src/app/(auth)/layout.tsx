"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
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
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Nexora</span>
            </Link>
          </div>

          <div className="relative z-10 space-y-4">
            <h2 className="text-3xl font-bold text-white leading-tight">
              Where ecosystems grow smarter
            </h2>
            <p className="text-blue-200/80 text-base leading-relaxed max-w-md">
              AI-powered mentor matching, verification, and engagement analytics — all in one platform built for innovation ecosystems.
            </p>
            <div className="flex items-center gap-4 pt-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-400" />
                <span className="text-sm text-blue-200/70">AI Matching</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-400" />
                <span className="text-sm text-blue-200/70">Smart Verification</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-400" />
                <span className="text-sm text-blue-200/70">Analytics</span>
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
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-background">
          {/* Mobile logo (shown only on small screens) */}
          <Link href="/" className="mb-8 text-center lg:hidden hover:opacity-80 transition-opacity">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">Nexora</span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-Powered Ecosystem Intelligence
            </p>
          </Link>

          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </AuthProvider>
  );
}
