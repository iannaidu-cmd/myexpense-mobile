import { colour, radius, space } from "@/tokens";
import { useRouter } from "expo-router";
import React from "react";
import { Dimensions, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";

const { width: SW, height: SH } = Dimensions.get("window");
const HERO_W = SW - 32;
const HERO_H = SH * 0.33;
const LOGO_W = SW * 0.58;
const LOGO_H = 42;

function HeroIllustration() {
  return (
    <Svg
      width={HERO_W}
      height={HERO_H}
      viewBox="0 0 340 210"
      preserveAspectRatio="xMidYMid meet"
    >
      <Rect
        x="95"
        y="12"
        width="150"
        height="192"
        rx="14"
        fill="white"
        stroke="#A8DFD0"
        strokeWidth="2"
      />
      <Rect
        x="95"
        y="12"
        width="150"
        height="36"
        rx="14"
        fill="#00C2A8"
        opacity="0.2"
      />
      <Rect
        x="95"
        y="34"
        width="150"
        height="14"
        fill="#00C2A8"
        opacity="0.2"
      />
      <Circle cx="114" cy="30" r="8" fill="#00C2A8" opacity="0.45" />
      <Rect
        x="127"
        y="25"
        width="48"
        height="4.5"
        rx="2.25"
        fill="#00A884"
        opacity="0.5"
      />
      <Rect
        x="127"
        y="33"
        width="32"
        height="3.5"
        rx="1.75"
        fill="#00A884"
        opacity="0.3"
      />
      <Rect x="104" y="56" width="58" height="28" rx="7" fill="#D6F5EE" />
      <Rect x="177" y="56" width="58" height="28" rx="7" fill="#D6F5EE" />
      <Rect
        x="110"
        y="62"
        width="26"
        height="4"
        rx="2"
        fill="#00A884"
        opacity="0.45"
      />
      <Rect
        x="110"
        y="69"
        width="40"
        height="6"
        rx="3"
        fill="#00A884"
        opacity="0.75"
      />
      <Rect
        x="183"
        y="62"
        width="26"
        height="4"
        rx="2"
        fill="#00A884"
        opacity="0.45"
      />
      <Rect
        x="183"
        y="69"
        width="40"
        height="6"
        rx="3"
        fill="#00A884"
        opacity="0.75"
      />
      <Rect x="104" y="94" width="126" height="18" rx="5" fill="#F0FBF8" />
      <Rect
        x="104"
        y="94"
        width="18"
        height="18"
        rx="5"
        fill="#00C2A8"
        opacity="0.28"
      />
      <Rect
        x="127"
        y="98"
        width="46"
        height="3.5"
        rx="1.75"
        fill="#333"
        opacity="0.2"
      />
      <Rect
        x="127"
        y="104"
        width="32"
        height="3"
        rx="1.5"
        fill="#999"
        opacity="0.25"
      />
      <Rect
        x="196"
        y="99"
        width="34"
        height="6"
        rx="3"
        fill="#00A884"
        opacity="0.45"
      />
      <Rect x="104" y="117" width="126" height="18" rx="5" fill="#F0FBF8" />
      <Rect
        x="104"
        y="117"
        width="18"
        height="18"
        rx="5"
        fill="#00C2A8"
        opacity="0.28"
      />
      <Rect
        x="127"
        y="121"
        width="58"
        height="3.5"
        rx="1.75"
        fill="#333"
        opacity="0.2"
      />
      <Rect
        x="127"
        y="127"
        width="38"
        height="3"
        rx="1.5"
        fill="#999"
        opacity="0.25"
      />
      <Rect
        x="196"
        y="122"
        width="34"
        height="6"
        rx="3"
        fill="#00A884"
        opacity="0.45"
      />
      <Rect x="104" y="140" width="126" height="18" rx="5" fill="#F0FBF8" />
      <Rect
        x="104"
        y="140"
        width="18"
        height="18"
        rx="5"
        fill="#00C2A8"
        opacity="0.28"
      />
      <Rect
        x="127"
        y="144"
        width="42"
        height="3.5"
        rx="1.75"
        fill="#333"
        opacity="0.2"
      />
      <Rect
        x="127"
        y="150"
        width="26"
        height="3"
        rx="1.5"
        fill="#999"
        opacity="0.25"
      />
      <Rect
        x="196"
        y="145"
        width="34"
        height="6"
        rx="3"
        fill="#00A884"
        opacity="0.45"
      />
      <Rect x="104" y="166" width="126" height="7" rx="3.5" fill="#D6F5EE" />
      <Rect
        x="104"
        y="166"
        width="82"
        height="7"
        rx="3.5"
        fill="#00A884"
        opacity="0.65"
      />
      <Rect
        x="18"
        y="100"
        width="58"
        height="28"
        rx="8"
        fill="white"
        stroke="#A8DFD0"
        strokeWidth="1.5"
      />
      <Rect
        x="26"
        y="108"
        width="20"
        height="3.5"
        rx="1.75"
        fill="#00A884"
        opacity="0.5"
      />
      <Rect
        x="26"
        y="115"
        width="14"
        height="3"
        rx="1.5"
        fill="#00A884"
        opacity="0.3"
      />
      <Line
        x1="76"
        y1="114"
        x2="104"
        y2="114"
        stroke="#A8DFD0"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <Rect
        x="264"
        y="82"
        width="58"
        height="28"
        rx="8"
        fill="white"
        stroke="#A8DFD0"
        strokeWidth="1.5"
      />
      <Rect
        x="272"
        y="90"
        width="22"
        height="3.5"
        rx="1.75"
        fill="#006FFD"
        opacity="0.4"
      />
      <Rect
        x="272"
        y="97"
        width="30"
        height="3"
        rx="1.5"
        fill="#006FFD"
        opacity="0.25"
      />
      <Line
        x1="245"
        y1="96"
        x2="264"
        y2="96"
        stroke="#A8DFD0"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
    </Svg>
  );
}

function IconOCR() {
  return (
    <Svg width={26} height={26} viewBox="0 0 26 26">
      <Rect
        x="2"
        y="7"
        width="22"
        height="15"
        rx="4"
        fill="#006FFD"
        opacity="0.15"
      />
      <Rect
        x="2"
        y="7"
        width="22"
        height="15"
        rx="4"
        stroke="#006FFD"
        strokeWidth="1.8"
        fill="none"
      />
      <Circle
        cx="13"
        cy="14.5"
        r="4.5"
        fill="none"
        stroke="#006FFD"
        strokeWidth="1.8"
      />
      <Circle cx="13" cy="14.5" r="1.8" fill="#006FFD" opacity="0.7" />
      <Rect
        x="17"
        y="4"
        width="5"
        height="4"
        rx="2"
        fill="#006FFD"
        opacity="0.45"
      />
      <Line
        x1="5"
        y1="11"
        x2="8"
        y2="11"
        stroke="#006FFD"
        strokeWidth="1.2"
        opacity="0.5"
      />
    </Svg>
  );
}

function IconMileage() {
  return (
    <Svg width={26} height={26} viewBox="0 0 26 26">
      <Path
        d="M4 16 Q5 11 8 10 L10 7 Q11 5 13 5 Q15 5 16 7 L18 10 Q21 11 22 16 L22 19 Q22 20 21 20 L5 20 Q4 20 4 19 Z"
        fill="#E07A3A"
        opacity="0.15"
        stroke="#E07A3A"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <Rect
        x="9"
        y="7"
        width="3.5"
        height="3"
        rx="1"
        fill="#E07A3A"
        opacity="0.4"
      />
      <Rect
        x="13.5"
        y="7"
        width="3.5"
        height="3"
        rx="1"
        fill="#E07A3A"
        opacity="0.4"
      />
      <Circle
        cx="8"
        cy="20"
        r="3"
        fill="white"
        stroke="#E07A3A"
        strokeWidth="1.8"
      />
      <Circle
        cx="18"
        cy="20"
        r="3"
        fill="white"
        stroke="#E07A3A"
        strokeWidth="1.8"
      />
      <Line
        x1="1"
        y1="14"
        x2="4"
        y2="14"
        stroke="#E07A3A"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.5"
      />
      <Line
        x1="1"
        y1="17"
        x2="3"
        y2="17"
        stroke="#E07A3A"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.3"
      />
    </Svg>
  );
}

function FeatureRow({
  bgColor,
  icon,
  title,
  subtitle,
}: {
  bgColor: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        marginBottom: space.md,
      }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: radius.md,
          backgroundColor: bgColor,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: colour.text,
            marginBottom: 3,
          }}
        >
          {title}
        </Text>
        <Text style={{ fontSize: 13, color: colour.textSub, lineHeight: 18 }}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

export default function OnboardingStep2Screen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colour.white }}>
      <View style={{ flex: 1, paddingHorizontal: space.lg }}>
        {/* Top bar: logo left, skip right */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: space.md,
            paddingBottom: space.sm,
          }}
        >
          <Image
            source={require("@/assets/images/Full-logo.gif")}
            style={{ width: LOGO_W, height: LOGO_H }}
            resizeMode="contain"
          />
          {/* Skip → /sign-up */}
          <TouchableOpacity
            onPress={() => router.replace("/sign-up")}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <Text
              style={{ fontSize: 16, fontWeight: "600", color: colour.textSub }}
            >
              Skip
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hero card */}
        <View
          style={{
            borderRadius: radius.xl,
            backgroundColor: "#D6F5EE",
            alignItems: "center",
            justifyContent: "center",
            height: HERO_H,
            overflow: "hidden",
            marginBottom: space.md,
          }}
        >
          <View
            style={{
              position: "absolute",
              top: 14,
              left: 14,
              backgroundColor: colour.primary,
              borderRadius: radius.pill,
              paddingHorizontal: 12,
              paddingVertical: 5,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: colour.white,
                letterSpacing: 0.5,
              }}
            >
              Everything you need
            </Text>
          </View>
          <HeroIllustration />
        </View>

        {/* Headline */}
        <Text
          style={{
            fontSize: 34,
            fontWeight: "800",
            color: colour.text,
            lineHeight: 40,
            marginBottom: space.sm,
          }}
        >
          Built for South African{"\n"}
          <Text style={{ color: colour.primary }}>freelancers.</Text>
        </Text>

        <Text
          style={{
            fontSize: 15,
            color: colour.textSub,
            lineHeight: 22,
            marginBottom: space.lg,
          }}
        >
          Every feature designed specifically for the SA tax ecosystem — not a
          generic expense app.
        </Text>

        <FeatureRow
          bgColor="#D6E8FF"
          icon={<IconOCR />}
          title="OCR receipt scanning"
          subtitle="AI extracts vendor, amount, date and VAT in seconds"
        />
        <FeatureRow
          bgColor="#FFE8D6"
          icon={<IconMileage />}
          title="Mileage tracker"
          subtitle="GPS logbook at SARS deemed rate R4.84/km for 2024/25"
        />

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
              width: 22,
              height: 6,
              borderRadius: radius.pill,
              backgroundColor: colour.primary,
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
        </View>

        {/* Back + Next */}
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
            onPress={() => router.push("/onboarding-step-3")}
            style={{
              flex: 1,
              backgroundColor: colour.primary,
              borderRadius: radius.pill,
              height: 56,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{ fontSize: 17, fontWeight: "700", color: colour.white }}
            >
              Next →
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
