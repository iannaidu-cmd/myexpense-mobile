import { NavigationProp } from "@react-navigation/native";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Text, TouchableOpacity, View } from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  navigation?: NavigationProp<any>;
  /** Drives copy & illustration variant */
  context?: "reports" | "no_data" | "date_range";
  dateRangeLabel?: string;
  onAddExpense?: () => void;
  onGoToExpenses?: () => void;
}

// ─── Brand Colours ────────────────────────────────────────────────────────────

const NAV_ICONS = { Home: "⊞", Scan: "⊡", Reports: "◈", Settings: "⚙" };

function PhoneShell({
  children,
  activeTab = "Reports",
  navigation,
}: {
  children: React.ReactNode;
  activeTab?: string;
  navigation?: NavigationProp<any>;
}) {
  const tabs = [
    { key: "Home", label: "Home", icon: NAV_ICONS.Home },
    { key: "Scan", label: "Scan", icon: NAV_ICONS.Scan },
    { key: "Reports", label: "Reports", icon: NAV_ICONS.Reports },
    { key: "Settings", label: "Settings", icon: NAV_ICONS.Settings },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: C.bgLighter }}>
      <View style={{ flex: 1 }}>{children}</View>
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

// ─── Animated Chart Illustration ─────────────────────────────────────────────
function ChartIllustration() {
  const bars = [0.3, 0.5, 0.2, 0.65, 0.4, 0.55];
  const anims = useRef(bars.map(() => new Animated.Value(0))).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Stagger bar rise
    const stagger = bars.map((_, i) =>
      Animated.timing(anims[i], {
        toValue: 1,
        duration: 600,
        delay: i * 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    );
    Animated.stagger(100, stagger).start();

    // Float loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: -6,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const BAR_H = 80;

  return (
    <Animated.View
      style={{ transform: [{ translateY: float }], alignItems: "center" }}
    >
      <View
        style={{
          backgroundColor: C.white,
          borderRadius: 16,
          padding: 18,
          borderWidth: 1.5,
          borderColor: C.border,
          shadowColor: C.navy,
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 5,
          width: 160,
        }}
      >
        {/* Fake y-axis lines */}
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              left: 18,
              right: 18,
              top: 18 + i * (BAR_H / 3),
              height: 1,
              backgroundColor: C.bgLight,
            }}
          />
        ))}

        {/* Bars */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            height: BAR_H,
            gap: 6,
          }}
        >
          {bars.map((h, i) => (
            <Animated.View
              key={i}
              style={{
                flex: 1,
                height: anims[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, BAR_H * h],
                }),
                backgroundColor: i === 3 ? C.teal : `${C.navy}55`,
                borderRadius: 4,
              }}
            />
          ))}
        </View>

        {/* X-axis label row */}
        <View style={{ flexDirection: "row", marginTop: 8, gap: 6 }}>
          {["O", "N", "D", "J", "F", "M"].map((m, i) => (
            <Text
              key={i}
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 9,
                color: i === 3 ? C.teal : C.textSub,
                fontWeight: i === 3 ? "700" : "400",
              }}
            >
              {m}
            </Text>
          ))}
        </View>

        {/* Question mark overlay */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 16,
            backgroundColor: "rgba(245,246,255,0.75)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 36, opacity: 0.5 }}>📊</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── SCREEN: Empty State — No Reports ────────────────────────────────────────
export default function EmptyStateNoReportsScreen({
  navigation,
  context = "reports",
  dateRangeLabel,
  onAddExpense,
  onGoToExpenses,
}: Props) {
  const copy = {
    reports: {
      title: "No reports yet",
      body: "Reports are generated automatically once you start logging expenses. Add at least one expense to unlock your financial insights.",
      cta1: "Add Your First Expense",
      cta2: "Go to Expenses",
    },
    no_data: {
      title: "Not enough data",
      body: "Keep capturing expenses throughout the month. Reports become meaningful with at least a few weeks of data.",
      cta1: "Add Expense",
      cta2: null,
    },
    date_range: {
      title: "No data for this period",
      body: dateRangeLabel
        ? `No expenses were recorded during "${dateRangeLabel}". Try selecting a different date range.`
        : "No expenses found for the selected period. Try a different date range.",
      cta1: null,
      cta2: "Change Date Range",
    },
  }[context];

  const handleCta1 = onAddExpense ?? (() => navigation?.navigate("AddExpense"));
  const handleCta2 = onGoToExpenses ?? (() => navigation?.navigate("Home"));

  // Progress steps for first-time state
  const steps: Array<{ label: string; done: boolean }> = [
    { label: "Account created", done: true },
    { label: "Add your first expense", done: false },
    { label: "View reports & insights", done: false },
  ];

  return (
    <PhoneShell activeTab="Reports" navigation={navigation}>
      {/* Header */}
      <View
        style={{
          backgroundColor: C.navy,
          paddingTop: 52,
          paddingBottom: 32,
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
          REPORTS & ANALYTICS
        </Text>
        <Text
          style={{
            color: C.white,
            fontSize: 24,
            fontWeight: "800",
            marginTop: 4,
          }}
        >
          Financial Overview
        </Text>
      </View>

      {/* Body */}
      <View
        style={{
          flex: 1,
          backgroundColor: C.bgLighter,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          marginTop: -16,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 28,
          paddingBottom: 32,
        }}
      >
        {/* Illustration */}
        <View style={{ marginBottom: 32 }}>
          <ChartIllustration />
        </View>

        {/* Copy */}
        <Text
          style={{
            fontSize: 22,
            fontWeight: "800",
            color: C.text,
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          {copy.title}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: C.textSub,
            textAlign: "center",
            lineHeight: 22,
            marginBottom: 32,
          }}
        >
          {copy.body}
        </Text>

        {/* CTA Buttons */}
        {copy.cta1 && (
          <TouchableOpacity
            onPress={handleCta1}
            style={{
              backgroundColor: C.navy,
              borderRadius: 14,
              paddingVertical: 15,
              width: "100%",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ color: C.white, fontSize: 15, fontWeight: "700" }}>
              {copy.cta1}
            </Text>
          </TouchableOpacity>
        )}

        {copy.cta2 && (
          <TouchableOpacity
            onPress={handleCta2}
            style={{
              borderWidth: 2,
              borderColor: C.teal,
              borderRadius: 14,
              paddingVertical: 14,
              width: "100%",
              alignItems: "center",
            }}
          >
            <Text style={{ color: C.teal, fontSize: 15, fontWeight: "700" }}>
              {copy.cta2}
            </Text>
          </TouchableOpacity>
        )}

        {/* Progress steps — shown only on first-time state */}
        {context === "reports" && (
          <View
            style={{
              width: "100%",
              marginTop: 32,
              backgroundColor: C.white,
              borderRadius: 14,
              padding: 16,
              borderWidth: 1,
              borderColor: C.border,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: C.textSub,
                letterSpacing: 0.6,
                marginBottom: 14,
                textTransform: "uppercase",
              }}
            >
              Getting Started
            </Text>
            {steps.map((step, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: i < steps.length - 1 ? 14 : 0,
                }}
              >
                {/* Step indicator */}
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: step.done ? C.teal : C.bgLight,
                    borderWidth: step.done ? 0 : 2,
                    borderColor: C.border,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  {step.done ? (
                    <Text
                      style={{
                        color: C.white,
                        fontSize: 12,
                        fontWeight: "800",
                      }}
                    >
                      ✓
                    </Text>
                  ) : (
                    <Text
                      style={{
                        color: C.textSub,
                        fontSize: 11,
                        fontWeight: "700",
                      }}
                    >
                      {i + 1}
                    </Text>
                  )}
                </View>
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <View
                    style={{
                      position: "absolute",
                      left: 11,
                      top: 24,
                      width: 2,
                      height: 14,
                      backgroundColor: step.done ? C.teal : C.border,
                    }}
                  />
                )}
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: step.done ? "600" : "500",
                    color: step.done ? C.text : C.textSub,
                  }}
                >
                  {step.label}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </PhoneShell>
  );
}
