"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  UserCircle,
  Briefcase,
  Heart,
  LogOut,
  MessageSquare,
  History,
  Link2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/types/user.types";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const adminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Applications", href: "/admin/applications", icon: FileText },
  { label: "Relationships", href: "/admin/relationships", icon: Link2 },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Users", href: "/admin/users", icon: Users },
];

const startupNavItems: NavItem[] = [
  { label: "Dashboard", href: "/startup", icon: LayoutDashboard },
  { label: "My Mentors", href: "/startup/mentors", icon: Users },
  { label: "Documents", href: "/startup/documents", icon: FileText },
  { label: "History", href: "/startup/history", icon: History },
  { label: "Profile", href: "/startup/profile", icon: UserCircle },
];

const mentorNavItems: NavItem[] = [
  { label: "Dashboard", href: "/mentor", icon: LayoutDashboard },
  { label: "AI Matching", href: "/mentor/matching", icon: Sparkles },
  { label: "Startups", href: "/mentor/startups", icon: Briefcase },
  { label: "Relationships", href: "/mentor/relationships", icon: Heart },
  { label: "Interested", href: "/mentor/interested", icon: MessageSquare },
  { label: "History", href: "/mentor/history", icon: History },
  { label: "Profile", href: "/mentor/profile", icon: UserCircle },
];

export function getNavItemsForRole(role: UserRole | null): NavItem[] {
  switch (role) {
    case "admin":
      return adminNavItems;
    case "startup":
      return startupNavItems;
    case "mentor":
      return mentorNavItems;
    default:
      return [];
  }
}

interface SidebarProps {
  role: UserRole | null;
  collapsed?: boolean;
  onLogout: () => void;
}

export function Sidebar({ role, collapsed = false, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const navItems = getNavItemsForRole(role);

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Logo */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-sidebar-border px-5",
          collapsed && "justify-center px-2"
        )}
      >
        {collapsed ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-white">N</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-white">N</span>
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-sidebar-primary">
              Nexora
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== `/${role}` && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors duration-150",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0",
                  isActive ? "text-primary" : ""
                )}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 rounded-lg text-[13px] font-medium text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            collapsed && "justify-center px-2"
          )}
          onClick={onLogout}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </div>
  );
}
