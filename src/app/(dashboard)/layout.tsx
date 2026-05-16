"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { AuthProvider } from "@/providers/auth-provider";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/AppShell";
import { startupsCollection, mentorsCollection } from "@/firebase/collections";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  // Check if profile exists after auth loads
  useEffect(() => {
    async function checkProfile() {
      if (!user) return;

      if (user.role === "startup") {
        const docRef = doc(startupsCollection, user.entityId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          setShowProfilePrompt(true);
        }
      } else if (user.role === "mentor") {
        const docRef = doc(mentorsCollection, user.entityId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          setShowProfilePrompt(true);
        }
      }
    }
    if (user && !loading) {
      checkProfile();
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const profilePath = user?.role === "startup" ? "/startup/profile" : "/mentor/profile";

  return (
    <AppShell>
      {/* Profile completion guideline banner */}
      {showProfilePrompt && (
        <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="text-lg">👋</span>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">Welcome to Nexora! Let&apos;s get you set up.</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Complete your profile so mentors and startups can find and connect with you. Here&apos;s what to do:
              </p>
              <ol className="mt-3 space-y-1.5 text-sm text-muted-foreground list-decimal list-inside">
                <li>Fill in your {user?.role === "startup" ? "startup" : "mentor"} profile details</li>
                <li>{user?.role === "startup" ? "Add your industry, stage, and goals" : "Add your expertise and availability"}</li>
                <li>{user?.role === "startup" ? "Wait for AI mentor recommendations" : "Browse startups and express interest"}</li>
              </ol>
              <div className="mt-4 flex items-center gap-3">
                <Link href={profilePath}>
                  <Button size="sm" className="cursor-pointer">
                    Complete Profile
                  </Button>
                </Link>
                <Button size="sm" variant="ghost" onClick={() => setShowProfilePrompt(false)} className="cursor-pointer text-muted-foreground">
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {children}
    </AppShell>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DashboardContent>{children}</DashboardContent>
    </AuthProvider>
  );
}
