import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { expenseService } from "@/services/expenseService";
import { useAuthStore } from "@/stores/authStore";
import { useExpenseStore } from "@/stores/expenseStore";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { colour, radius, space } from "@/tokens";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function ToggleRow({
  label,
  sub,
  value,
  onToggle,
}: {
  label: string;
  sub: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: space.md,
        paddingVertical: 13,
        borderBottomWidth: 1,
        borderBottomColor: colour.borderLight,
        backgroundColor: colour.white,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colour.text }}>
          {label}
        </Text>
        <Text style={{ fontSize: 12, color: colour.textSub, marginTop: 2 }}>
          {sub}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colour.border, true: colour.accent }}
        thumbColor={colour.white}
      />
    </View>
  );
}

const YEARS = ["2025/26", "2024/25", "2023/24", "2022/23"];
const FORMATS = [
  { key: "pdf",  label: "PDF report",      icon: "doc.text.fill"        },
  { key: "csv",  label: "CSV spreadsheet", icon: "chart.bar.fill"       },
  { key: "both", label: "Both",            icon: "tray.and.arrow.up.fill"},
] as const;
type FormatKey = "pdf" | "csv" | "both";

const fmt = (n: number) =>
  `R ${Number(n).toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function ITR12ExportSetupScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeTaxYear } = useExpenseStore();
  const { isPro } = useSubscriptionStore();

  // Gate: redirect to paywall if not Pro
  useEffect(() => {
    if (!isPro) {
      router.replace("/paywall-upgrade" as any);
    }
  }, [isPro]);
  const [totalDeductions, setTotalDeductions] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [receiptCount, setReceiptCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [taxYear, setTaxYear] = useState(() => activeTaxYear);
  const [includeReceipts, setIncludeReceipts] = useState(true);
  const [includeVAT, setIncludeVAT] = useState(false);
  const [includeTravel, setIncludeTravel] = useState(true);
  const [includePersonal, setIncludePersonal] = useState(false);
  const [summaryOnly, setSummaryOnly] = useState(false);
  const [format, setFormat] = useState<FormatKey>("pdf");
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [totals, byCategory, expenses] = await Promise.all([
        expenseService.getTotals(user.id, taxYear),
        expenseService.getByCategory(user.id, taxYear),
        expenseService.getExpenses(user.id, taxYear),
      ]);
      setTotalDeductions(totals.totalDeductions);
      setTotalExpenses(totals.totalExpenses);
      setCategoryCount(
        Object.keys(byCategory).filter((k) => k !== "Personal / Non-deductible")
          .length,
      );
      setReceiptCount(expenses.filter((e) => e.receipt_url).length);
    } catch (e) {
      console.error("ITR12Export load error:", e);
    } finally {
      setLoading(false);
    }
  }, [user, taxYear]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleExport = async () => {
    if (!user) return;
    if (totalExpenses === 0) {
      Alert.alert("No expenses", "Add expenses before generating an export.");
      return;
    }
    setExporting(true);
    try {
      if (format === "pdf" || format === "both") {
        await generateITR12PDF({
          userId: user.id,
          taxYear,
          includeReceipts,
          includeVAT,
          includePersonal,
          summaryOnly,
        });
      }
      if (format === "csv" || format === "both") {
        await exportExpensesCSV({
          userId: user.id,
          taxYear,
          includePersonal,
        });
      }
    } catch (e: any) {
      Alert.alert(
        "Export failed",
        e?.message ?? "Could not generate export. Please try again.",
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.background }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />
      <MXHeader
        title="Export Setup"
        subtitle="Configure your ITR12 export"
        showBack
        backLabel="Tax & ITR12"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{
          flex: 1,
          backgroundColor: colour.background,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {loading ? (
          <View style={{ alignItems: "center", paddingTop: space["4xl"] }}>
            <ActivityIndicator color={colour.primary} size="large" />
          </View>
        ) : (
          <>
            <View
              style={{
                marginHorizontal: space.md,
                marginTop: space.lg,
                backgroundColor: colour.white,
                borderRadius: radius.md,
                padding: space.md,
                borderWidth: 1,
                borderColor: colour.borderLight,
                marginBottom: space.sm,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: colour.text,
                  marginBottom: 14,
                }}
              >
                Tax year
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {YEARS.map((y) => (
                  <TouchableOpacity
                    key={y}
                    onPress={() => setTaxYear(y)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      backgroundColor:
                        taxYear === y ? colour.primary : colour.surface1,
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor:
                        taxYear === y ? colour.primary : colour.borderLight,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color:
                          taxYear === y ? colour.onPrimary : colour.textSub,
                      }}
                    >
                      {y}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View
              style={{
                marginHorizontal: space.md,
                backgroundColor: colour.white,
                borderRadius: radius.md,
                padding: space.md,
                borderWidth: 1,
                borderColor: colour.borderLight,
                marginBottom: space.sm,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: colour.text,
                  marginBottom: 14,
                }}
              >
                Export format
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {FORMATS.map((f) => (
                  <TouchableOpacity
                    key={f.key}
                    onPress={() => setFormat(f.key)}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      paddingVertical: 12,
                      borderRadius: radius.sm,
                      backgroundColor:
                        format === f.key ? colour.primary : colour.surface1,
                      borderWidth: 1,
                      borderColor:
                        format === f.key ? colour.primary : colour.borderLight,
                    }}
                  >
                    <IconSymbol name={f.icon as any} size={20} color={format === f.key ? colour.onPrimary : colour.textSub} style={{ marginBottom: 4 } as any} />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        textAlign: "center",
                        color:
                          format === f.key ? colour.onPrimary : colour.textSub,
                      }}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: colour.textHint,
                letterSpacing: 0.8,
                paddingHorizontal: space.md,
                marginBottom: 8,
              }}
            >
              Include in export
            </Text>
            <View
              style={{
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderColor: colour.borderLight,
                overflow: "hidden",
                marginBottom: space.md,
              }}
            >
              <ToggleRow
                label="Receipt Images"
                sub="Attach scanned receipts as evidence"
                value={includeReceipts}
                onToggle={() => setIncludeReceipts((v) => !v)}
              />
              <ToggleRow
                label="VAT Details"
                sub="Include VAT amounts and supplier VAT numbers"
                value={includeVAT}
                onToggle={() => setIncludeVAT((v) => !v)}
              />
              <ToggleRow
                label="Travel Log"
                sub="Odometer records and trip log"
                value={includeTravel}
                onToggle={() => setIncludeTravel((v) => !v)}
              />
              <ToggleRow
                label="Personal Expenses"
                sub="Include non-deductible items for reference"
                value={includePersonal}
                onToggle={() => setIncludePersonal((v) => !v)}
              />
              <ToggleRow
                label="Summary Only"
                sub="Top-level totals without line items"
                value={summaryOnly}
                onToggle={() => setSummaryOnly((v) => !v)}
              />
            </View>

            <View
              style={{
                marginHorizontal: space.md,
                backgroundColor: colour.surface1,
                borderRadius: radius.md,
                padding: space.md,
                marginBottom: space.lg,
                borderWidth: 1,
                borderColor: colour.borderLight,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: colour.text,
                  marginBottom: 10,
                }}
              >
                Export summary
              </Text>
              {[
                { label: "Tax Year", value: taxYear },
                {
                  label: "Format",
                  value: FORMATS.find((f) => f.key === format)?.label ?? "",
                },
                { label: "Total Deductions", value: fmt(totalDeductions) },
                { label: "Categories", value: `${categoryCount} deductible` },
                {
                  label: "Receipts",
                  value: includeReceipts
                    ? `${receiptCount} attached`
                    : "Not included",
                },
                {
                  label: "Est. Tax Saving",
                  value: fmt(Math.round(totalDeductions * 0.31)),
                },
              ].map((row, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <Text style={{ fontSize: 12, color: colour.textSub }}>
                    {row.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: colour.text,
                    }}
                  >
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => router.push("/itr12-export-preview")}
              style={{
                marginHorizontal: space.md,
                backgroundColor: colour.primary,
                borderRadius: radius.md,
                padding: space.md,
                alignItems: "center",
                marginBottom: space.sm,
              }}
            >
              <Text
                style={{ color: colour.white, fontSize: 15, fontWeight: "700" }}
              >
                Preview export
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleExport}
              disabled={exporting}
              style={{
                marginHorizontal: space.md,
                backgroundColor: exporting ? colour.border : colour.accent,
                borderRadius: radius.md,
                padding: space.md,
                alignItems: "center",
                marginBottom: space.md,
              }}
            >
              {exporting ? (
                <ActivityIndicator color={colour.white} />
              ) : (
                <Text
                  style={{
                    color: colour.white,
                    fontSize: 15,
                    fontWeight: "700",
                  }}
                >
                  {format === "pdf"
                    ? "Generate PDF & Share"
                    : format === "csv"
                      ? "Generate CSV & Share"
                      : "Generate PDF + CSV & Share"}
                </Text>
              )}
            </TouchableOpacity>

            <View style={{ marginHorizontal: space.md }}>
              <Text
                style={{
                  fontSize: 11,
                  color: colour.textHint,
                  textAlign: "center",
                  lineHeight: 16,
                }}
              >
                This export is for your records and tax practitioner. Always
                have your ITR12 reviewed by a registered tax professional before
                submission.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
      <MXTabBar />
    </SafeAreaView>
  );
}
