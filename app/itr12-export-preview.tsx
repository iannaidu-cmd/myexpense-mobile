import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { expenseService } from "@/services/expenseService";
import { generateITR12PDF } from "@/services/pdfExportService";
import { profileService } from "@/services/profileService";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space } from "@/tokens";
import { ACTIVE_TAX_YEAR } from "@/types/database";
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

const fmt = (n: number) =>
  `R ${Number(n).toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const ITR12_CODES: Record<string, string> = {
  "Travel & Transport": "4011",
  "Home Office": "4018",
  "Equipment & Tools": "4022",
  "Software & Subscriptions": "4011",
  "Meals & Entertainment": "4011",
  "Professional Fees": "4011",
  "Telephone & Cell": "4011",
  "Marketing & Advertising": "4011",
  "Bank Charges": "4011",
  Insurance: "4011",
  Rent: "4011",
  "Repairs & Maintenance": "4011",
  Education: "4011",
  "Vehicle Expenses": "4020",
};

export default function ITR12ExportPreviewScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"summary" | "detail">("summary");
  const [profile, setProfile] = useState<any>(null);
  const [breakdown, setBreakdown] = useState<Record<string, number>>({});
  const [totalDeductions, setTotalDeductions] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [prof, byCategory, totals] = await Promise.all([
        profileService.getProfile(user.id),
        expenseService.getByCategory(user.id, ACTIVE_TAX_YEAR),
        expenseService.getTotals(user.id, ACTIVE_TAX_YEAR),
      ]);
      setProfile(prof);
      setBreakdown(
        Object.fromEntries(
          Object.entries(byCategory).filter(
            ([k]) => k !== "Personal / Non-deductible",
          ),
        ),
      );
      setTotalDeductions(totals.totalDeductions);
    } catch (e) {
      console.error("ITR12Preview load error:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const deductionRows = Object.entries(breakdown).sort(([, a], [, b]) => b - a);
  const estTaxSaving = Math.round(totalDeductions * 0.31);
  const initials = (profile?.full_name ?? "??")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleShare = async () => {
    setSharing(true);
    try {
      const lines = [
        "═══════════════════════════════════════",
        "     MYEXPENSE — ITR12 EXPORT PREVIEW   ",
        "═══════════════════════════════════════",
        "",
        `Taxpayer:        ${profile?.full_name ?? "—"}`,
        `Tax Number:      ${profile?.tax_number ?? "—"}`,
        `Tax Year:        ${ACTIVE_TAX_YEAR}`,
        `Return Type:     ITR12`,
        `Work Type:       ${profile?.work_type ?? "Sole Proprietor"}`,
        "",
        "SECTION 11 DEDUCTIONS",
        "─────────────────────",
        ...deductionRows.map(([cat, amt]) => `${cat.padEnd(30)} ${fmt(amt)}`),
        "─────────────────────",
        `${"TOTAL DEDUCTIONS".padEnd(30)} ${fmt(totalDeductions)}`,
        "",
        `EST. TAX SAVING (31%):         ${fmt(estTaxSaving)}`,
        "",
        "⚠️  For reference only. Submit via SARS eFiling.",
        `Generated: ${new Date().toLocaleDateString("en-ZA")}`,
      ].join("\n");
      await Share.share({
        message: lines,
        title: `MyExpense ITR12 Preview ${ACTIVE_TAX_YEAR}`,
      });
    } catch (e) {
      Alert.alert("Share failed", "Could not share the export.");
    } finally {
      setSharing(false);
    }
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.background }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />
      <MXHeader
        title="Export Preview"
        subtitle={`Tax Year ${ACTIVE_TAX_YEAR} · ITR12 Format`}
        showBack
        backLabel="Export Setup"
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
        <View
          style={{
            paddingHorizontal: space.md,
            paddingTop: space.lg,
            marginBottom: space.md,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              backgroundColor: colour.surface2,
              borderRadius: 10,
              padding: 3,
            }}
          >
            {(["summary", "detail"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor:
                    activeTab === tab ? colour.primary : "transparent",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color:
                      activeTab === tab ? colour.onPrimary : colour.textSub,
                  }}
                >
                  {tab === "summary" ? "Summary" : "Line Items"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loading ? (
          <View style={{ alignItems: "center", paddingTop: space["4xl"] }}>
            <ActivityIndicator color={colour.primary} size="large" />
          </View>
        ) : activeTab === "summary" ? (
          <>
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
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: colour.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Text
                    style={{
                      color: colour.onPrimary,
                      fontSize: 16,
                      fontWeight: "800",
                    }}
                  >
                    {initials}
                  </Text>
                </View>
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: colour.text,
                    }}
                  >
                    {profile?.full_name ?? "—"}
                  </Text>
                  <Text style={{ fontSize: 12, color: colour.textSub }}>
                    Tax No: {profile?.tax_number ?? "Not set"}
                  </Text>
                </View>
              </View>
              {[
                { label: "Income Tax Return", value: "ITR12" },
                { label: "Tax Period", value: "1 Mar 2024 – 28 Feb 2025" },
                {
                  label: "Employment Type",
                  value: profile?.work_type ?? "Sole Proprietor",
                },
              ].map((r, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <Text style={{ fontSize: 12, color: colour.textSub }}>
                    {r.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: colour.text,
                    }}
                  >
                    {r.value}
                  </Text>
                </View>
              ))}
            </View>

            <View
              style={{
                marginHorizontal: space.md,
                backgroundColor: colour.primary,
                borderRadius: radius.md,
                padding: 20,
                marginBottom: space.sm,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: colour.primary100,
                  fontSize: 12,
                  marginBottom: 6,
                }}
              >
                Total Section 11 Deductions
              </Text>
              <Text
                style={{
                  color: colour.onPrimary,
                  fontSize: 34,
                  fontWeight: "900",
                }}
              >
                {fmt(totalDeductions)}
              </Text>
              <Text
                style={{
                  color: colour.accent,
                  fontSize: 13,
                  marginTop: 6,
                  fontWeight: "600",
                }}
              >
                Est. Tax Saving: {fmt(estTaxSaving)}
              </Text>
            </View>

            <View
              style={{
                marginHorizontal: space.md,
                backgroundColor: colour.white,
                borderRadius: radius.md,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: colour.borderLight,
                marginBottom: space.md,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: colour.surface1,
                  paddingVertical: 10,
                  paddingHorizontal: space.md,
                }}
              >
                <Text
                  style={{
                    flex: 2,
                    fontSize: 10,
                    fontWeight: "700",
                    color: colour.textHint,
                  }}
                >
                  CATEGORY
                </Text>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 10,
                    fontWeight: "700",
                    color: colour.textHint,
                    textAlign: "center",
                  }}
                >
                  ITR12
                </Text>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 10,
                    fontWeight: "700",
                    color: colour.textHint,
                    textAlign: "right",
                  }}
                >
                  AMOUNT
                </Text>
              </View>
              {deductionRows.length === 0 ? (
                <View style={{ padding: space.xl, alignItems: "center" }}>
                  <Text style={{ fontSize: 12, color: colour.textSub }}>
                    No deductible expenses found
                  </Text>
                </View>
              ) : (
                <>
                  {deductionRows.map(([cat, amt], i) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: space.md,
                        paddingVertical: 11,
                        borderTopWidth: 1,
                        borderTopColor: colour.borderLight,
                      }}
                    >
                      <Text
                        style={{ flex: 2, fontSize: 12, color: colour.text }}
                      >
                        {cat}
                      </Text>
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 11,
                          color: colour.textSub,
                          textAlign: "center",
                        }}
                      >
                        {ITR12_CODES[cat] ?? "4011"}
                      </Text>
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 12,
                          fontWeight: "700",
                          color: colour.primary,
                          textAlign: "right",
                        }}
                      >
                        {fmt(amt)}
                      </Text>
                    </View>
                  ))}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: space.md,
                      paddingVertical: 12,
                      borderTopWidth: 2,
                      borderTopColor: colour.primary,
                      backgroundColor: colour.primary50,
                    }}
                  >
                    <Text
                      style={{
                        flex: 2,
                        fontSize: 13,
                        fontWeight: "800",
                        color: colour.text,
                      }}
                    >
                      Total
                    </Text>
                    <Text style={{ flex: 1 }} />
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 13,
                        fontWeight: "900",
                        color: colour.primary,
                        textAlign: "right",
                      }}
                    >
                      {fmt(totalDeductions)}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </>
        ) : (
          <View style={{ marginHorizontal: space.md }}>
            {deductionRows.map(([cat, amt], ci) => (
              <View
                key={ci}
                style={{
                  backgroundColor: colour.white,
                  borderRadius: radius.md,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: colour.borderLight,
                  marginBottom: space.sm,
                }}
              >
                <View
                  style={{
                    backgroundColor: colour.primary,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      color: colour.onPrimary,
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    {cat}
                  </Text>
                  <Text
                    style={{
                      color: colour.accent,
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    {fmt(amt)}
                  </Text>
                </View>
                <View style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
                  <Text style={{ fontSize: 11, color: colour.textSub }}>
                    ITR12 Code {ITR12_CODES[cat] ?? "4011"} · Section 11(a)
                  </Text>
                  <View
                    style={{
                      height: 4,
                      backgroundColor: colour.surface2,
                      borderRadius: 2,
                      marginTop: 8,
                    }}
                  >
                    <View
                      style={{
                        width: `${totalDeductions > 0 ? (amt / totalDeductions) * 100 : 0}%`,
                        height: 4,
                        backgroundColor: colour.accent,
                        borderRadius: 2,
                      }}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 10,
                      color: colour.textSub,
                      marginTop: 4,
                    }}
                  >
                    {totalDeductions > 0
                      ? ((amt / totalDeductions) * 100).toFixed(1)
                      : 0}
                    % of total deductions
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          disabled={pdfLoading}
          onPress={async () => {
            if (!user) return;
            setPdfLoading(true);
            try {
              await generateITR12PDF({
                userId: user.id,
                taxYear: ACTIVE_TAX_YEAR,
              });
            } catch (e: any) {
              Alert.alert(
                "PDF failed",
                e?.message ?? "Could not generate PDF.",
              );
            } finally {
              setPdfLoading(false);
            }
          }}
          style={{
            marginHorizontal: space.md,
            backgroundColor: pdfLoading ? colour.border : colour.accent,
            borderRadius: radius.md,
            padding: space.md,
            alignItems: "center",
            marginBottom: space.sm,
          }}
        >
          {pdfLoading ? (
            <ActivityIndicator color={colour.white} />
          ) : (
            <Text
              style={{ color: colour.white, fontSize: 15, fontWeight: "700" }}
            >
              Generate PDF Report
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleShare}
          disabled={sharing}
          style={{
            marginHorizontal: space.md,
            borderWidth: 2,
            borderColor: colour.primary,
            borderRadius: radius.md,
            padding: 14,
            alignItems: "center",
            marginBottom: space.sm,
          }}
        >
          {sharing ? (
            <ActivityIndicator color={colour.primary} />
          ) : (
            <Text
              style={{ color: colour.primary, fontSize: 15, fontWeight: "700" }}
            >
              Share as Text
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/itr12-efiling-guide" as any)}
          style={{
            marginHorizontal: space.md,
            backgroundColor: colour.successBg,
            borderRadius: radius.md,
            padding: 14,
            alignItems: "center",
            marginBottom: space.sm,
            flexDirection: "row",
            justifyContent: "center",
            gap: space.sm,
          }}
        >
          <IconSymbol name="doc.text.fill" size={18} color={colour.success} />
          <Text
            style={{ color: colour.success, fontSize: 15, fontWeight: "700" }}
          >
            eFiling Submission Guide
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ alignItems: "center", paddingVertical: 8 }}
        >
          <Text style={{ color: colour.textSub, fontSize: 13 }}>
            ← Back to setup
          </Text>
        </TouchableOpacity>
      </ScrollView>
      <MXTabBar />
    </SafeAreaView>
  );
}
