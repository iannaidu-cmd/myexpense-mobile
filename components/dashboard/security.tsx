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

// ─── Security Row ─────────────────────────────────────────────────────────────
function SecurityRow({
  icon,
  label,
  sublabel,
  value,
  toggle,
  toggleValue,
  onToggle,
  onPress,
  danger = false,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  value?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
  danger?: boolean;
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
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: C.border, true: C.teal }}
          thumbColor={C.white}
        />
      ) : (
        <>
          {value ? (
            <Text style={{ fontSize: 12, color: C.textSub, marginRight: 8 }}>
              {value}
            </Text>
          ) : null}
          <Text style={{ color: C.midNavy2, fontSize: 18, fontWeight: "300" }}>
            ›
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ─── Session Row ──────────────────────────────────────────────────────────────
function SessionRow({
  device,
  location,
  lastActive,
  current,
}: {
  device: string;
  location: string;
  lastActive: string;
  current?: boolean;
}) {
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          backgroundColor: current ? C.navy : C.bgLight,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 14,
        }}
      >
        <Text style={{ fontSize: 18 }}>{current ? "📱" : "💻"}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: C.text }}>
            {device}
          </Text>
          {current && (
            <View
              style={{
                marginLeft: 8,
                backgroundColor: "#E8F8F3",
                borderRadius: 6,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <Text
                style={{ fontSize: 10, fontWeight: "700", color: C.success }}
              >
                THIS DEVICE
              </Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>
          {location} · {lastActive}
        </Text>
      </View>
      {!current && (
        <TouchableOpacity>
          <Text style={{ color: C.danger, fontSize: 12, fontWeight: "600" }}>
            Revoke
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── SCREEN: Security ─────────────────────────────────────────────────────────
export default function SecurityScreen({ navigation }: { navigation?: any }) {
  const [biometrics, setBiometrics] = useState(true);
  const [pin, setPin] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [autoLock, setAutoLock] = useState(true);
  const [screenshotLock, setScreenshotLock] = useState(false);

  const [lockTimeout, setLockTimeout] = useState("1 min");
  const timeouts = ["Immediately", "1 min", "5 min", "15 min", "Never"];

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
          Security
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
        {/* Security Score */}
        <View
          style={{
            margin: 16,
            backgroundColor: C.navy,
            borderRadius: 16,
            padding: 18,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 24, marginRight: 12 }}>🔐</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.white, fontSize: 14, fontWeight: "700" }}>
                Security Score
              </Text>
              <Text style={{ color: C.textSub, fontSize: 12, marginTop: 2 }}>
                {twoFactor
                  ? "Strong"
                  : "Good — enable 2FA for maximum protection"}
              </Text>
            </View>
            <Text style={{ color: C.teal, fontSize: 28, fontWeight: "900" }}>
              {twoFactor ? "95" : "72"}%
            </Text>
          </View>
          <View
            style={{ height: 8, backgroundColor: C.navyDark, borderRadius: 4 }}
          >
            <View
              style={{
                height: 8,
                borderRadius: 4,
                width: twoFactor ? "95%" : "72%",
                backgroundColor: twoFactor ? C.success : C.teal,
              }}
            />
          </View>
          {!twoFactor && (
            <Text style={{ color: C.warning, fontSize: 11, marginTop: 8 }}>
              💡 Enable Two-Factor Authentication to reach 95%
            </Text>
          )}
        </View>

        {/* App Lock */}
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: C.textSub,
            letterSpacing: 0.8,
            paddingHorizontal: 16,
            paddingTop: 4,
            paddingBottom: 8,
          }}
        >
          App lock
        </Text>
        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: C.border,
            overflow: "hidden",
          }}
        >
          <SecurityRow
            icon="🤳"
            label="Biometric Unlock"
            sublabel="Face ID / Fingerprint"
            toggle
            toggleValue={biometrics}
            onToggle={() => setBiometrics((v) => !v)}
          />
          <SecurityRow
            icon="🔢"
            label="PIN Lock"
            sublabel="6-digit PIN required on open"
            toggle
            toggleValue={pin}
            onToggle={() => setPin((v) => !v)}
          />
          <SecurityRow
            icon="⏱"
            label="Change PIN"
            sublabel="Update your 6-digit PIN"
            onPress={() => {}}
          />
          <SecurityRow
            icon="⏳"
            label="Auto-Lock"
            sublabel="Lock app after inactivity"
            toggle
            toggleValue={autoLock}
            onToggle={() => setAutoLock((v) => !v)}
          />
          {/* Timeout Selector */}
          {autoLock && (
            <View
              style={{
                paddingHorizontal: 28,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: C.border,
                backgroundColor: C.white,
              }}
            >
              <Text style={{ fontSize: 12, color: C.textSub, marginBottom: 8 }}>
                Lock after:
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {timeouts.map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setLockTimeout(t)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 5,
                      borderRadius: 20,
                      backgroundColor: lockTimeout === t ? C.navy : C.bgLight,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: lockTimeout === t ? C.white : C.textSub,
                      }}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          <SecurityRow
            icon="📸"
            label="Block Screenshots"
            sublabel="Prevent screenshots of financial data"
            toggle
            toggleValue={screenshotLock}
            onToggle={() => setScreenshotLock((v) => !v)}
          />
        </View>

        {/* Two-Factor Authentication */}
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: C.textSub,
            letterSpacing: 0.8,
            paddingHorizontal: 16,
            paddingTop: 18,
            paddingBottom: 8,
          }}
        >
          Two-factor authentication
        </Text>
        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: C.border,
            overflow: "hidden",
          }}
        >
          <SecurityRow
            icon="🛡"
            label="Enable 2FA"
            sublabel={
              twoFactor
                ? "Authenticator app active"
                : "Add an extra layer of security"
            }
            toggle
            toggleValue={twoFactor}
            onToggle={() => setTwoFactor((v) => !v)}
          />
          {twoFactor && (
            <SecurityRow
              icon="📋"
              label="Backup Codes"
              sublabel="View or regenerate recovery codes"
              onPress={() => {}}
            />
          )}
        </View>

        {/* Active Sessions */}
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: C.textSub,
            letterSpacing: 0.8,
            paddingHorizontal: 16,
            paddingTop: 18,
            paddingBottom: 8,
          }}
        >
          Active sessions
        </Text>
        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: C.border,
            overflow: "hidden",
            backgroundColor: C.white,
          }}
        >
          <SessionRow
            device="Samsung Galaxy S24"
            location="Cape Town, ZA"
            lastActive="Now"
            current
          />
          <SessionRow
            device="Chrome · MacBook Pro"
            location="Cape Town, ZA"
            lastActive="2 hours ago"
            current={false}
          />
          <TouchableOpacity style={{ padding: 14, alignItems: "center" }}>
            <Text style={{ color: C.danger, fontSize: 13, fontWeight: "600" }}>
              Sign Out All Other Sessions
            </Text>
          </TouchableOpacity>
        </View>

        {/* Password */}
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: C.textSub,
            letterSpacing: 0.8,
            paddingHorizontal: 16,
            paddingTop: 18,
            paddingBottom: 8,
          }}
        >
          Password
        </Text>
        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: C.border,
            overflow: "hidden",
          }}
        >
          <SecurityRow
            icon="🔑"
            label="Change Password"
            sublabel="Last changed 45 days ago"
            onPress={() => {}}
          />
          <SecurityRow
            icon="🚪"
            label="Sign Out Everywhere"
            sublabel="Revoke all active sessions"
            onPress={() => {}}
            danger
          />
        </View>

        <View style={{ margin: 16, marginTop: 20 }}>
          <Text
            style={{
              fontSize: 11,
              color: C.textSub,
              textAlign: "center",
              lineHeight: 16,
            }}
          >
            🔒 All data is encrypted at rest using AES-256.{"\n"}
            Financial data is never stored on your device unencrypted.
          </Text>
        </View>
      </View>
    </PhoneShell>
  );
}
