// ─── First task ───────────────────────────────────────────────────────────────
// Once-off, over Home, for a new user who hasn't logged anything yet (see
// lib/firstTask.ts). One clear first task, scanning a receipt, with the other
// ways in underneath. Scanning leads because it's what people do first: since
// 20 Oct 2026 it was the first item for 20 devices against 1 for a trip. Every
// way out goes back to Home, which is the normal dashboard.
// ─────────────────────────────────────────────────────────────────────────────

import MXLogo from "@/components/MXLogo";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trackFunnel } from "@/services/funnelService";
import { profileService } from "@/services/profileService";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius } from "@/tokens";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, StatusBar, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";

type FirstTaskKind = "receipt_scan" | "mileage_trip" | "expense_manual" | "income" | "skip";

const OTHER_WAYS: { kind: FirstTaskKind; icon: string; label: string; sub: string; route: string }[] = [
  { kind: "mileage_trip", icon: "car.fill", label: "Log a work trip", sub: "Builds the logbook SARS asks for", route: "/mileage-tracker" },
  { kind: "expense_manual", icon: "pencil", label: "Add an expense by hand", sub: "No slip with you? Add the photo later", route: "/(tabs)/add-expense" },
  { kind: "income", icon: "arrow.up.right", label: "Add income", sub: "So we can work out your tax", route: "/add-income" },
];

// A circle that fades from `colour` at `strength` in the centre to nothing at
// 65% of its radius, like CSS radial-gradient(circle, c, transparent 65%).
function Glow({ id, size, colour: c, strength, style }: {
  id: string; size: number; colour: string; strength: number; style: ViewStyle;
}) {
  return (
    <Svg width={size} height={size} style={[{ position: "absolute" }, style]} pointerEvents="none">
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={c} stopOpacity={strength} />
          <Stop offset="0.65" stopColor={c} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
    </Svg>
  );
}

export default function FirstTaskScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    trackFunnel("first_task_shown");
    if (!user) return;
    profileService
      .getProfile(user.id)
      .then((p) => p?.full_name && setFirstName(p.full_name.split(" ")[0]))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Close this screen (Home is underneath), then open the pick, so Back from
  // the pick lands on Home rather than here.
  const go = (kind: FirstTaskKind, route?: string) => {
    trackFunnel("first_task_tap", { kind });
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
    if (route) router.navigate(route as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />

      {/* Header: app logo + skip */}
      <View style={{
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 18, paddingTop: 12, paddingBottom: 10,
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{
            width: 40, height: 40, borderRadius: 12, backgroundColor: colour.white,
            borderWidth: 1, borderColor: colour.borderLight,
            alignItems: "center", justifyContent: "center", overflow: "hidden",
          }}>
            <MXLogo size={26} variant="dark" />
          </View>
          <Text style={{ fontSize: 20, fontWeight: "800", letterSpacing: -0.6, color: colour.heroDark }}>
            {firstName ? `Welcome, ${firstName}` : "Welcome"}
          </Text>
        </View>
        <TouchableOpacity onPress={() => go("skip")} hitSlop={10}>
          <Text style={{ fontSize: 13.5, fontWeight: "600", color: colour.primary }}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 6, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Start here */}
        <View style={{
          backgroundColor: colour.heroDark, borderRadius: 24,
          paddingTop: 20, paddingHorizontal: 18, paddingBottom: 20, marginBottom: 18, overflow: "hidden",
        }}>
          {/* Soft glows, as in the design: periwinkle top-right, teal bottom-left */}
          <Glow id="glowPrimary" size={260} colour={colour.primary} strength={0.6} style={{ top: -120, right: -110 }} />
          <Glow id="glowTeal" size={200} colour={colour.brandTeal} strength={0.25} style={{ bottom: -110, left: -90 }} />
          <Text style={{ fontSize: 10, fontWeight: "700", letterSpacing: 1.6, textTransform: "uppercase", color: colour.onNoir, opacity: 0.62 }}>
            Start here
          </Text>
          <Text style={{ fontSize: 30, lineHeight: 32, letterSpacing: -1.2, fontWeight: "800", color: colour.onNoir, marginTop: 8 }}>
            Start with your{"\n"}first receipt.
          </Text>
          <Text style={{ fontSize: 13, lineHeight: 19, fontWeight: "500", color: colour.onNoir, opacity: 0.78, marginTop: 8 }}>
            Take a photo of any work slip. We fill in the details and file it under the right SARS category.
          </Text>
          <TouchableOpacity
            onPress={() => go("receipt_scan", "/scan-receipt-camera")}
            activeOpacity={0.85}
            style={{
              backgroundColor: colour.white, borderRadius: radius.pill, height: 52, marginTop: 16,
              flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
            }}
          >
            <IconSymbol name="camera.fill" size={18} color={colour.heroDark} />
            <Text style={{ fontSize: 15.5, fontWeight: "800", color: colour.heroDark }}>Scan a receipt</Text>
          </TouchableOpacity>
        </View>

        {/* Other ways */}
        <Text style={{ fontSize: 15, fontWeight: "700", letterSpacing: -0.3, color: colour.heroDark, marginBottom: 10, marginHorizontal: 2 }}>
          Or start another way
        </Text>
        <View style={{
          backgroundColor: colour.white, borderRadius: 22,
          borderWidth: 1, borderColor: colour.borderLight, overflow: "hidden",
        }}>
          {OTHER_WAYS.map((t, i) => (
            <TouchableOpacity
              key={t.kind}
              onPress={() => go(t.kind, t.route)}
              style={{
                flexDirection: "row", alignItems: "center", gap: 12,
                paddingVertical: 12, paddingHorizontal: 14,
                borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colour.borderLight,
              }}
            >
              <View style={{
                width: 34, height: 34, borderRadius: 12, borderWidth: 1, borderColor: colour.borderLight,
                backgroundColor: colour.white, alignItems: "center", justifyContent: "center",
              }}>
                <IconSymbol name={t.icon as any} size={17} color={colour.heroDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", letterSpacing: -0.2, color: colour.heroDark }}>{t.label}</Text>
                <Text style={{ fontSize: 11.5, fontWeight: "500", color: colour.textSub, marginTop: 2 }}>{t.sub}</Text>
              </View>
              <IconSymbol name="chevron.right" size={14} color={colour.textHint} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={() => go("skip")} style={{ alignItems: "center", paddingVertical: 18 }}>
          <Text style={{ fontSize: 13.5, fontWeight: "600", color: colour.textSub }}>Go to my dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
