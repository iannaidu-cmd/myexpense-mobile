import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

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

// ─── Shared full-width base64 logo placeholder ────────────────────────────────
// Replace FULL_LOGO with your actual base64 gif constant
const FULL_LOGO = null; // e.g. require('../assets/logo-full.gif')

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

// ─── About Row ────────────────────────────────────────────────────────────────
function AboutRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        backgroundColor: C.white,
      }}
    >
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
      <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: C.text }}>
        {label}
      </Text>
      {value ? (
        <Text
          style={{
            fontSize: 13,
            color: C.textSub,
            marginRight: onPress ? 8 : 0,
          }}
        >
          {value}
        </Text>
      ) : null}
      {onPress ? (
        <Text style={{ color: C.midNavy2, fontSize: 18, fontWeight: "300" }}>
          ›
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

// ─── Licence Chip ─────────────────────────────────────────────────────────────
function LicenceChip({ name, version }: { name: string; version: string }) {
  return (
    <View
      style={{
        backgroundColor: C.bgLight,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: "600", color: C.text }}>
        {name}
      </Text>
      <Text style={{ fontSize: 10, color: C.textSub }}>{version}</Text>
    </View>
  );
}

// ─── What's New Row ───────────────────────────────────────────────────────────
function ChangelogItem({
  version,
  date,
  items,
}: {
  version: string;
  date: string;
  items: string[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity
      onPress={() => setOpen((v) => !v)}
      style={{
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        backgroundColor: C.white,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 13,
        }}
      >
        <View
          style={{
            backgroundColor: C.navy,
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 3,
            marginRight: 12,
          }}
        >
          <Text style={{ color: C.white, fontSize: 11, fontWeight: "700" }}>
            v{version}
          </Text>
        </View>
        <Text
          style={{ flex: 1, fontSize: 13, fontWeight: "600", color: C.text }}
        >
          {date}
        </Text>
        <Text style={{ color: C.midNavy2, fontSize: 18, fontWeight: "300" }}>
          {open ? "∨" : "›"}
        </Text>
      </View>
      {open && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: 14,
            backgroundColor: C.bgLighter,
          }}
        >
          {items.map((item, i) => (
            <View key={i} style={{ flexDirection: "row", marginBottom: 5 }}>
              <Text style={{ color: C.teal, marginRight: 8 }}>•</Text>
              <Text
                style={{
                  flex: 1,
                  fontSize: 12,
                  color: C.textSub,
                  lineHeight: 18,
                }}
              >
                {item}
              </Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── SCREEN: About ────────────────────────────────────────────────────────────
export default function AboutScreen({ navigation }: { navigation?: any }) {
  const [tapCount, setTapCount] = useState(0);
  const handleLogoTap = () => {
    setTapCount((c) => {
      if (c + 1 >= 7) {
        setTapCount(0); /* unlock dev mode */
      }
      return c + 1;
    });
  };

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
          About MyExpense
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
        {/* Logo Hero Block */}
        <TouchableOpacity
          onPress={handleLogoTap}
          activeOpacity={1}
          style={{ alignItems: "center", paddingVertical: 32 }}
        >
          {/* Logo placeholder — swap for FULL_LOGO Image component */}
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              backgroundColor: C.navy,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: C.navy,
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Text style={{ color: C.teal, fontSize: 32, fontWeight: "900" }}>
              M
            </Text>
          </View>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "900",
              color: C.navy,
              marginTop: 14,
            }}
          >
            MyExpense
          </Text>
          <Text style={{ fontSize: 13, color: C.textSub, marginTop: 4 }}>
            Smart Expense & SARS Tax Management
          </Text>
          <View
            style={{
              marginTop: 8,
              backgroundColor: C.bgLight,
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 4,
            }}
          >
            <Text
              style={{ fontSize: 11, color: C.midNavy2, fontWeight: "600" }}
            >
              Version 1.0.0 (Build 100)
            </Text>
          </View>
          {tapCount >= 4 && tapCount < 7 && (
            <Text style={{ fontSize: 10, color: C.textSub, marginTop: 6 }}>
              {7 - tapCount} more taps to unlock developer mode
            </Text>
          )}
        </TouchableOpacity>

        {/* App Info */}
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: C.textSub,
            letterSpacing: 0.8,
            paddingHorizontal: 16,
            paddingBottom: 8,
          }}
        >
          App information
        </Text>
        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: C.border,
            overflow: "hidden",
          }}
        >
          <AboutRow icon="🏷" label="Version" value="1.0.0" />
          <AboutRow icon="🔨" label="Build number" value="100" />
          <AboutRow icon="📱" label="Platform" value="React Native (Expo)" />
          <AboutRow icon="🌍" label="Region" value="South Africa (ZA)" />
          <AboutRow
            icon="💱"
            label="Currency"
            value="South African Rand (ZAR)"
          />
          <AboutRow
            icon="🗓"
            label="Tax framework"
            value="SARS ITR12 / ITR13"
          />
          <AboutRow icon="⚖️" label="Compliance" value="POPIA Act 4 of 2013" />
        </View>

        {/* Company */}
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
          Company
        </Text>
        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: C.border,
            overflow: "hidden",
          }}
        >
          <AboutRow icon="🏢" label="Company" value="MyExpense (PTY) Ltd" />
          <AboutRow
            icon="📍"
            label="Location"
            value="Cape Town, South Africa"
          />
          <AboutRow
            icon="🌐"
            label="Website"
            onPress={() => {}}
            value="myexpense.co.za"
          />
          <AboutRow
            icon="📧"
            label="Contact"
            onPress={() => {}}
            value="info@myexpense.co.za"
          />
        </View>

        {/* Legal */}
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
          Legal
        </Text>
        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: C.border,
            overflow: "hidden",
          }}
        >
          <AboutRow icon="📄" label="Privacy policy" onPress={() => {}} />
          <AboutRow icon="📜" label="Terms of service" onPress={() => {}} />
          <AboutRow icon="⚖️" label="Open source licences" onPress={() => {}} />
          <AboutRow icon="🍪" label="Cookie policy" onPress={() => {}} />
        </View>

        {/* Open Source Licences */}
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
          Open source libraries
        </Text>
        <View
          style={{
            backgroundColor: C.white,
            marginHorizontal: 16,
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: C.border,
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {[
              { name: "React Native", version: "0.74.x" },
              { name: "Expo", version: "51.x" },
              { name: "React Navigation", version: "6.x" },
              { name: "React Native Paper", version: "5.x" },
              { name: "Axios", version: "1.6.x" },
              { name: "date-fns", version: "3.x" },
              { name: "AsyncStorage", version: "1.23.x" },
              { name: "Expo Camera", version: "15.x" },
            ].map((lib, i) => (
              <LicenceChip key={i} {...lib} />
            ))}
          </View>
        </View>

        {/* What's New */}
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: C.textSub,
            letterSpacing: 0.8,
            paddingHorizontal: 16,
            paddingBottom: 8,
          }}
        >
          What's new
        </Text>
        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: C.border,
            overflow: "hidden",
          }}
        >
          <ChangelogItem
            version="1.0.0"
            date="March 2025 — Initial Release"
            items={[
              "OCR receipt scanning with automatic category detection",
              "Full SARS ITR12 category suite with Section 11(a) support",
              "Monthly trend and budget vs actual reports",
              "Deduction forecasting with tax bracket calculations",
              "POPIA-compliant data storage and export",
              "Pro and Pro+ subscription plans",
            ]}
          />
          <ChangelogItem
            version="0.9.0"
            date="February 2025 — Beta"
            items={[
              "Beta release to selected testers",
              "Core expense capture and categorisation",
              "Basic reporting and export",
            ]}
          />
        </View>

        {/* Rate the App */}
        <View
          style={{
            margin: 16,
            backgroundColor: C.navy,
            borderRadius: 14,
            padding: 18,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 28, marginRight: 14 }}>⭐</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.white, fontSize: 14, fontWeight: "700" }}>
              Enjoying MyExpense?
            </Text>
            <Text style={{ color: C.textSub, fontSize: 12, marginTop: 4 }}>
              Leave us a review on the App Store
            </Text>
          </View>
          <TouchableOpacity
            style={{
              backgroundColor: C.teal,
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: C.white, fontSize: 12, fontWeight: "700" }}>
              Rate App
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View
          style={{
            alignItems: "center",
            paddingHorizontal: 24,
            paddingBottom: 10,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: C.textSub,
              textAlign: "center",
              lineHeight: 18,
            }}
          >
            © 2025 MyExpense (PTY) Ltd{"\n"}
            All rights reserved · Cape Town, South Africa
          </Text>
          <Text style={{ fontSize: 11, color: C.border, marginTop: 8 }}>
            Built with ♥ for South African freelancers
          </Text>
        </View>
      </View>
    </PhoneShell>
  );
}
