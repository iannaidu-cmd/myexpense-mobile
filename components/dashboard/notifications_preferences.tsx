import React, { useState } from "react";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";

// ─── Brand Colours ────────────────────────────────────────────────────────────
const C = {
  navy: "#2E2E7A",
  navyDark: "#1A1A5C",
  teal: "#3BBFAD",
  midNavy: "#3D3D9E",
  midNavy2: "#5B5BB8",
  bgLight: "#E8EAF6",
  bgLighter: "#F5F6FF",
  white: "#FFFFFF",
  text: "#1A1A2E",
  textSub: "#6B6B9E",
  border: "#D0D3F0",
  success: "#27AE60",
  warning: "#F39C12",
  danger: "#E74C3C",
};

const NAV = { Home: "⊞", Scan: "⊡", Reports: "◈", Settings: "⚙" };

function PhoneShell({
  children,
  activeTab = "Settings",
  navigation,
}: {
  children: React.ReactNode;
  activeTab?: string;
  navigation?: any;
}) {
  const tabs = [
    { key: "Home", label: "Home", icon: NAV.Home },
    { key: "Scan", label: "Scan", icon: NAV.Scan },
    { key: "Reports", label: "Reports", icon: NAV.Reports },
    { key: "Settings", label: "Settings", icon: NAV.Settings },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: C.bgLighter }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      <View
        style={{
          flexDirection: "row",
          backgroundColor: C.white,
          borderTopWidth: 1,
          borderTopColor: C.border,
          paddingBottom: 8,
          paddingTop: 6,
        }}
      >
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => navigation?.navigate(t.key)}
            style={{ flex: 1, alignItems: "center" }}
          >
            <Text
              style={{
                fontSize: 20,
                color: activeTab === t.key ? C.teal : C.textSub,
              }}
            >
              {t.icon}
            </Text>
            <Text
              style={{
                fontSize: 10,
                marginTop: 2,
                color: activeTab === t.key ? C.teal : C.textSub,
                fontWeight: activeTab === t.key ? "700" : "400",
              }}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Toggle Row ───────────────────────────────────────────────────────────────
function ToggleRow({
  icon,
  label,
  sublabel,
  value,
  onToggle,
  indent = false,
}: {
  icon?: string;
  label: string;
  sublabel?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  indent?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: indent ? 28 : 16,
        paddingVertical: 13,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        backgroundColor: C.white,
      }}
    >
      {!indent && (
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: C.bgLight,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 14,
          }}
        >
          <Text style={{ fontSize: 17 }}>{icon}</Text>
        </View>
      )}
      {indent && (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: C.border,
            marginRight: 14,
          }}
        />
      )}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: indent ? 13 : 14,
            fontWeight: "600",
            color: C.text,
          }}
        >
          {label}
        </Text>
        {sublabel ? (
          <Text style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>
            {sublabel}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: C.border, true: C.teal }}
        thumbColor={C.white}
      />
    </View>
  );
}

// ─── Frequency Selector ───────────────────────────────────────────────────────
function FrequencySelector({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        backgroundColor: C.white,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: C.text,
          marginBottom: 10,
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => onChange(opt)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: value === opt ? C.navy : C.bgLight,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: value === opt ? C.white : C.textSub,
              }}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── SCREEN: Notification Preferences ────────────────────────────────────────
export default function NotificationPrefsScreen({
  navigation,
}: {
  navigation?: any;
}) {
  const [prefs, setPrefs] = useState({
    masterPush: true,
    receiptReminder: true,
    budgetAlerts: true,
    budgetWarning: true,
    budgetOverrun: true,
    taxDeadlines: true,
    itr12Reminder: true,
    monthlyReport: true,
    weeklyDigest: false,
    appUpdates: false,
    marketingEmails: false,
    smsAlerts: false,
  });

  const [reportFreq, setReportFreq] = useState("Monthly");
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("07:00");

  const toggle = (key: string) =>
    setPrefs((p) => ({ ...p, [key]: !p[key as keyof typeof p] }));

  return (
    <PhoneShell activeTab="Settings" navigation={navigation}>
      {/* Header */}
      <View
        style={{
          backgroundColor: C.navy,
          paddingTop: 52,
          paddingBottom: 28,
          paddingHorizontal: 20,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={{ marginBottom: 10 }}
        >
          <Text style={{ color: C.teal, fontSize: 13 }}>‹ Settings</Text>
        </TouchableOpacity>
        <Text
          style={{
            color: C.teal,
            fontSize: 12,
            fontWeight: "600",
            letterSpacing: 1,
          }}
        >
          SETTINGS
        </Text>
        <Text
          style={{
            color: C.white,
            fontSize: 22,
            fontWeight: "800",
            marginTop: 4,
          }}
        >
          Notifications
        </Text>
      </View>

      <View
        style={{
          backgroundColor: C.bgLighter,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          marginTop: -16,
          paddingBottom: 30,
        }}
      >
        {/* Master Toggle */}
        <View style={{ marginTop: 0 }}>
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 20,
              marginBottom: 6,
              backgroundColor: prefs.masterPush ? C.navy : C.bgLight,
              borderRadius: 14,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 24, marginRight: 14 }}>🔔</Text>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: prefs.masterPush ? C.white : C.text,
                }}
              >
                Push Notifications
              </Text>
              <Text style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}>
                {prefs.masterPush
                  ? "Enabled — tap to disable all"
                  : "All notifications paused"}
              </Text>
            </View>
            <Switch
              value={prefs.masterPush}
              onValueChange={() => toggle("masterPush")}
              trackColor={{ false: C.border, true: C.teal }}
              thumbColor={C.white}
            />
          </View>
        </View>

        {/* Expense Reminders */}
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: C.textSub,
            letterSpacing: 0.8,
            paddingHorizontal: 16,
            paddingTop: 18,
            paddingBottom: 8,
            textTransform: "uppercase",
          }}
        >
          Expense Reminders
        </Text>
        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: C.border,
            overflow: "hidden",
          }}
        >
          <ToggleRow
            icon="🧾"
            label="Receipt Capture Reminder"
            sublabel="Daily nudge if no expense logged"
            value={prefs.receiptReminder}
            onToggle={() => toggle("receiptReminder")}
          />
        </View>

        {/* Budget Alerts */}
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: C.textSub,
            letterSpacing: 0.8,
            paddingHorizontal: 16,
            paddingTop: 18,
            paddingBottom: 8,
            textTransform: "uppercase",
          }}
        >
          Budget Alerts
        </Text>
        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: C.border,
            overflow: "hidden",
          }}
        >
          <ToggleRow
            icon="🎯"
            label="Budget Alerts"
            sublabel="When nearing or over budget"
            value={prefs.budgetAlerts}
            onToggle={() => toggle("budgetAlerts")}
          />
          <ToggleRow
            label="80% budget warning"
            sublabel="Alert when 80% of category budget used"
            value={prefs.budgetWarning}
            onToggle={() => toggle("budgetWarning")}
            indent
          />
          <ToggleRow
            label="Budget overrun alert"
            sublabel="Immediate alert when over budget"
            value={prefs.budgetOverrun}
            onToggle={() => toggle("budgetOverrun")}
            indent
          />
        </View>

        {/* Tax & SARS */}
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: C.textSub,
            letterSpacing: 0.8,
            paddingHorizontal: 16,
            paddingTop: 18,
            paddingBottom: 8,
            textTransform: "uppercase",
          }}
        >
          Tax & SARS
        </Text>
        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: C.border,
            overflow: "hidden",
          }}
        >
          <ToggleRow
            icon="🗓"
            label="Tax Deadlines"
            sublabel="SARS filing and payment reminders"
            value={prefs.taxDeadlines}
            onToggle={() => toggle("taxDeadlines")}
          />
          <ToggleRow
            icon="📋"
            label="ITR12 Preparation Reminder"
            sublabel="60-day notice before filing period"
            value={prefs.itr12Reminder}
            onToggle={() => toggle("itr12Reminder")}
          />
        </View>

        {/* Reports */}
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: C.textSub,
            letterSpacing: 0.8,
            paddingHorizontal: 16,
            paddingTop: 18,
            paddingBottom: 8,
            textTransform: "uppercase",
          }}
        >
          Reports & Digests
        </Text>
        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: C.border,
            overflow: "hidden",
          }}
        >
          <ToggleRow
            icon="📊"
            label="Spending Report"
            sublabel="Automated summary report"
            value={prefs.monthlyReport}
            onToggle={() => toggle("monthlyReport")}
          />
          <FrequencySelector
            label="Report Frequency"
            options={["Weekly", "Monthly", "Quarterly"]}
            value={reportFreq}
            onChange={setReportFreq}
          />
          <ToggleRow
            icon="📰"
            label="Weekly Digest"
            sublabel="Summary of week's expenses every Sunday"
            value={prefs.weeklyDigest}
            onToggle={() => toggle("weeklyDigest")}
          />
        </View>

        {/* Other */}
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: C.textSub,
            letterSpacing: 0.8,
            paddingHorizontal: 16,
            paddingTop: 18,
            paddingBottom: 8,
            textTransform: "uppercase",
          }}
        >
          Other
        </Text>
        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: C.border,
            overflow: "hidden",
          }}
        >
          <ToggleRow
            icon="🔄"
            label="App Updates"
            sublabel="New features and release notes"
            value={prefs.appUpdates}
            onToggle={() => toggle("appUpdates")}
          />
          <ToggleRow
            icon="📧"
            label="Marketing Emails"
            sublabel="Tips, offers, and product news"
            value={prefs.marketingEmails}
            onToggle={() => toggle("marketingEmails")}
          />
          <ToggleRow
            icon="💬"
            label="SMS Alerts"
            sublabel="Critical SARS deadline SMS alerts"
            value={prefs.smsAlerts}
            onToggle={() => toggle("smsAlerts")}
          />
        </View>

        {/* Quiet Hours */}
        <View
          style={{
            backgroundColor: C.white,
            marginHorizontal: 16,
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: C.border,
            marginTop: 20,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: C.text,
              marginBottom: 12,
            }}
          >
            🌙 Quiet Hours
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: C.textSub,
              marginBottom: 12,
              lineHeight: 18,
            }}
          >
            No notifications will be sent during quiet hours.
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: C.bgLighter,
                borderRadius: 10,
                padding: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 11, color: C.textSub }}>Start</Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "800",
                  color: C.navy,
                  marginTop: 4,
                }}
              >
                {quietStart}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: C.bgLighter,
                borderRadius: 10,
                padding: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 11, color: C.textSub }}>End</Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "800",
                  color: C.navy,
                  marginTop: 4,
                }}
              >
                {quietEnd}
              </Text>
            </View>
          </View>
        </View>

        {/* Save */}
        <TouchableOpacity
          style={{
            marginHorizontal: 16,
            backgroundColor: C.teal,
            borderRadius: 14,
            padding: 16,
            alignItems: "center",
          }}
        >
          <Text style={{ color: C.white, fontSize: 15, fontWeight: "700" }}>
            Save Preferences
          </Text>
        </TouchableOpacity>
      </View>
    </PhoneShell>
  );
}
