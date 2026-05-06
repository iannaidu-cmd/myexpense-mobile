import { BiometricToggle } from "@/components/BiometricToggle";
import { IconSymbol } from "@/components/ui/icon-symbol";
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

const BASE_SECTIONS: {
  title: string;
  items: { icon: string; label: string; sub: string; route: string }[];
}[] = [
  {
    title: "Account",
    items: [
      { icon: "person.fill",    label: "My profile",      sub: "Name, email, business details",  route: "/profile"                },
      { icon: "creditcard.fill",label: "Subscription",    sub: "Free plan · Upgrade to Pro",     route: "/paywall-upgrade"        },
      { icon: "folder.fill",    label: "Bank accounts",   sub: "Manage your banking details",    route: "/bank-accounts"          },
    ],
  },
  {
    title: "Preferences",
    items: [
      { icon: "bell.fill",      label: "Notifications",   sub: "Push, email & filing reminders", route: "/notifications-settings" },
    ],
  },
  {
    title: "Security & privacy",
    items: [
      { icon: "lock.fill",      label: "Security",        sub: "Password, biometrics, sessions", route: "/security-settings"      },
      { icon: "lock.fill",      label: "Data & privacy",  sub: "POPIA · Data export & deletion", route: "/privacy"                },
    ],
  },
  {
    title: "Support",
    items: [
      { icon: "info.circle",    label: "Help & support",  sub: "FAQs & contact us",              route: "/help-support"           },
      { icon: "doc.text.fill",  label: "Terms of service",sub: "App terms & conditions",         route: "/terms"                  },
    ],
  },
];

export default function SettingsTabScreen() {
  const router = useRouter();
  const { user, signOut, isPremium, isDevUser } = useAuthStore();
  const [fullName, setFullName] = useState("");
  const [subscription, setSubscription] = useState<"free" | "pro" | "business">("free");

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
    fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ||
    (user?.email?.[0]?.toUpperCase() ?? "?");

  const planLabel =
    isDevUser ? "Developer account" :
    subscription === "pro" ? "Pro plan · Active" :
    subscription === "business" ? "Business plan · Active" : "Free plan";

  const SECTIONS = BASE_SECTIONS.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      if (item.route === "/paywall-upgrade" && isPremium) {
        return {
          ...item,
          sub: isDevUser ? "Developer access · All features unlocked" : "Pro plan · Active",
          route: "",
        };
      }
      return item;
    }),
  }));

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
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: space["5xl"] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Page title */}
        <Text style={{ fontSize: 38, fontWeight: "700", letterSpacing: -1.2, marginBottom: 18, color: colour.text }}>
          My <Text style={{ color: colour.primary }}>settings</Text>
        </Text>

        {/* Noir profile card */}
        <View style={{
          backgroundColor: colour.noir, borderRadius: radius.xl,
          padding: 14, paddingHorizontal: 16,
          flexDirection: "row", alignItems: "center", gap: 12,
          marginBottom: 18, overflow: "hidden",
        }}>
          <View style={{
            position: "absolute", width: 110, height: 110, borderRadius: 55,
            backgroundColor: colour.primary, opacity: 0.5, top: -30, right: -30,
          }} />
          <View style={{
            width: 46, height: 46, borderRadius: 23,
            backgroundColor: colour.primary,
            alignItems: "center", justifyContent: "center",
          }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colour.onNoir }}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colour.onNoir, letterSpacing: -0.3 }}>
              {fullName || "My Profile"}
            </Text>
            <Text style={{ fontSize: 11.5, color: colour.onNoir2, marginTop: 3, fontWeight: "500" }}>
              {user?.email} · {planLabel}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/profile" as any)}
            style={{
              backgroundColor: "rgba(255,255,255,0.14)",
              paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill,
            }}
          >
            <Text style={{ fontSize: 11.5, fontWeight: "600", color: colour.onNoir }}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Biometric toggle */}
        <View style={{ marginBottom: space.sm }}>
          <BiometricToggle />
        </View>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <View key={section.title} style={{ marginBottom: space.lg }}>
            <Text style={{
              fontSize: 11, textTransform: "uppercase", color: colour.textSub,
              letterSpacing: 0.8, marginBottom: 10, marginLeft: 4, fontWeight: "600",
            }}>
              {section.title}
            </Text>
            <View style={{
              backgroundColor: colour.white, borderRadius: radius.md,
              borderWidth: 1, borderColor: colour.borderLight, overflow: "hidden",
            }}>
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  disabled={!item.route}
                  activeOpacity={item.route ? 0.7 : 1}
                  onPress={() => item.route ? router.push(item.route as any) : undefined}
                  style={{
                    flexDirection: "row", alignItems: "center",
                    padding: 12, paddingHorizontal: 14,
                    borderBottomWidth: i < section.items.length - 1 ? 1 : 0,
                    borderBottomColor: colour.borderLight,
                  }}
                >
                  <View style={{
                    width: 30, height: 30, borderRadius: radius.pill,
                    backgroundColor: colour.primary50,
                    alignItems: "center", justifyContent: "center", marginRight: 12,
                  }}>
                    <IconSymbol name={item.icon as any} size={14} color={colour.accentDeep} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colour.text }}>
                      {item.label}
                    </Text>
                    <Text style={{ fontSize: 11, color: colour.textSub, marginTop: 2, fontWeight: "500" }}>
                      {item.sub}
                    </Text>
                  </View>
                  {item.route && (
                    <Text style={{ color: colour.textSub, fontSize: 16 }}>›</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* App info */}
        <View style={{ marginBottom: space.lg }}>
          <View style={{
            backgroundColor: colour.white, borderRadius: radius.md,
            padding: space.lg, borderWidth: 1, borderColor: colour.borderLight,
          }}>
            {[
              { label: "Version",       value: "1.0.0" },
              { label: "Compliance",    value: "POPIA ✓", valueColor: colour.success },
              { label: "Tax standard",  value: "SARS ITR12 2024/25" },
            ].map((row, i, arr) => (
              <View key={row.label} style={{
                flexDirection: "row", justifyContent: "space-between",
                marginBottom: i < arr.length - 1 ? space.sm : 0,
              }}>
                <Text style={{ ...typography.bodyS, color: colour.textSub }}>{row.label}</Text>
                <Text style={{ ...typography.bodyS, color: (row as any).valueColor ?? colour.text }}>
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          onPress={handleSignOut}
          style={{
            borderRadius: radius.pill, borderWidth: 1.5, borderColor: colour.danger,
            height: 52, alignItems: "center", justifyContent: "center",
          }}
        >
          <Text style={{ ...typography.btnL, color: colour.danger }}>Sign out</Text>
        </TouchableOpacity>
        <Text style={{
          ...typography.caption, color: colour.textSub,
          textAlign: "center", marginTop: space.lg,
        }}>
          MyExpense (PTY) Ltd · Cape Town, South Africa
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
