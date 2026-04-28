// ─── notifications-center.tsx ─────────────────────────────────────────────────
import { colour, radius, space, typography } from "@/tokens";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import type { Notification } from "./types";

const SAMPLE_NOTIFICATIONS: Notification[] = [
  { id: "1", title: "Receipt uploaded",        message: "Your Uber receipt has been added to your deductible expenses", icon: "📝", timestamp: "2 minutes ago",  priority: "normal", read: false },
  { id: "2", title: "Tax savings milestone",   message: "You've saved R5,000 on your tax this month! 🎉",              icon: "🎯", timestamp: "1 hour ago",     priority: "high",   read: false },
  { id: "3", title: "Monthly report ready",    message: "Your March 2026 expense report is ready to download",         icon: "📊", timestamp: "3 hours ago",    priority: "normal", read: true  },
  { id: "4", title: "Budget alert",            message: "You're approaching your monthly office supplies budget",       icon: "⚠️", timestamp: "1 day ago",      priority: "high",   read: true  },
];

interface NotificationsCenterProps { onClose: () => void; }

export function NotificationsCenter({ onClose }: NotificationsCenterProps) {
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const clearAll = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  return (
    <View style={{ flex: 1, backgroundColor: colour.white }}>
      {/* Header */}
      <View style={{ backgroundColor: colour.navyDark, paddingVertical: 20, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <Text style={{ ...typography.h3, color: colour.white, flex: 1 }}>Notifications</Text>
          {unreadCount > 0 && (
            <View
              style={{
                backgroundColor: colour.danger,
                borderRadius: 12,
                minWidth: 28,
                height: 28,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ ...typography.labelS, color: colour.white }}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={clearAll}>
            <Text style={{ ...typography.labelS, color: colour.info }}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {notifications.length === 0 ? (
          <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 60 }}>
            <Text style={{ fontSize: 64, marginBottom: 16 }}>🔔</Text>
            <Text style={{ ...typography.h4, color: colour.primary, marginBottom: 4 }}>All caught up!</Text>
            <Text style={{ ...typography.bodyM, color: colour.textSub }}>You have no new notifications</Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  borderRadius: radius.md,
                  padding: 12,
                  marginBottom: 8,
                  borderLeftWidth: 4,
                  borderLeftColor: notification.read ? "transparent" : colour.info,
                  backgroundColor: notification.read ? colour.white : colour.primary50,
                }}
                onPress={() => markAsRead(notification.id)}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: radius.sm,
                    backgroundColor: colour.primary50,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12,
                    flexShrink: 0,
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{notification.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                    <Text style={{ ...typography.labelM, color: colour.primary, flex: 1 }}>
                      {notification.title}
                    </Text>
                    {!notification.read && (
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colour.info, marginLeft: 8 }} />
                    )}
                  </View>
                  <Text style={{ ...typography.bodyXS, color: colour.primary, lineHeight: 18, marginBottom: 4 }}>
                    {notification.message}
                  </Text>
                  <Text style={{ ...typography.micro, color: colour.textSub }}>{notification.timestamp}</Text>
                </View>
                {notification.priority === "high" && (
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colour.danger, marginLeft: 8, marginTop: 2 }} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
