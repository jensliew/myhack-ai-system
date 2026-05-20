"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToNotifications, markNotificationRead, markAllNotificationsRead } from "@/services/notifications/notification.service";
import type { NotificationDocument } from "@/types/matching.types";

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDocument[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToNotifications(user.id, setNotifications);
    return () => unsubscribe();
  }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = (id: string) => markNotificationRead(id);
  const markAllRead = () => user && markAllNotificationsRead(user.id);

  return { notifications, unreadCount, markRead, markAllRead };
}
