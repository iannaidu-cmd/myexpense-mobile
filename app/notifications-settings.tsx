import { MXBackHeader } from "@/components/MXBackHeader";
import { colour, radius, space, typography } from "@/tokens";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { ScrollView, StatusBar, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STORAGE_KEY = "mx_notification_prefs";

interface NotificationPrefs {
  weeklyReminder: boolean;
  sarsDeadlines: boolean;
  receiptReminders: boolean;
  monthlyReport: boolean;
  promoUpdates: boolean;
}

const DEFAULTS: NotificationPrefs = {
  weeklyReminder: true,
  sarsDeadlines: true,
  receiptReminders: true,
  monthlyReport: true,
  promoUpdates: false,
};

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
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.sm,
          backgroundColor: colour.primary50,
          alignItems: "center",
          justifyContent: "center",
          marginRight: space.md,
        }}
      >
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1, marginRight: space.sm }}>
        <Text style={{ ...typography.labelM, color: colour.text }}>
          {label}
        </Text>
        <Text
          style={{ ...typography.bodyXS, color: colour.textSub, marginTop: 2 }}
        >
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
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setPrefs({ ...DEFAULTS, ...JSON.parse(raw) });
      })
      .finally(() => setLoaded(true));
  }, []);

  const update = (key: keyof NotificationPrefs) => async (value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));

    // Re-run the affected scheduler so it reads the updated prefs and
    // either cancels the notification (pref=false) or reschedules it (pref=true)
    try {
      if (key === "weeklyReminder") await scheduleWeeklyExpenseReminder();
      if (key === "monthlyReport") await scheduleMonthlyReportReminder();
      if (key === "sarsDeadlines") await scheduleSARSDeadlineReminders();
    } catch {
      // Scheduling errors are non-fatal — works only in EAS builds
    }
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.primary }}
    >
      <StatusBar barStyle="light-content" backgroundColor={colour.primary} />
      <MXBackHeader title="Notifications" />

      <ScrollView
        style={{
          flex: 1,
          backgroundColor: colour.background,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
        }}
        contentContainerStyle={{ paddingBottom: space["5xl"] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Info banner */}
        <View
          style={{
            margin: space.lg,
            backgroundColor: colour.infoLight,
            borderRadius: radius.md,
            padding: space.md,
            flexDirection: "row",
            gap: space.sm,
          }}
        >
          <Text style={{ fontSize: 16 }}>ℹ️</Text>
          <Text style={{ ...typography.bodyS, color: colour.info, flex: 1 }}>
            Push notifications activate in the production build. Your
            preferences are saved and will apply automatically.
          </Text>
        </View>

        {/* Reminders */}
        <SectionHeader title="Reminders" />
        <View
          style={{
            backgroundColor: colour.bgCard,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colour.border,
          }}
        >
          <PreferenceRow
            icon="📊"
            label="Weekly expense summary"
            sub="Reminder to log and review expenses each week"
            value={prefs.weeklyReminder}
            onToggle={update("weeklyReminder")}
          />
          <PreferenceRow
            icon="📅"
            label="Monthly report ready"
            sub="Notification when your monthly report is available"
            value={prefs.monthlyReport}
            onToggle={update("monthlyReport")}
          />
          <PreferenceRow
            icon="🧾"
            label="Receipt reminders"
            sub="Nudge to attach a receipt to unverified expenses"
            value={prefs.receiptReminders}
            onToggle={update("receiptReminders")}
          />
        </View>

        {/* SARS & Tax */}
        <SectionHeader title="Tax & Filing" />
        <View
          style={{
            backgroundColor: colour.bgCard,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colour.border,
          }}
        >
          <PreferenceRow
            icon="🇿🇦"
            label="SARS filing deadlines"
            sub="Alerts before the ITR12 submission window closes"
            value={prefs.sarsDeadlines}
            onToggle={update("sarsDeadlines")}
          />
        </View>

        {/* App updates */}
        <SectionHeader title="App Updates" />
        <View
          style={{
            backgroundColor: colour.bgCard,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colour.border,
          }}
        >
          <PreferenceRow
            icon="🎉"
            label="Tips & new features"
            sub="Occasional updates about new MyExpense features"
            value={prefs.promoUpdates}
            onToggle={update("promoUpdates")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
