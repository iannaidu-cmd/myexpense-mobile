import { BiometricToggle } from "@/components/BiometricToggle";
import { MXHeader } from "@/components/MXHeader";
import { profileService } from "@/services/profileService";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SECTIONS = [
  {
    title: "Account",
    items: [
      {
        icon: "👤",
        label: "My profile",
        sub: "Name, email, business details",
        route: "/profile",
      },
      {
        icon: "💳",
        label: "Subscription",
        sub: "Free plan · Upgrade to Pro",
        route: "/paywall-upgrade",
      },
      {
        icon: "🏦",
        label: "Bank accounts",
        sub: "Manage your banking details",
        route: "/bank-accounts",
      },
    ],
  },
  {
    title: "Preferences",
    items: [
      {
        icon: "🔔",
        label: "Notifications",
        sub: "Push, email & filing reminders",
        route: "/notifications-settings",
      },
      {
        icon: "🎨",
        label: "Appearance",
        sub: "Theme & display settings",
        route: "/appearance-settings",
      },
    ],
  },
  {
    title: "Security & privacy",
    items: [
      {
        icon: "🔒",
        label: "Security",
        sub: "Password, biometrics, sessions",
        route: "/security-settings",
      },
      {
        icon: "🛡️",
        label: "Data & privacy",
        sub: "POPIA · Data export & deletion",
        route: "/privacy",
      },
    ],
  },
  {
    title: "Support",
    items: [
      {
        icon: "❓",
        label: "Help & support",
        sub: "FAQs & contact us",
        route: "/help-support",
      },
      {
        icon: "",
        label: "Terms of service",
        sub: "App terms & conditions",
        route: "/terms",
      },
    ],
  },
];

export default function SettingsTabScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const [fullName, setFullName] = useState("");
  const [subscription, setSubscription] = useState<"free" | "pro" | "business">(
    "free",
  );

  useEffect(() => {
    if (!user) return;
    profileService.getProfile(user.id).then((p) => {
      if (p) {
        setFullName(p.full_name ?? "");
        setSubscription(p.subscription ?? "free");
      }
    });
  }, [user]);

  const initials =
    fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ||
    (user?.email?.[0]?.toUpperCase() ?? "?");

  const planLabel =
    subscription === "pro"
      ? "Pro plan"
      : subscription === "business"
        ? "Business plan"
        : "Free plan";

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/onboarding-step-1");
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.primary }}
    >
      <StatusBar barStyle="light-content" backgroundColor={colour.primary} />

      <MXHeader title="Settings" />

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
        {/* Profile summary card */}
        <TouchableOpacity
          onPress={() => router.push("/settings-screens")}
          style={{
            margin: space.lg,
            backgroundColor: colour.bgCard,
            borderRadius: radius.lg,
            padding: space.lg,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: colour.border,
          }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: colour.primary,
              alignItems: "center",
              justifyContent: "center",
              marginRight: space.lg,
            }}
          >
            <Text
              style={{
                ...typography.h4,
                color: colour.onPrimary,
                fontWeight: "800",
              }}
            >
              {initials}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                ...typography.bodyL,
                fontWeight: "700",
                color: colour.textPrimary,
              }}
            >
              {fullName || "My Profile"}
            </Text>
            <Text style={{ ...typography.bodyS, color: colour.textSecondary }}>
              {user?.email}
            </Text>
            <View
              style={{
                backgroundColor: colour.primary100,
                borderRadius: radius.pill,
                paddingHorizontal: space.sm,
                paddingVertical: 2,
                alignSelf: "flex-start",
                marginTop: space.xs,
              }}
            >
              <Text
                style={{
                  ...typography.micro,
                  color: colour.primary,
                  fontWeight: "600",
                }}
              >
                {planLabel}
              </Text>
            </View>
          </View>
          <Text style={{ color: colour.textSecondary, fontSize: 18 }}>›</Text>
        </TouchableOpacity>

        {/* Biometric toggle */}
        <View style={{ paddingHorizontal: space.lg, marginBottom: space.sm }}>
          <BiometricToggle />
        </View>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <View
            key={section.title}
            style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}
          >
            <Text
              style={{
                ...typography.labelM,
                color: colour.textSecondary,
                marginBottom: space.sm,
              }}
            >
              {section.title}
            </Text>
            <View
              style={{
                backgroundColor: colour.bgCard,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colour.border,
              }}
            >
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  disabled={!item.route}
                  activeOpacity={item.route ? 0.7 : 1}
                  onPress={() =>
                    item.route ? router.push(item.route as any) : undefined
                  }
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: space.lg,
                    borderBottomWidth: i < section.items.length - 1 ? 1 : 0,
                    borderBottomColor: colour.border,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: radius.sm,
                      backgroundColor: colour.bgPage,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: space.md,
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        ...typography.labelM,
                        color: colour.textPrimary,
                      }}
                    >
                      {item.label}
                    </Text>
                    <Text
                      style={{
                        ...typography.caption,
                        color: colour.textSecondary,
                      }}
                    >
                      {item.sub}
                    </Text>
                  </View>
                  {item.route && (
                    <Text style={{ color: colour.textSecondary, fontSize: 18 }}>
                      ›
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* App info */}
        <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
          <View
            style={{
              backgroundColor: colour.bgCard,
              borderRadius: radius.md,
              padding: space.lg,
              borderWidth: 1,
              borderColor: colour.border,
            }}
          >
            {[
              { label: "Version", value: "1.0.0" },
              {
                label: "Compliance",
                value: "POPIA ✓",
                valueColor: colour.success,
              },
              { label: "Tax standard", value: "SARS ITR12 2024/25" },
            ].map((row, i, arr) => (
              <View
                key={row.label}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: i < arr.length - 1 ? space.sm : 0,
                }}
              >
                <Text
                  style={{ ...typography.bodyS, color: colour.textSecondary }}
                >
                  {row.label}
                </Text>
                <Text
                  style={{
                    ...typography.bodyS,
                    color: row.valueColor ?? colour.textPrimary,
                  }}
                >
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sign out */}
        <View style={{ paddingHorizontal: space.lg }}>
          <TouchableOpacity
            onPress={handleSignOut}
            style={{
              borderRadius: radius.pill,
              borderWidth: 1.5,
              borderColor: colour.danger,
              height: 52,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ ...typography.btnL, color: colour.danger }}>
              Sign out
            </Text>
          </TouchableOpacity>
          <Text
            style={{
              ...typography.caption,
              color: colour.textSecondary,
              textAlign: "center",
              marginTop: space.lg,
            }}
          >
            MyExpense (PTY) Ltd · Cape Town, South Africa
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
