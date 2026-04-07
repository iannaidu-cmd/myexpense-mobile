import { MXTabBar } from "@/components/MXTabBar";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { colour, space } from "@/tokens";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, TouchableOpacity, View } from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────────
interface Props {
  /** Optional context: which part of the app triggered the empty state */
  context?: "expenses" | "search" | "filtered" | "category";
  /** Only used when context = 'category' or 'filtered' */
  filterLabel?: string;
  onAddExpense?: () => void;
  onScanReceipt?: () => void;
  onClearFilter?: () => void;
}

// ─── Brand Colours ────────────────────────────────────────────────────────────

const NAV_ICONS = { Home: "⊞", Scan: "⊡", Reports: "◈", Settings: "⚙" };

// ─── Phone Shell ──────────────────────────────────────────────────────────────
function PhoneShell({
  children,
  activeTab = "Home",
}: {
  children: React.ReactNode;
  activeTab?: string;
}) {
  return (
    <ThemedView style={{ flex: 1, backgroundColor: colour.surface1 }}>
      <View style={{ flex: 1 }}>{children}</View>
      <MXTabBar />
    </ThemedView>
  );
}

// ─── Animated Receipt Illustration ───────────────────────────────────────────
function ReceiptIllustration() {
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: -8,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View
      style={{ transform: [{ translateY: float }], alignItems: "center" }}
    >
      {/* Outer receipt card */}
      <View
        style={{
          width: 110,
          backgroundColor: colour.background,
          borderRadius: space.md,
          padding: space.md,
          borderWidth: 1.5,
          borderColor: colour.border,
          shadowColor: colour.primary,
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        {/* Receipt header stripe */}
        <View
          style={{
            height: 8,
            backgroundColor: colour.surface2,
            borderRadius: space.xxs,
            marginBottom: 10,
          }}
        />
        {/* Line items */}
        {[0.7, 0.5, 0.85, 0.4].map((w, i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 7,
            }}
          >
            <View
              key={i}
              style={{
                flex: w,
                height: 5,
                backgroundColor: i % 2 === 0 ? colour.surface2 : colour.border,
                borderRadius: 3,
                marginRight: 6,
              }}
            />
            <View
              style={{
                width: 28,
                height: 5,
                backgroundColor: i === 3 ? colour.accent : colour.surface2,
                borderRadius: 3,
                opacity: 0.7,
              }}
            />
          </View>
        ))}
        {/* Total line */}
        <View
          style={{
            height: 1,
            backgroundColor: colour.border,
            marginVertical: 8,
          }}
        />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 40,
              height: 6,
              backgroundColor: colour.surface2,
              borderRadius: 3,
            }}
          />
          <View
            style={{
              width: 36,
              height: 6,
              backgroundColor: colour.accent,
              borderRadius: 3,
              opacity: 0.8,
            }}
          />
        </View>
        {/* Zigzag bottom */}
        <View
          style={{ flexDirection: "row", marginTop: 12, overflow: "hidden" }}
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <View
              key={i}
              style={{
                width: 10,
                height: 6,
                backgroundColor:
                  i % 2 === 0 ? colour.surface2 : colour.background,
                borderBottomLeftRadius: i % 2 === 0 ? 6 : 0,
                borderBottomRightRadius: i % 2 !== 0 ? 6 : 0,
              }}
            />
          ))}
        </View>
      </View>

      {/* Floating teal dot */}
      <View
        style={{
          position: "absolute",
          top: -6,
          right: -6,
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: colour.accent,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 2,
          borderColor: colour.background,
        }}
      >
        <ThemedText
          style={{ color: colour.onPrimary, fontSize: 11, fontWeight: "800" }}
        >
          +
        </ThemedText>
      </View>
    </Animated.View>
  );
}

// ─── SCREEN: Empty State — No Expenses ───────────────────────────────────────
export default function EmptyStateNoExpensesScreen({
  context = "expenses",
  filterLabel,
  onAddExpense,
  onScanReceipt,
  onClearFilter,
}: Props) {
  const router = useRouter();
  // Derive copy from context
  const copy = {
    expenses: {
      emoji: null,
      title: "No expenses yet",
      body: "Start capturing your business expenses to track spending and maximise your SARS ITR12 deductions.",
      cta1: "Add your first expense",
      cta2: "Scan a receipt",
    },
    search: {
      emoji: "🔍",
      title: "No results found",
      body: "Try a different search term, or check your spelling.",
      cta1: null,
      cta2: null,
    },
    filtered: {
      emoji: "🔎",
      title: "No expenses match",
      body: filterLabel
        ? `No expenses found for "${filterLabel}". Try adjusting your filters.`
        : "No expenses match your current filter. Try removing some filters.",
      cta1: null,
      cta2: null,
    },
    category: {
      emoji: "🏷",
      title: "No expenses in this category",
      body: filterLabel
        ? `You haven't logged any expenses under "${filterLabel}" yet.`
        : "No expenses logged under this category yet.",
      cta1: "Add expense here",
      cta2: null,
    },
  }[context];

  const handleCta1 =
    onAddExpense ?? (() => router.push("/add-expense-manual" as any));
  const handleCta2 =
    onScanReceipt ?? (() => router.push("/(tabs)/scan" as any));
  const handleClear = onClearFilter ?? (() => router.back());

  return (
    <PhoneShell activeTab="Home">
      {/* Header */}
      <ThemedView
        style={{
          backgroundColor: colour.primary,
          paddingTop: space.xxl,
          paddingBottom: space.xl,
          paddingHorizontal: space.lg,
        }}
      >
        <ThemedText
          style={{
            color: colour.accent,
            fontSize: 12,
            fontWeight: "600",
            letterSpacing: 1,
          }}
        >
          Expenses
        </ThemedText>
        <ThemedText
          style={{
            color: colour.onPrimary,
            fontSize: 24,
            fontWeight: "800",
            marginTop: 4,
          }}
        >
          My expenses
        </ThemedText>
      </ThemedView>

      {/* White body */}
      <ThemedView
        style={{
          flex: 1,
          backgroundColor: colour.surface1,
          borderTopLeftRadius: space.xl,
          borderTopRightRadius: space.xl,
          marginTop: -16,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: space.xl,
          paddingBottom: space.xl,
        }}
      >
        {/* Illustration or emoji */}
        <View style={{ marginBottom: space.xl }}>
          {context === "expenses" ? (
            <ReceiptIllustration />
          ) : (
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: colour.surface2,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ThemedText style={{ fontSize: 44 }}>{copy.emoji}</ThemedText>
            </View>
          )}
        </View>

        {/* Text */}
        <ThemedText
          style={{
            fontSize: 22,
            fontWeight: "800",
            color: colour.text,
            textAlign: "center",
            marginBottom: space.md,
          }}
        >
          {copy.title}
        </ThemedText>
        <ThemedText
          style={{
            fontSize: 14,
            color: colour.textSub,
            textAlign: "center",
            lineHeight: 22,
            marginBottom: space.xl,
          }}
        >
          {copy.body}
        </ThemedText>

        {/* CTAs */}
        {copy.cta1 && (
          <TouchableOpacity
            onPress={handleCta1}
            style={{
              backgroundColor: colour.primary,
              borderRadius: space.md,
              paddingVertical: space.md,
              paddingHorizontal: space.xl,
              width: "100%",
              alignItems: "center",
              marginBottom: space.md,
            }}
          >
            <ThemedText
              style={{
                color: colour.onPrimary,
                fontSize: 15,
                fontWeight: "700",
              }}
            >
              {copy.cta1}
            </ThemedText>
          </TouchableOpacity>
        )}

        {copy.cta2 && (
          <TouchableOpacity
            onPress={handleCta2}
            style={{
              borderWidth: 2,
              borderColor: colour.accent,
              borderRadius: space.md,
              paddingVertical: space.md,
              paddingHorizontal: space.xl,
              width: "100%",
              alignItems: "center",
              marginBottom: space.md,
            }}
          >
            <ThemedText
              style={{ color: colour.accent, fontSize: 15, fontWeight: "700" }}
            >
              {copy.cta2}
            </ThemedText>
          </TouchableOpacity>
        )}

        {(context === "filtered" || context === "search") && (
          <TouchableOpacity
            onPress={handleClear}
            style={{ marginTop: space.md }}
          >
            <ThemedText
              style={{ color: colour.textSub, fontSize: 13, fontWeight: "600" }}
            >
              Clear filter
            </ThemedText>
          </TouchableOpacity>
        )}

        {/* ITR12 tip — only on first-time empty */}
        {context === "expenses" && (
          <View
            style={{
              position: "absolute",
              bottom: space.lg,
              backgroundColor: colour.surface2,
              borderRadius: space.md,
              padding: space.md,
              flexDirection: "row",
              alignItems: "flex-start",
              marginHorizontal: 0,
            }}
          >
            <ThemedText style={{ fontSize: 16, marginRight: 10 }}>
              💡
            </ThemedText>
            <ThemedText
              style={{
                flex: 1,
                fontSize: 12,
                color: colour.textSub,
                lineHeight: 18,
              }}
            >
              Tip: Capturing expenses throughout the year means zero scrambling
              at ITR12 time.
            </ThemedText>
          </View>
        )}
      </ThemedView>
    </PhoneShell>
  );
}
