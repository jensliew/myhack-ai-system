"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, role, handleLogout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const onLogout = async () => {
    await handleLogout();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar — always visible at lg+ */}
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border lg:block">
        <Sidebar role={role} onLogout={onLogout} />
      </aside>

      {/* Tablet sidebar — collapsed (icons only) */}
      <aside className="hidden w-16 shrink-0 border-r border-sidebar-border md:block lg:hidden">
        <Sidebar role={role} collapsed onLogout={onLogout} />
      </aside>

      {/* Mobile sidebar — sheet overlay */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <Sidebar
            role={role}
            onLogout={() => {
              setMobileOpen(false);
              onLogout();
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          user={user}
          onMenuClick={() => setMobileOpen(true)}
          onLogout={onLogout}
        />

        <main className={cn("flex-1 overflow-y-auto p-4 lg:p-6 relative")}>
          {/* Background dot grid — fixed to viewport */}
          <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] [background-size:20px_20px] opacity-50" />
          {/* Top-right: warm amber glow */}
          <div className="pointer-events-none fixed -top-32 -right-32 w-[500px] h-[500px] bg-amber-300/[0.06] rounded-full blur-3xl" />
          {/* Bottom-left: cool teal glow */}
          <div className="pointer-events-none fixed -bottom-32 -left-32 w-[500px] h-[500px] bg-teal-400/[0.06] rounded-full blur-3xl" />
          {/* Center-left: soft indigo */}
          <div className="pointer-events-none fixed top-1/2 -left-48 w-[400px] h-[600px] bg-indigo-400/[0.04] rounded-full blur-3xl" />
          {/* Center-right: soft rose */}
          <div className="pointer-events-none fixed top-1/4 -right-48 w-[400px] h-[500px] bg-rose-300/[0.04] rounded-full blur-3xl" />
          <div className="relative">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
