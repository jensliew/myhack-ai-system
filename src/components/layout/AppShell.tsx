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

        <main className={cn("flex-1 overflow-y-auto p-4 lg:p-6")}>
          {children}
        </main>
      </div>
    </div>
  );
}
