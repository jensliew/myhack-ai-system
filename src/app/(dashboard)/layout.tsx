"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { AuthProvider } from "@/providers/auth-provider";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/AppShell";
import { startupsCollection, mentorsCollection } from "@/firebase/collections";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
    <>
      <AppShell>{children}</AppShell>

      <Dialog open={showProfilePrompt} onOpenChange={setShowProfilePrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Your Profile</DialogTitle>
            <DialogDescription>
              Please fill in your profile information so other users can find and connect with you. This is required to use the platform.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProfilePrompt(false)}>
              Later
            </Button>
            <Link href={profilePath}>
              <Button onClick={() => setShowProfilePrompt(false)}>
                Go to Profile
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
