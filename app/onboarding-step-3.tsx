import { colour, radius, space } from "@/tokens";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Dimensions, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, Polyline, Rect } from "react-native-svg";

const { width: SW } = Dimensions.get("window");
const LOGO_W = SW * 0.58;
const LOGO_H = 42;

// ── Flat SVG Icons ─────────────────────────────────────────────────────────────
function IconBuilding() {
  return (
    <Svg width={26} height={26} viewBox="0 0 26 26">
      <Rect
        x="3"
        y="8"
        width="20"
        height="15"
        rx="2"
        fill="#E07A3A"
        opacity="0.15"
        stroke="#E07A3A"
        strokeWidth="1.8"
      />
      <Rect
        x="8"
        y="3"
        width="10"
        height="6"
        rx="1.5"
        fill="none"
        stroke="#E07A3A"
        strokeWidth="1.8"
      />
      <Rect
        x="7"
        y="13"
        width="4"
        height="4"
        rx="1"
        fill="#E07A3A"
        opacity="0.4"
      />
      <Rect
        x="15"
        y="13"
        width="4"
        height="4"
        rx="1"
        fill="#E07A3A"
        opacity="0.4"
      />
      <Rect
        x="10"
        y="18"
        width="6"
        height="5"
        rx="1"
        fill="#E07A3A"
        opacity="0.3"
      />
    </Svg>
  );
}

function IconLaptop() {
  return (
    <Svg width={26} height={26} viewBox="0 0 26 26">
      <Rect
        x="4"
        y="5"
        width="18"
        height="13"
        rx="2.5"
        fill="#006FFD"
        opacity="0.15"
        stroke="#006FFD"
        strokeWidth="1.8"
      />
      <Rect
        x="7"
        y="8"
        width="12"
        height="7"
        rx="1"
        fill="#006FFD"
        opacity="0.2"
      />
      <Rect
        x="8"
        y="9.5"
        width="7"
        height="1.5"
        rx=".75"
        fill="#006FFD"
        opacity="0.5"
      />
      <Rect
        x="8"
        y="12"
        width="5"
        height="1.5"
        rx=".75"
        fill="#006FFD"
        opacity="0.35"
      />
      <Path
        d="M2 19 Q2 18 4 18 L22 18 Q24 18 24 19 L24 20 Q24 21 22 21 L4 21 Q2 21 2 20 Z"
        fill="#006FFD"
        opacity="0.15"
        stroke="#006FFD"
        strokeWidth="1.5"
      />
    </Svg>
  );
}

function IconClipboard() {
  return (
    <Svg width={26} height={26} viewBox="0 0 26 26">
      <Rect
        x="4"
        y="5"
        width="18"
        height="20"
        rx="2.5"
        fill="#00A884"
        opacity="0.12"
        stroke="#00A884"
        strokeWidth="1.8"
      />
      <Rect
        x="9"
        y="2"
        width="8"
        height="5"
        rx="2"
        fill="none"
        stroke="#00A884"
        strokeWidth="1.8"
      />
      <Rect
        x="7"
        y="11"
        width="12"
        height="1.8"
        rx=".9"
        fill="#00A884"
        opacity="0.45"
      />
      <Rect
        x="7"
        y="14.5"
        width="9"
        height="1.8"
        rx=".9"
        fill="#00A884"
        opacity="0.3"
      />
      <Rect
        x="7"
        y="18"
        width="10"
        height="1.8"
        rx=".9"
        fill="#00A884"
        opacity="0.3"
      />
      <Polyline
        points="14,20 16,22 20,17"
        stroke="#00A884"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

// ── Option Card ────────────────────────────────────────────────────────────────
function OptionCard({
  bgColor,
  icon,
  title,
  selected,
  onPress,
}: {
  bgColor: string;
  icon: React.ReactNode;
  title: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        borderWidth: 1.5,
        borderColor: selected ? colour.primary : colour.borderLight,
        borderRadius: radius.lg,
        backgroundColor: selected ? "#F0F6FF" : colour.white,
        paddingVertical: space.lg,
        paddingHorizontal: space.md,
        marginBottom: space.md,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: radius.md,
          backgroundColor: bgColor,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </View>
      <Text
        style={{ flex: 1, fontSize: 16, fontWeight: "700", color: colour.text }}
      >
        {title}
      </Text>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: radius.pill,
          borderWidth: 2,
          borderColor: selected ? colour.primary : colour.border,
          backgroundColor: selected ? colour.primary : "transparent",
          flexShrink: 0,
        }}
      />
    </TouchableOpacity>
  );
}

const OPTIONS = [
  {
    id: "sole",
    bgColor: "#FFF3E8",
    icon: <IconBuilding />,
    title: "Sole proprietor",
  },
  {
    id: "freelancer",
    bgColor: "#EAF2FF",
    icon: <IconLaptop />,
    title: "Freelancer",
  },
  {
    id: "contractor",
    bgColor: "#F0FBF8",
    icon: <IconClipboard />,
    title: "Independent contractor",
  },
];

export default function OnboardingStep3Screen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colour.white }}>
      <View style={{ flex: 1, paddingHorizontal: space.lg }}>
        {/* Logo left */}
        <View style={{ paddingTop: space.md, paddingBottom: space.xl }}>
          <Image
            source={require("@/assets/images/Full-logo.gif")}
            style={{ width: LOGO_W, height: LOGO_H }}
            resizeMode="contain"
          />
        </View>

        {/* Headline — large, no image above it */}
        <Text
          style={{
            fontSize: 34,
            fontWeight: "800",
            color: colour.text,
            lineHeight: 40,
            marginBottom: space.sm,
          }}
        >
          Tell us about{"\n"}
          <Text style={{ color: colour.primary }}>yourself.</Text>
        </Text>

        <Text
          style={{
            fontSize: 15,
            color: colour.textSub,
            lineHeight: 22,
            marginBottom: space.xl,
          }}
        >
          This helps us apply the right SARS ITR12 rules and deduction
          categories for your situation.
        </Text>

        {/* Option cards — taller with more padding, breathes well now */}
        {OPTIONS.map((opt) => (
          <OptionCard
            key={opt.id}
            bgColor={opt.bgColor}
            icon={opt.icon}
            title={opt.title}
            selected={selected === opt.id}
            onPress={() => setSelected(opt.id)}
          />
        ))}

        <View style={{ flex: 1 }} />

        {/* Dots */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 6,
            marginBottom: space.md,
          }}
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: radius.pill,
              backgroundColor: colour.border,
            }}
          />
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: radius.pill,
              backgroundColor: colour.border,
            }}
          />
          <View
            style={{
              width: 22,
              height: 6,
              borderRadius: radius.pill,
              backgroundColor: colour.primary,
            }}
          />
        </View>

        {/* Back + Get Started */}
        <View
          style={{
            flexDirection: "row",
            gap: space.md,
            marginBottom: space.md,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              backgroundColor: colour.surface1,
              borderRadius: radius.pill,
              height: 56,
              paddingHorizontal: space.xl,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{ fontSize: 16, fontWeight: "700", color: colour.textSub }}
            >
              ← Back
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (selected) router.replace("/sign-up");
            }}
            activeOpacity={selected ? 0.85 : 0.5}
            style={{
              flex: 1,
              backgroundColor: selected ? colour.primary : colour.border,
              borderRadius: radius.pill,
              height: 56,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 17,
                fontWeight: "700",
                color: selected ? colour.white : colour.textSub,
              }}
            >
              {selected ? "Get started →" : "Select one above"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sign in */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginBottom: space.lg,
          }}
        >
          <Text style={{ fontSize: 14, color: colour.textSub }}>
            Already have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.replace("/sign-in")}>
            <Text
              style={{ fontSize: 14, fontWeight: "700", color: colour.primary }}
            >
              Sign in
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
