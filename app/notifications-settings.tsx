import { InfoBanner } from "@/components/InfoBanner";
import { MXBackHeader } from "@/components/MXBackHeader";
import { MXButton } from "@/components/MXButton";
import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { colour, radius, space, typography } from "@/tokens";
import React, { useCallback, useEffect, useState } from "react";
import { AppState, Linking, ScrollView, StatusBar, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  cancelAllReceiptReminders,
  cancelMonthlyReportReminder,
  cancelSARSDeadlineReminders,
  cancelWeeklyExpenseReminder,
  DEFAULT_NOTIFICATION_PREFS,
  getNotificationPermission,
  getNotificationPrefs,
  requestNotificationPermission,
  saveNotificationPrefs,
  scheduleMonthlyReportReminder,
  scheduleSARSDeadlineReminders,
  scheduleWeeklyExpenseReminder,
  syncScheduledReminders,
  type NotificationPrefs,
} from "@/services/notificationService";

type Permission = "granted" | "denied" | "undetermined" | "unknown";

// ─── Row ──────────────────────────────────────────────────────────────────────
function PreferenceRow({
  icon,
  label,
  sub,
  value,
  onToggle,
}: {
  icon: string;
  label: string;
  sub: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: space.lg,
        paddingVertical: space.md,
        borderBottomWidth: 1,
        borderBottomColor: colour.border,
        backgroundColor: colour.bgCard,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: radius.pill,
          backgroundColor: colour.primary50,
          alignItems: "center",
          justifyContent: "center",
          marginRight: space.md,
        }}
      >
        <IconSymbol name={icon as any} size={15} color={colour.accentDeep} />
      </View>
      <View style={{ flex: 1, marginRight: space.sm }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: colour.text }}>
          {label}
        </Text>
        <Text style={{ fontSize: 11, color: colour.textSub, marginTop: 2 }}>
          {sub}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colour.border, true: colour.primary }}
        thumbColor={colour.white}
      />
    </View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <Text
      style={{
        ...typography.captionM,
        color: colour.textSub,
        letterSpacing: 0.8,
        paddingHorizontal: space.lg,
        paddingTop: space.lg,
        paddingBottom: space.sm,
        textTransform: "uppercase",
      }}
    >
      {title}
    </Text>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function NotificationsSettingsScreen() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [permission, setPermission] = useState<Permission>("unknown");

  useEffect(() => {
    getNotificationPrefs().then(setPrefs);
  }, []);

  // Re-check when they come back from the phone's settings.
  const checkPermission = useCallback(() => {
    getNotificationPermission().then(setPermission).catch(() => setPermission("unknown"));
  }, []);
  useEffect(() => {
    checkPermission();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") checkPermission();
    });
    return () => sub.remove();
  }, [checkPermission]);

  const turnOnNotifications = async () => {
    if (permission === "undetermined") {
      const granted = await requestNotificationPermission().catch(() => false);
      checkPermission();
      if (granted) syncScheduledReminders().catch(() => {});
    } else {
      Linking.openSettings();
    }
  };

  const update = (key: keyof NotificationPrefs) => async (value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    await saveNotificationPrefs(next);

    try {
      if (key === "weeklyReminder") {
        value ? await scheduleWeeklyExpenseReminder() : await cancelWeeklyExpenseReminder();
      }
      if (key === "monthlyReport") {
        value ? await scheduleMonthlyReportReminder() : await cancelMonthlyReportReminder();
      }
      if (key === "sarsDeadlines") {
        value ? await scheduleSARSDeadlineReminders() : await cancelSARSDeadlineReminders();
      }
      // Receipt reminders are scheduled when an expense is saved. Turning
      // them on applies from the next save; turning them off clears any pending.
      if (key === "receiptReminders" && !value) {
        await cancelAllReceiptReminders();
      }
    } catch (e) {
      console.warn("Notification preference change not applied:", e);
    }
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.background }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />
      <MXBackHeader title="Notifications" />

      <ScrollView
        style={{ flex: 1, backgroundColor: colour.background }}
        contentContainerStyle={{ paddingBottom: space["5xl"] }}
        showsVerticalScrollIndicator={false}
      >
        {permission === "denied" || permission === "undetermined" ? (
          <View style={{ margin: space.lg, gap: space.md }}>
            <InfoBanner
              icon="bell.fill"
              title="Notifications are off"
              body={
                permission === "denied"
                  ? "MyExpense can't send you reminders. Turn notifications on in your phone's settings."
                  : "Allow notifications so MyExpense can send you these reminders."
              }
            />
            <MXButton
              label={permission === "denied" ? "Open phone settings" : "Turn on notifications"}
              variant="secondary"
              onPress={turnOnNotifications}
            />
          </View>
        ) : null}

        {/* Reminders */}
        <SectionHeader title="Reminders" />
        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colour.border,
          }}
        >
          <PreferenceRow
            icon="chart.bar.fill"
            label="Weekly reminder"
            sub="Every Monday morning, a reminder to add your expenses"
            value={prefs.weeklyReminder}
            onToggle={update("weeklyReminder")}
          />
          <PreferenceRow
            icon="calendar"
            label="Monthly check-in"
            sub="On the 1st, a reminder to look over last month"
            value={prefs.monthlyReport}
            onToggle={update("monthlyReport")}
          />
          <PreferenceRow
            icon="doc.text.fill"
            label="Receipt reminders"
            sub="The day after you add a business expense with no receipt"
            value={prefs.receiptReminders}
            onToggle={update("receiptReminders")}
          />
        </View>

        {/* SARS */}
        <SectionHeader title="Tax and filing" />
        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colour.border,
          }}
        >
          <PreferenceRow
            icon="flag.fill"
            label="SARS filing dates"
            sub="When filing season opens and a week before each deadline"
            value={prefs.sarsDeadlines}
            onToggle={update("sarsDeadlines")}
          />
        </View>


      </ScrollView>
      <MXTabBar />
    </SafeAreaView>
  );
}
