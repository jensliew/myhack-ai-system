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
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
        <Link href="/" className="mb-8 text-center hover:opacity-80 transition-opacity">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Nexora
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            AI-Powered Ecosystem Intelligence
          </p>
        </Link>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </AuthProvider>
  );
}
