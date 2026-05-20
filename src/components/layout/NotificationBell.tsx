"use client";

import { useState } from "react";
import { Bell, Check, CheckCheck, MessageSquare, UserCheck, FileText, Star, X } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import type { NotificationDocument } from "@/types/matching.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

const notificationIcon = (type: NotificationDocument["type"]) => {
  switch (type) {
    case "message_received": return <MessageSquare className="h-4 w-4 text-blue-500" />;
    case "mentor_accepted": return <UserCheck className="h-4 w-4 text-green-500" />;
    case "mentor_interested": return <UserCheck className="h-4 w-4 text-purple-500" />;
    case "document_uploaded": return <FileText className="h-4 w-4 text-orange-500" />;
    case "feedback_received": return <Star className="h-4 w-4 text-yellow-500" />;
    case "relationship_completed": return <CheckCheck className="h-4 w-4 text-gray-500" />;
    default: return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
};

function timeAgo(timestamp: any): string {
  const seconds = Math.floor((Date.now() - (timestamp?.seconds ?? 0) * 1000) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleClick = (n: NotificationDocument) => {
    markRead(n.id);
    if (n.link) {
      router.push(n.link);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="absolute right-0 top-10 z-50 w-80 rounded-lg border bg-popover shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <Badge className="bg-destructive text-white text-xs px-1.5 py-0">{unreadCount}</Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => markAllRead()}>
                    <Check className="h-3 w-3" /> Mark all read
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <Bell className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                </div>
              )}
              {notifications.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`flex items-start gap-3 px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                >
                  <div className="mt-0.5 shrink-0">{notificationIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
