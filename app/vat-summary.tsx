import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { expenseService } from "@/services/expenseService";
import { useAuthStore } from "@/stores/authStore";
import { useExpenseStore } from "@/stores/expenseStore";
import { colour, radius, space, typography } from "@/tokens";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Share,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const VAT_RATE = 0.15;
const fmt = (n: number) =>
  `R ${Number(n).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

type Period = "month" | "quarter" | "year";

export default function VATSummaryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeTaxYear } = useExpenseStore();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [period, setPeriod] = useState<Period>("month");

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await expenseService.getExpenses(user.id, activeTaxYear);
      setExpenses(data.filter((e) => e.vat_amount && Number(e.vat_amount) > 0));
    } catch (e) {
      console.error("VATSummary load error:", e);
    } finally {
      setLoading(false);
    }
  }, [user, activeTaxYear]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const now = new Date();
  const filtered = expenses.filter((e) => {
    const d = new Date(e.expense_date);
    if (period === "month")
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    if (period === "quarter")
      return (
        Math.floor(d.getMonth() / 3) === Math.floor(now.getMonth() / 3) &&
        d.getFullYear() === now.getFullYear()
      );
    return true;
  });

  const totalVAT = filtered.reduce((s, e) => s + Number(e.vat_amount), 0);
  const claimableVAT = filtered
    .filter((e) => e.is_deductible)
    .reduce((s, e) => s + Number(e.vat_amount), 0);
  const nonClaimable = totalVAT - claimableVAT;

  const handleExport = async () => {
    try {
      const lines = [
        "MyExpense VAT Report",
        `Tax Year: ${activeTaxYear}`,
        `Period: ${period}`,
        "",
        "Vendor,Date,Amount,VAT,Category,Claimable",
        ...filtered.map(
          (e) =>
            `${e.vendor},${e.expense_date},${e.amount},${e.vat_amount},${e.category},${e.is_deductible ? "Yes" : "No"}`,
        ),
        "",
        `Total VAT: ${fmt(totalVAT)}`,
        `Claimable VAT: ${fmt(claimableVAT)}`,
      ].join("\n");
      await Share.share({ message: lines, title: "VAT Report" });
    } catch (e) {
      Alert.alert("Export failed", "Could not export VAT report.");
    }
  };

  const periods: { key: Period; label: string }[] = [
    { key: "month", label: "This month" },
    { key: "quarter", label: "This quarter" },
    { key: "year", label: "Tax year" },
  ];

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.background }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />
      <MXHeader
        title="VAT Summary"
        subtitle={`VAT at ${(VAT_RATE * 100).toFixed(0)}% · South Africa`}
        showBack
        backLabel="Reports"
      />

      <ScrollView
        style={{
          flex: 1,
          backgroundColor: colour.bgCard,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
        }}
        contentContainerStyle={{
          padding: space.lg,
          paddingBottom: space["4xl"],
        }}
      >
        <View
          style={{
            flexDirection: "row",
            gap: space.sm,
            marginBottom: space.xl,
          }}
        >
          {periods.map((p) => (
            <TouchableOpacity
              key={p.key}
              onPress={() => setPeriod(p.key)}
              style={{
                flex: 1,
                height: 36,
                borderRadius: radius.pill,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor:
                  period === p.key ? colour.primary : "transparent",
                borderWidth: 1.5,
                borderColor: period === p.key ? colour.primary : colour.border,
              }}
            >
              <Text
                style={{
                  ...typography.btnM,
                  color:
                    period === p.key
                      ? colour.textOnPrimary
                      : colour.textSecondary,
                }}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={{ alignItems: "center", paddingTop: space["4xl"] }}>
            <ActivityIndicator color={colour.primary} size="large" />
          </View>
        ) : (
          <>
            <View
              style={{
                flexDirection: "row",
                gap: space.md,
                marginBottom: space.xl,
              }}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: colour.primaryLight,
                  borderRadius: radius.md,
                  padding: space.md,
                  borderLeftWidth: 3,
                  borderLeftColor: colour.primary,
                }}
              >
                <Text
                  style={{ ...typography.caption, color: colour.textSecondary }}
                >
                  Total VAT paid
                </Text>
                <Text
                  style={{
                    ...typography.amountS,
                    color: colour.textPrimary,
                    marginTop: 2,
                  }}
                >
                  {fmt(totalVAT)}
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  backgroundColor: colour.successLight,
                  borderRadius: radius.md,
                  padding: space.md,
                  borderLeftWidth: 3,
                  borderLeftColor: colour.success,
                }}
              >
                <Text
                  style={{ ...typography.caption, color: colour.textSecondary }}
                >
                  VAT claimable
                </Text>
                <Text
                  style={{
                    ...typography.amountS,
                    color: colour.success,
                    marginTop: 2,
                  }}
                >
                  {fmt(claimableVAT)}
                </Text>
              </View>
            </View>

            {nonClaimable > 0 && (
              <View
                style={{
                  backgroundColor: colour.warningBg,
                  borderRadius: radius.md,
                  padding: space.md,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: space.xl,
                }}
              >
                <View>
                  <Text style={{ ...typography.labelM, color: colour.warning }}>
                    Non-claimable VAT
                  </Text>
                  <Text
                    style={{ ...typography.caption, color: colour.warning }}
                  >
                    Zero-rated or exempt supplies
                  </Text>
                </View>
                <Text style={{ ...typography.amountS, color: colour.warning }}>
                  {fmt(nonClaimable)}
                </Text>
              </View>
            )}

            <View
              style={{
                backgroundColor: colour.infoLight,
                borderRadius: radius.md,
                padding: space.md,
                marginBottom: space.xl,
              }}
            >
              <Text
                style={{
                  ...typography.labelS,
                  color: colour.info,
                  marginBottom: space.xs,
                }}
              >
                VAT Registration Note
              </Text>
              <Text style={{ ...typography.bodyS, color: colour.info }}>
                VAT input claims apply only if you are a registered VAT vendor
                with SARS. If your annual turnover exceeds R1 million, VAT
                registration is compulsory.
              </Text>
            </View>

            <Text
              style={{
                ...typography.labelM,
                color: colour.textSecondary,
                marginBottom: space.sm,
              }}
            >
              VAT breakdown
            </Text>

            {filtered.length === 0 ? (
              <View
                style={{ alignItems: "center", paddingVertical: space["3xl"] }}
              >
                <IconSymbol name="doc.text.fill" size={36} color={colour.textHint} style={{ marginBottom: space.sm } as any} />
                <Text style={{ ...typography.h4, color: colour.textPrimary }}>
                  No VAT records
                </Text>
                <Text
                  style={{
                    ...typography.bodyS,
                    color: colour.textSecondary,
                    textAlign: "center",
                    marginTop: space.xs,
                  }}
                >
                  Add VAT amounts when capturing expenses to see them here
                </Text>
              </View>
            ) : (
              filtered.map((entry) => (
                <View
                  key={entry.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: space.md,
                    borderBottomWidth: 1,
                    borderBottomColor: colour.border,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        ...typography.labelM,
                        color: colour.textPrimary,
                      }}
                    >
                      {entry.vendor}
                    </Text>
                    <Text
                      style={{
                        ...typography.caption,
                        color: colour.textSecondary,
                      }}
                    >
                      {entry.category} · {formatDate(entry.expense_date)}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={{
                        ...typography.amountS,
                        color: colour.textPrimary,
                      }}
                    >
                      {fmt(entry.vat_amount)}
                    </Text>
                    <View
                      style={{
                        backgroundColor: entry.is_deductible
                          ? colour.successLight
                          : colour.dangerLight,
                        borderRadius: radius.full,
                        paddingHorizontal: space.xs,
                        paddingVertical: 2,
                        marginTop: 2,
                      }}
                    >
                      <Text
                        style={{
                          ...typography.micro,
                          color: entry.is_deductible
                            ? colour.success
                            : colour.danger,
                          fontWeight: "600",
                        }}
                      >
                        {entry.is_deductible ? "Claimable" : "Not claimable"}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}

            <TouchableOpacity
              onPress={handleExport}
              style={{
                marginTop: space.xl,
                borderRadius: radius.pill,
                borderWidth: 1.5,
                borderColor: colour.primary,
                height: 52,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ ...typography.btnL, color: colour.primary }}>
                Export VAT report
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
      <MXTabBar />
    </SafeAreaView>
  );
}
