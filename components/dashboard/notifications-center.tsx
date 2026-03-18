import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import type { Notification } from "./types";

const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "Receipt uploaded",
    message: "Your Uber receipt has been added to your deductible expenses",
    icon: "📝",
    timestamp: "2 minutes ago",
    priority: "normal",
    read: false,
  },
  {
    id: "2",
    title: "Tax savings milestone",
    message: "You've saved R5,000 on your tax this month! 🎉",
    icon: "🎯",
    timestamp: "1 hour ago",
    priority: "high",
    read: false,
  },
  {
    id: "3",
    title: "Monthly report ready",
    message: "Your March 2026 expense report is ready to download",
    icon: "📊",
    timestamp: "3 hours ago",
    priority: "normal",
    read: true,
  },
  {
    id: "4",
    title: "Budget alert",
    message: "You're approaching your monthly office supplies budget",
    icon: "⚠️",
    timestamp: "1 day ago",
    priority: "high",
    read: true,
  },
];

interface NotificationsCenterProps {
  onClose: () => void;
}

export function NotificationsCenter({ onClose }: NotificationsCenterProps) {
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const clearAll = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <ThemedText style={styles.title}>Notifications</ThemedText>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <ThemedText style={styles.badgeText}>{unreadCount}</ThemedText>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={clearAll}>
            <ThemedText style={styles.clearLink}>Mark all as read</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyIcon}>🔔</ThemedText>
            <ThemedText style={styles.emptyTitle}>All caught up!</ThemedText>
            <ThemedText style={styles.emptyText}>
              You have no new notifications
            </ThemedText>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationItem,
                  !notification.read && styles.notificationItemUnread,
                ]}
                onPress={() => markAsRead(notification.id)}
              >
                <View style={styles.notificationIcon}>
                  <ThemedText style={styles.notificationEmojiIcon}>
                    {notification.icon}
                  </ThemedText>
                </View>

                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <ThemedText style={styles.notificationTitle}>
                      {notification.title}
                    </ThemedText>
                    {!notification.read && <View style={styles.unreadDot} />}
                  </View>
                  <ThemedText style={styles.notificationMessage}>
                    {notification.message}
                  </ThemedText>
                  <ThemedText style={styles.notificationTime}>
                    {notification.timestamp}
                  </ThemedText>
                </View>

                {notification.priority === "high" && (
                  <View style={styles.priorityBadge} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: "#0D47A1",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    flex: 1,
  },
  badge: {
    backgroundColor: "#E05555",
    borderRadius: 12,
    minWidth: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  clearLink: {
    fontSize: 13,
    color: "#0288D1",
    fontWeight: "600",
  },
  scrollContent: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0D47A1",
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: "#757575",
  },
  notificationsList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: "transparent",
  },
  notificationItemUnread: {
    borderLeftColor: "#0288D1",
    backgroundColor: "rgba(2,136,209,0.04)",
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(21,101,192,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  notificationEmojiIcon: {
    fontSize: 20,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0D47A1",
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0288D1",
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 12,
    color: "#0D47A1",
    lineHeight: 1.5,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 11,
    color: "#757575",
  },
  priorityBadge: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E05555",
    marginLeft: 8,
    marginTop: 2,
  },
});
