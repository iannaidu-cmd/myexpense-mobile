import { colour, radius, space, typography } from "@/tokens";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface ReportHomeScreenProps { navigation?: any; }
interface ReportItem { icon: string; title: string; description: string; badge?: string; screen: string; }

function MetricCard({
  label, value, sub, color, onPress,
}: {
  label: string; value: string; sub?: string; color?: string; onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        borderRadius: radius.md,
        padding: 14,
        margin: 5,
        borderWidth: 1,
        borderColor: colour.border,
        backgroundColor: colour.white,
      }}
    >
      <Text style={{ ...typography.bodyXS, color: colour.textSub, marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontSize: 20, fontWeight: "800", color: color || colour.text }}>{value}</Text>
      {sub ? <Text style={{ ...typography.micro, color: colour.textSub, marginTop: 2 }}>{sub}</Text> : null}
    </TouchableOpacity>
  );
}

function ReportNavCard({
  icon, title, description, badge, onPress,
}: {
  icon: string; title: string; description: string; badge?: string; onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderRadius: radius.md,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: colour.border,
        backgroundColor: colour.white,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: radius.md,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 14,
          backgroundColor: colour.surface1,
        }}
      >
        <Text style={{ fontSize: 22 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ ...typography.labelM, color: colour.text }}>{title}</Text>
        <Text style={{ ...typography.bodyXS, color: colour.textSub, marginTop: 2 }}>{description}</Text>
      </View>
      {badge ? (
        <View
          style={{
            borderRadius: radius.sm,
            paddingHorizontal: 8,
            paddingVertical: 3,
            marginRight: 8,
            backgroundColor: colour.info,
          }}
        >
          <Text style={{ ...typography.micro, color: colour.white, fontWeight: "700" }}>{badge}</Text>
        </View>
      ) : null}
      <Text style={{ fontSize: 18, fontWeight: "300", color: colour.midNavy2 }}>›</Text>
    </TouchableOpacity>
  );
}

export function ReportHomeScreen({ navigation }: ReportHomeScreenProps) {
  const [period, setPeriod] = useState("This month");
  const periods = ["This month", "This quarter", "This year"];

  const summary = {
    totalExpenses:    "R 18 420",
    taxDeductible:    "R 11 750",
    deductionRate:    "63.8%",
    pendingReceipts:  "4",
  };

  const reports: ReportItem[] = [
    { icon: "🏷",  title: "Spending by category", description: "ITR12 category breakdown",          screen: "SpendingByCategory" },
    { icon: "📈",  title: "Monthly trend",          description: "Month-by-month spending patterns",  screen: "MonthlyTrend"        },
    { icon: "🎯",  title: "Budget vs actual",        description: "Track spend against your budget",  badge: "2 over", screen: "BudgetVsActual" },
    { icon: "🏪",  title: "Top vendors",             description: "Your most frequent suppliers",      screen: "TopVendors"          },
    { icon: "🔮",  title: "Deduction forecast",       description: "Projected SARS ITR12 deductions",  badge: "New", screen: "DeductionForecast" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colour.white }}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ backgroundColor: colour.primary, paddingTop: 52, paddingBottom: 28, paddingHorizontal: 20 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
            <View>
              <Text style={{ color: colour.teal, fontSize: 12, fontWeight: "600", letterSpacing: 1 }}>
                REPORTS & ANALYTICS
              </Text>
              <Text style={{ ...typography.h3, color: colour.white, marginTop: 4 }}>Financial Overview</Text>
            </View>
            <TouchableOpacity
              style={{
                borderRadius: radius.sm,
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: colour.midNavy2,
              }}
            >
              <Text style={{ ...typography.labelS, color: colour.white }}>Export</Text>
            </TouchableOpacity>
          </View>

          {/* Period selector */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: colour.navyDark,
              borderRadius: radius.sm,
              padding: 3,
            }}
          >
            {periods.map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setPeriod(p)}
                style={{
                  flex: 1,
                  paddingVertical: 7,
                  borderRadius: radius.sm,
                  backgroundColor: period === p ? colour.info : "transparent",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    ...typography.labelS,
                    color: period === p ? colour.white : colour.textSub,
                  }}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Content */}
        <View
          style={{
            backgroundColor: colour.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            marginTop: -16,
            paddingTop: 20,
            paddingHorizontal: 16,
            paddingBottom: 20,
          }}
        >
          <Text style={{ ...typography.labelM, color: colour.text, marginBottom: 10 }}>
            Summary — {period}
          </Text>
          <View style={{ flexDirection: "row", marginHorizontal: -5, marginBottom: 6 }}>
            <MetricCard label="Total expenses"    value={summary.totalExpenses}   sub="All categories"   color={colour.primary} />
            <MetricCard label="Tax deductible"    value={summary.taxDeductible}   sub="ITR12 eligible"   color={colour.success} />
          </View>
          <View style={{ flexDirection: "row", marginHorizontal: -5, marginBottom: 20 }}>
            <MetricCard label="Deduction rate"    value={summary.deductionRate}   sub="Of total spend"   color={colour.info}    />
            <MetricCard label="Pending receipts"  value={summary.pendingReceipts} sub="Needs attention"  color={colour.warning} />
          </View>

          {/* ITR12 Readiness progress */}
          <View
            style={{
              borderRadius: radius.md,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: colour.border,
              backgroundColor: colour.white,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ ...typography.labelM, color: colour.text }}>ITR12 Readiness</Text>
              <Text style={{ ...typography.labelM, color: colour.info }}>78%</Text>
            </View>
            <View
              style={{ height: 8, borderRadius: 4, backgroundColor: colour.surface1, overflow: "hidden" }}
            >
              <View
                style={{ width: "78%", height: 8, borderRadius: 4, backgroundColor: colour.info }}
              />
            </View>
            <Text style={{ ...typography.bodyXS, color: colour.textSub, marginTop: 8 }}>
              4 receipts unmatched · 2 categories need review
            </Text>
          </View>

          <Text style={{ ...typography.labelM, color: colour.text, marginBottom: 10 }}>Detailed Reports</Text>
          {reports.map((r) => (
            <ReportNavCard
              key={r.screen}
              icon={r.icon}
              title={r.title}
              description={r.description}
              badge={r.badge}
              onPress={() => navigation?.navigate(r.screen)}
            />
          ))}

          {/* Tax Year footer */}
          <View
            style={{
              borderRadius: radius.md,
              padding: 16,
              marginTop: 6,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colour.primary,
            }}
          >
            <Text style={{ fontSize: 22, marginRight: 12 }}>🗓</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.labelM, color: colour.white }}>Tax Year 2024 / 2025</Text>
              <Text style={{ ...typography.bodyXS, color: colour.textSub, marginTop: 2 }}>
                Filing deadline: 31 October 2025
              </Text>
            </View>
            <TouchableOpacity
              style={{
                borderRadius: radius.sm,
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: colour.info,
              }}
            >
              <Text style={{ ...typography.labelS, color: colour.white }}>Prepare</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
