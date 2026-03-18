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

// ─── Phone Shell ──────────────────────────────────────────────────────────────
function PhoneShell({ children, activeTab = "Settings", navigation }) {
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

// ─── Settings Row ─────────────────────────────────────────────────────────────
function SettingsRow({
  icon,
  label,
  sublabel,
  value,
  onPress,
  showChevron = true,
  danger = false,
  toggle,
  toggleValue,
  onToggle,
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={toggle ? 1 : 0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        backgroundColor: C.white,
      }}
    >
      {/* Icon bubble */}
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          backgroundColor: danger ? "#FEF0EF" : C.bgLight,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 14,
        }}
      >
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>

      {/* Labels */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: danger ? C.danger : C.text,
          }}
        >
          {label}
        </Text>
        {sublabel ? (
          <Text style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}>
            {sublabel}
          </Text>
        ) : null}
      </View>

      {/* Right side */}
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: C.border, true: C.teal }}
          thumbColor={toggleValue ? C.white : C.white}
        />
      ) : (
        <>
          {value ? (
            <Text style={{ fontSize: 12, color: C.textSub, marginRight: 8 }}>
              {value}
            </Text>
          ) : null}
          {showChevron && (
            <Text
              style={{ color: C.midNavy2, fontSize: 18, fontWeight: "300" }}
            >
              ›
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

// ─── Settings Section ─────────────────────────────────────────────────────────
function SettingsSection({ title, children }) {
  return (
    <View style={{ marginBottom: 6 }}>
      {title ? (
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
          {title}
        </Text>
      ) : null}
      <View
        style={{
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: C.border,
          overflow: "hidden",
        }}
      >
        {children}
      </View>
    </View>
  );
}

// ─── SCREEN: Settings Home ────────────────────────────────────────────────────
export default function SettingsHomeScreen({ navigation }) {
  const [offlineMode, setOfflineMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

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
        <Text
          style={{
            color: C.teal,
            fontSize: 12,
            fontWeight: "600",
            letterSpacing: 1,
          }}
        >
          MYEXPENSE
        </Text>
        <Text
          style={{
            color: C.white,
            fontSize: 24,
            fontWeight: "800",
            marginTop: 4,
          }}
        >
          Settings
        </Text>
      </View>

      {/* White card slides up */}
      <View
        style={{
          backgroundColor: C.bgLighter,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          marginTop: -16,
          paddingBottom: 30,
        }}
      >
        {/* Profile Preview Card */}
        <TouchableOpacity
          onPress={() => navigation?.navigate("ProfilePersonal")}
          style={{
            margin: 16,
            backgroundColor: C.navy,
            borderRadius: 16,
            padding: 18,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {/* Avatar */}
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: C.teal,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 14,
            }}
          >
            <Text style={{ color: C.white, fontSize: 20, fontWeight: "800" }}>
              IN
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.white, fontSize: 16, fontWeight: "700" }}>
              Ian Naidu
            </Text>
            <Text style={{ color: C.textSub, fontSize: 12, marginTop: 2 }}>
              ian@myexpense.co.za
            </Text>
            <View
              style={{
                marginTop: 6,
                alignSelf: "flex-start",
                backgroundColor: C.teal,
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text style={{ color: C.white, fontSize: 10, fontWeight: "700" }}>
                PRO PLAN
              </Text>
            </View>
          </View>
          <Text style={{ color: C.midNavy2, fontSize: 22 }}>›</Text>
        </TouchableOpacity>

        {/* Account */}
        <SettingsSection title="Account">
          <SettingsRow
            icon="👤"
            label="Profile & Personal"
            sublabel="Name, tax number, address"
            onPress={() => navigation?.navigate("ProfilePersonal")}
          />
          <SettingsRow
            icon="💳"
            label="Subscription & Billing"
            sublabel="Pro Plan · Renews 1 Apr 2025"
            onPress={() => navigation?.navigate("SubscriptionBilling")}
          />
          <SettingsRow
            icon="🔔"
            label="Notification Preferences"
            sublabel="Reminders, alerts, reports"
            onPress={() => navigation?.navigate("NotificationPrefs")}
          />
        </SettingsSection>

        {/* Security */}
        <SettingsSection title="Security & Privacy">
          <SettingsRow
            icon="🔒"
            label="Security"
            sublabel="PIN, biometrics, 2FA"
            onPress={() => navigation?.navigate("Security")}
          />
          <SettingsRow
            icon="🛡"
            label="Data & Privacy"
            sublabel="POPIA, export, delete account"
            onPress={() => navigation?.navigate("DataPrivacy")}
          />
        </SettingsSection>

        {/* App Preferences */}
        <SettingsSection title="App Preferences">
          <SettingsRow
            icon="🌙"
            label="Dark Mode"
            sublabel="Switch to dark theme"
            toggle
            toggleValue={darkMode}
            onToggle={setDarkMode}
            showChevron={false}
          />
          <SettingsRow
            icon="📶"
            label="Offline Mode"
            sublabel="Save data without internet"
            toggle
            toggleValue={offlineMode}
            onToggle={setOfflineMode}
            showChevron={false}
          />
          <SettingsRow
            icon="💱"
            label="Currency & Tax Year"
            value="ZAR · 2024/25"
            onPress={() => {}}
          />
        </SettingsSection>

        {/* Support */}
        <SettingsSection title="Support">
          <SettingsRow
            icon="❓"
            label="Help & Support"
            sublabel="FAQs, contact, tutorials"
            onPress={() => navigation?.navigate("HelpSupport")}
          />
          <SettingsRow
            icon="ℹ️"
            label="About MyExpense"
            sublabel="Version, legal, licences"
            onPress={() => navigation?.navigate("About")}
          />
        </SettingsSection>

        {/* Danger Zone */}
        <SettingsSection title="Account Actions">
          <SettingsRow
            icon="🚪"
            label="Sign Out"
            onPress={() => navigation?.navigate("Login")}
            showChevron={false}
            danger
          />
        </SettingsSection>

        {/* App Version Footer */}
        <Text
          style={{
            textAlign: "center",
            fontSize: 11,
            color: C.textSub,
            marginTop: 20,
            marginBottom: 4,
          }}
        >
          MyExpense v1.0.0 · Built for SARS ITR12
        </Text>
        <Text
          style={{
            textAlign: "center",
            fontSize: 11,
            color: C.textSub,
          }}
        >
          © 2025 MyExpense (PTY) Ltd
        </Text>
      </View>
    </PhoneShell>
  );
}
