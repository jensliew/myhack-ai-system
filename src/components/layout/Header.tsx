"use client";

import { Menu, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserDocument } from "@/types/user.types";
import { NotificationBell } from "@/components/layout/NotificationBell";

interface HeaderProps {
  user: UserDocument | null;
  onMenuClick: () => void;
  onLogout: () => void;
}

function getUserInitials(email: string): string {
  return email.slice(0, 2).toUpperCase();
}

function getRoleLabel(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function getRoleBadgeColor(role: string): string {
  switch (role) {
    case "admin":
      return "bg-red-50 text-red-700";
    case "mentor":
      return "bg-blue-50 text-blue-700";
    case "startup":
      return "bg-emerald-50 text-emerald-700";
    default:
      return "bg-gray-50 text-gray-700";
  }
}

export function Header({ user, onMenuClick, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-background/95 backdrop-blur-sm px-4 lg:px-6">
      {/* Left: hamburger menu for mobile/tablet */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Toggle navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Spacer for desktop (no hamburger) */}
      <div className="hidden lg:block" />

      {/* Right: notifications + user info */}
      <div className="flex items-center gap-1.5">
        {user && user.role !== "admin" && <NotificationBell />}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2.5 px-2 py-1.5 h-auto rounded-lg hover:bg-muted/80 cursor-pointer"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary text-primary-foreground text-[11px] font-semibold">
                    {getUserInitials(user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden flex-col items-start sm:flex">
                  <span className="text-[13px] font-medium leading-tight">
                    {user.email.split("@")[0]}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 ${getRoleBadgeColor(user.role)}`}
                  >
                    {getRoleLabel(user.role)}
                  </span>
                </div>
                <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user.email}</span>
                  <span className="text-xs text-muted-foreground">
                    {getRoleLabel(user.role)}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onLogout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
