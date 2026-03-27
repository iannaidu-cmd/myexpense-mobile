import { NavigationProp } from "@react-navigation/native";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, ScrollView, View } from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────
type SkeletonVariant =
  | "expense_list"
  | "expense_detail"
  | "reports_home"
  | "category_chart"
  | "settings";

interface Props {
  navigation?: NavigationProp<any>;
  /** Which screen layout to skeleton */
  variant?: SkeletonVariant;
  /** Number of list rows to render (used by list variants) */
  rowCount?: number;
}

// ─── Brand Colours ────────────────────────────────────────────────────────────
import { colour } from "@/tokens";

const C = colour;

// ─── Shimmer Skeleton Block ───────────────────────────────────────────────────
function Skeleton({
  width = "100%",
  height = 14,
  borderRadius = 6,
  style = {},
  shimAnim,
}: {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
  shimAnim: Animated.Value;
}) {
  const shimmerTranslate = shimAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: C.skelBase,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          transform: [{ translateX: shimmerTranslate }],
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "transparent",
            borderRightWidth: 60,
            borderRightColor: "transparent",
            borderLeftWidth: 60,
            borderLeftColor: "transparent",
            borderTopWidth: height + 10,
            borderTopColor: `${C.skelShine}CC`,
          }}
        />
      </Animated.View>
    </View>
  );
}

// ─── Expense List Row Skeleton ────────────────────────────────────────────────
function ExpenseRowSkeleton({ shimAnim }: { shimAnim: Animated.Value }) {
  return (
    <View
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
      {/* Icon placeholder */}
      <Skeleton
        width={40}
        height={40}
        borderRadius={10}
        style={{ marginRight: 14 }}
        shimAnim={shimAnim}
      />
      <View style={{ flex: 1 }}>
        <Skeleton
          width="60%"
          height={13}
          style={{ marginBottom: 8 }}
          shimAnim={shimAnim}
        />
        <Skeleton width="40%" height={10} shimAnim={shimAnim} />
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Skeleton
          width={56}
          height={13}
          style={{ marginBottom: 8 }}
          shimAnim={shimAnim}
        />
        <Skeleton width={36} height={10} shimAnim={shimAnim} />
      </View>
    </View>
  );
}

// ─── Report Card Skeleton ─────────────────────────────────────────────────────
function ReportCardSkeleton({ shimAnim }: { shimAnim: Animated.Value }) {
  return (
    <View
      style={{
        backgroundColor: C.white,
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: C.border,
        marginBottom: 12,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Skeleton width="45%" height={13} shimAnim={shimAnim} />
        <Skeleton width={40} height={13} shimAnim={shimAnim} />
      </View>
      {/* Bar chart skeleton */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          height: 60,
          gap: 8,
          marginBottom: 12,
        }}
      >
        {[0.5, 0.8, 0.4, 0.9, 0.6, 0.7].map((h, i) => (
          <Skeleton
            key={i}
            width={24}
            height={60 * h}
            borderRadius={4}
            shimAnim={shimAnim}
          />
        ))}
      </View>
      <Skeleton width="80%" height={10} shimAnim={shimAnim} />
    </View>
  );
}

// ─── Settings Section Skeleton ────────────────────────────────────────────────
function SettingsSectionSkeleton({ shimAnim }: { shimAnim: Animated.Value }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Skeleton
        width="30%"
        height={10}
        style={{ marginHorizontal: 16, marginBottom: 10 }}
        shimAnim={shimAnim}
      />
      <View
        style={{
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: C.border,
          backgroundColor: C.white,
        }}
      >
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: i < 3 ? 1 : 0,
              borderBottomColor: C.border,
            }}
          >
            <Skeleton
              width={38}
              height={38}
              borderRadius={10}
              style={{ marginRight: 14 }}
              shimAnim={shimAnim}
            />
            <View style={{ flex: 1 }}>
              <Skeleton
                width="55%"
                height={13}
                style={{ marginBottom: 8 }}
                shimAnim={shimAnim}
              />
              <Skeleton width="40%" height={10} shimAnim={shimAnim} />
            </View>
            <Skeleton
              width={20}
              height={20}
              borderRadius={4}
              shimAnim={shimAnim}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── SCREEN: Loading / Skeleton ───────────────────────────────────────────────
export default function LoadingSkeletonScreen({
  navigation,
  variant = "expense_list",
  rowCount = 6,
}: Props) {
  const shimAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  // Header copy per variant
  const headerCopy: Record<
    SkeletonVariant,
    { section: string; title: string }
  > = {
    expense_list: { section: "EXPENSES", title: "My Expenses" },
    expense_detail: { section: "EXPENSES", title: "Expense Detail" },
    reports_home: {
      section: "REPORTS & ANALYTICS",
      title: "Financial Overview",
    },
    category_chart: {
      section: "SPENDING BY CATEGORY",
      title: "Category Breakdown",
    },
    settings: { section: "MYEXPENSE", title: "Settings" },
  };

  const { section, title } = headerCopy[variant];

  return (
    <View style={{ flex: 1, backgroundColor: C.bgLighter }}>
      {/* Header skeleton */}
      <View
        style={{
          backgroundColor: C.navy,
          paddingTop: 52,
          paddingBottom: 32,
          paddingHorizontal: 20,
        }}
      >
        <Skeleton
          width={80}
          height={10}
          borderRadius={4}
          style={{ marginBottom: 10, opacity: 0.4 }}
          shimAnim={shimAnim}
        />
        <Skeleton
          width={160}
          height={22}
          borderRadius={6}
          style={{ opacity: 0.3 }}
          shimAnim={shimAnim}
        />
      </View>

      {/* Body */}
      <View
        style={{
          flex: 1,
          backgroundColor: C.bgLighter,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          marginTop: -16,
        }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* ── Expense List ──────────────────────────────────── */}
          {variant === "expense_list" && (
            <View style={{ paddingTop: 16 }}>
              {/* Search bar skeleton */}
              <Skeleton
                width="90%"
                height={42}
                borderRadius={12}
                style={{ marginHorizontal: "5%", marginBottom: 12 }}
                shimAnim={shimAnim}
              />
              {/* Filter chips */}
              <View
                style={{
                  flexDirection: "row",
                  paddingHorizontal: 16,
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                {[60, 80, 70, 55].map((w, i) => (
                  <Skeleton
                    key={i}
                    width={w}
                    height={28}
                    borderRadius={14}
                    shimAnim={shimAnim}
                  />
                ))}
              </View>
              {/* Summary card */}
              <View
                style={{
                  marginHorizontal: 16,
                  backgroundColor: C.white,
                  borderRadius: 14,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: C.border,
                  marginBottom: 16,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  {[1, 2, 3].map((i) => (
                    <View key={i} style={{ alignItems: "center" }}>
                      <Skeleton
                        width={60}
                        height={18}
                        style={{ marginBottom: 6 }}
                        shimAnim={shimAnim}
                      />
                      <Skeleton width={50} height={10} shimAnim={shimAnim} />
                    </View>
                  ))}
                </View>
              </View>
              {/* List rows */}
              <View
                style={{
                  borderTopWidth: 1,
                  borderBottomWidth: 1,
                  borderColor: C.border,
                  overflow: "hidden",
                  backgroundColor: C.white,
                }}
              >
                {Array.from({ length: rowCount }).map((_, i) => (
                  <ExpenseRowSkeleton key={i} shimAnim={shimAnim} />
                ))}
              </View>
            </View>
          )}

          {/* ── Expense Detail ────────────────────────────────── */}
          {variant === "expense_detail" && (
            <View style={{ padding: 16 }}>
              {/* Receipt image placeholder */}
              <Skeleton
                width="100%"
                height={180}
                borderRadius={14}
                style={{ marginBottom: 16 }}
                shimAnim={shimAnim}
              />
              {/* Amount */}
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <Skeleton
                  width={120}
                  height={32}
                  borderRadius={8}
                  style={{ marginBottom: 8 }}
                  shimAnim={shimAnim}
                />
                <Skeleton width={80} height={12} shimAnim={shimAnim} />
              </View>
              {/* Detail rows */}
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={{ marginBottom: 16 }}>
                  <Skeleton
                    width="30%"
                    height={10}
                    style={{ marginBottom: 8 }}
                    shimAnim={shimAnim}
                  />
                  <Skeleton width="70%" height={16} shimAnim={shimAnim} />
                </View>
              ))}
            </View>
          )}

          {/* ── Reports Home ──────────────────────────────────── */}
          {variant === "reports_home" && (
            <View style={{ padding: 16 }}>
              {/* Period selector */}
              <Skeleton
                width="100%"
                height={40}
                borderRadius={10}
                style={{ marginBottom: 16 }}
                shimAnim={shimAnim}
              />
              {/* Metric cards */}
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                {[1, 2].map((i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      backgroundColor: C.white,
                      borderRadius: 14,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: C.border,
                    }}
                  >
                    <Skeleton
                      width="70%"
                      height={10}
                      style={{ marginBottom: 10 }}
                      shimAnim={shimAnim}
                    />
                    <Skeleton width="50%" height={20} shimAnim={shimAnim} />
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                {[1, 2].map((i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      backgroundColor: C.white,
                      borderRadius: 14,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: C.border,
                    }}
                  >
                    <Skeleton
                      width="70%"
                      height={10}
                      style={{ marginBottom: 10 }}
                      shimAnim={shimAnim}
                    />
                    <Skeleton width="50%" height={20} shimAnim={shimAnim} />
                  </View>
                ))}
              </View>
              {/* Chart card */}
              <ReportCardSkeleton shimAnim={shimAnim} />
              {/* Nav list items */}
              {[1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: C.white,
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: C.border,
                  }}
                >
                  <Skeleton
                    width={44}
                    height={44}
                    borderRadius={12}
                    style={{ marginRight: 14 }}
                    shimAnim={shimAnim}
                  />
                  <View style={{ flex: 1 }}>
                    <Skeleton
                      width="55%"
                      height={13}
                      style={{ marginBottom: 8 }}
                      shimAnim={shimAnim}
                    />
                    <Skeleton width="40%" height={10} shimAnim={shimAnim} />
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── Category Chart ────────────────────────────────── */}
          {variant === "category_chart" && (
            <View style={{ padding: 16 }}>
              {/* Summary cards */}
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                {[1, 2].map((i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      backgroundColor: C.white,
                      borderRadius: 14,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: C.border,
                    }}
                  >
                    <Skeleton
                      width="60%"
                      height={10}
                      style={{ marginBottom: 10 }}
                      shimAnim={shimAnim}
                    />
                    <Skeleton width="50%" height={18} shimAnim={shimAnim} />
                  </View>
                ))}
              </View>
              {/* Donut chart placeholder */}
              <View
                style={{
                  backgroundColor: C.white,
                  borderRadius: 14,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: C.border,
                  marginBottom: 16,
                  alignItems: "center",
                }}
              >
                <Skeleton
                  width={120}
                  height={120}
                  borderRadius={60}
                  style={{ marginBottom: 16 }}
                  shimAnim={shimAnim}
                />
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                    justifyContent: "center",
                  }}
                >
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton
                      key={i}
                      width={80}
                      height={10}
                      borderRadius={4}
                      shimAnim={shimAnim}
                    />
                  ))}
                </View>
              </View>
              {/* Category rows */}
              <View
                style={{
                  backgroundColor: C.white,
                  borderRadius: 14,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: C.border,
                }}
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <View
                    key={i}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      borderBottomWidth: i < 4 ? 1 : 0,
                      borderBottomColor: C.border,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <Skeleton width="45%" height={12} shimAnim={shimAnim} />
                      <Skeleton width={60} height={12} shimAnim={shimAnim} />
                    </View>
                    <Skeleton
                      width="100%"
                      height={5}
                      borderRadius={3}
                      shimAnim={shimAnim}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Settings ──────────────────────────────────────── */}
          {variant === "settings" && (
            <View style={{ paddingTop: 16 }}>
              {/* Profile card skeleton */}
              <View
                style={{
                  margin: 16,
                  backgroundColor: C.white,
                  borderRadius: 16,
                  padding: 18,
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: C.border,
                }}
              >
                <Skeleton
                  width={52}
                  height={52}
                  borderRadius={26}
                  style={{ marginRight: 14 }}
                  shimAnim={shimAnim}
                />
                <View style={{ flex: 1 }}>
                  <Skeleton
                    width="55%"
                    height={14}
                    style={{ marginBottom: 10 }}
                    shimAnim={shimAnim}
                  />
                  <Skeleton
                    width="70%"
                    height={10}
                    style={{ marginBottom: 8 }}
                    shimAnim={shimAnim}
                  />
                  <Skeleton
                    width={70}
                    height={20}
                    borderRadius={8}
                    shimAnim={shimAnim}
                  />
                </View>
              </View>
              <SettingsSectionSkeleton shimAnim={shimAnim} />
              <SettingsSectionSkeleton shimAnim={shimAnim} />
            </View>
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
      </View>

      {/* Bottom nav skeleton */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: C.white,
          borderTopWidth: 1,
          borderTopColor: C.border,
          paddingBottom: 8,
          paddingTop: 10,
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            <Skeleton
              width={24}
              height={24}
              borderRadius={4}
              style={{ marginBottom: 4 }}
              shimAnim={shimAnim}
            />
            <Skeleton width={36} height={8} shimAnim={shimAnim} />
          </View>
        ))}
      </View>
    </View>
  );
}
