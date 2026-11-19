import { showNotice } from "@/components/NoticeHost";
import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  assessmentPeriod,
  buildExpenditure,
  buildIncome,
  businessResult,
  yearOfAssessment,
  type BusinessResult,
  type ExpenditureSummary,
} from "@/lib/itr12Summary";
import { expenseService } from "@/services/expenseService";
import { incomeService } from "@/services/incomeService";
import { generateITR12PDF } from "@/services/pdfExportService";
import { profileService } from "@/services/profileService";
import { taxLiabilityService } from "@/services/taxLiabilityService";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
import { ACTIVE_TAX_YEAR, TaxLiabilityEstimate } from "@/types/database";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useAppForeground } from "@/hooks/use-app-foreground";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { safeBack } from "@/lib/navigation";
import { workTypeLabel } from "@/lib/workType";

// Whole rands, as eFiling takes them.
const fmt = (n: number) =>
  `R ${Math.round(Number(n)).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;

// Field names, order and totals come from lib/itr12Summary.ts, the same rules
// as the PDF, so the preview and the PDF always agree.

export default function ITR12ExportPreviewScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  // Tax year selected on the Export setup screen — falls back to the current
  // tax year only if this screen was somehow reached without that param, so
  // it never silently previews/exports a different year than the one the
  // user configured (previously always used ACTIVE_TAX_YEAR regardless).
  const { taxYear: taxYearParam } = useLocalSearchParams<{ taxYear?: string }>();
  const taxYear = taxYearParam || ACTIVE_TAX_YEAR;
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"summary" | "detail">("summary");
  const [profile, setProfile] = useState<any>(null);
  const [expenditure, setExpenditure] = useState<ExpenditureSummary | null>(null);
  const [result, setResult] = useState<BusinessResult | null>(null);
  const [taxLiability, setTaxLiability] = useState<TaxLiabilityEstimate | null>(null);
  const [sharing, setSharing] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  // "Home office setup: 10% of R 120 000 annual rent" when that's the claim.
  const [homeOfficeSetupLabel, setHomeOfficeSetupLabel] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const prof = await profileService.getProfile(user.id);
      const vatRegistered = prof?.vat_registered ?? false;
      const [expenses, incomeEntries, liabilityEstimate, setupClaim] = await Promise.all([
        expenseService.getExpenses(user.id, taxYear),
        incomeService.getIncome(user.id, taxYear),
        taxLiabilityService.getEstimate(user.id, taxYear).catch(() => null),
        expenseService.getHomeOfficeSetupClaim(user.id, taxYear).catch(() => null),
      ]);
      const exp = buildExpenditure(expenses, vatRegistered, setupClaim?.amount ?? 0);
      setProfile(prof);
      setExpenditure(exp);
      setResult(businessResult(buildIncome(incomeEntries), exp));
      setHomeOfficeSetupLabel(setupClaim?.description ?? null);
      setTaxLiability(liabilityEstimate);
    } catch (e) {
      console.error("ITR12Preview load error:", e);
    } finally {
      setLoading(false);
    }
  }, [user, taxYear]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );
  useAppForeground(loadData);

  const fieldRows = expenditure?.rows ?? [];
  const totalRands = expenditure?.totalRands ?? 0;
  const yoa = yearOfAssessment(taxYear);
  const detailText = (cats: ExpenditureSummary["rows"][number]["categories"]) =>
    cats.map((c) => (c.fromSetup ? `${c.category} (setup)` : c.category)).join(", ");
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
        "MyExpense ITR12 preparation summary",
        `Year of Assessment ${yoa} (${assessmentPeriod(taxYear)})`,
        "",
        `Taxpayer:      ${profile?.full_name || "—"}`,
        `Taxpayer Ref:  ${profile?.tax_number || "—"}`,
        `Work type:     ${workTypeLabel(profile?.work_type)}`,
        `VAT:           ${profile?.vat_registered ? `Registered${profile?.vat_number ? ` (${profile.vat_number})` : ""}` : "Not registered"}`,
        "",
        "Local Business, Trade and Professional Income",
        "Whole rands, as eFiling asks",
        "",
        `Turnover / Sales               ${fmt(result?.turnoverRands ?? 0)}`,
        `Gross Profit                   ${fmt(result?.grossProfitRands ?? 0)}`,
        "",
        profile?.vat_registered ? "Expenditure (excluding VAT you claim back)" : "Expenditure",
        ...fieldRows.map((r) => `${r.field.padEnd(30)} ${fmt(r.rands)}`),
        ...(expenditure?.otherDescription ? [`Description relating to other: ${expenditure.otherDescription}`] : []),
        ...(homeOfficeSetupLabel ? [`(${homeOfficeSetupLabel})`] : []),
        `${"Total".padEnd(30)} ${fmt(totalRands)}`,
        "",
        `${((result?.accountingRands ?? 0) >= 0 ? "Accounting Profit" : "Accounting Loss").padEnd(30)} ${fmt(Math.abs(result?.accountingRands ?? 0))}`,
        ...((result?.recoupmentRands ?? 0) > 0 ? [`${"Add Back – Recoupment".padEnd(30)} ${fmt(result!.recoupmentRands)}`] : []),
        `${((result?.taxableRands ?? 0) >= 0 ? "Taxable Profit" : "Taxable Loss").padEnd(30)} ${fmt(Math.abs(result?.taxableRands ?? 0))}`,
        ...((expenditure?.retirementAnnuity.amount ?? 0) > 0
          ? ["", `Retirement annuity contributions (4006): ${fmt(expenditure!.retirementAnnuity.amount)}`]
          : []),
        ...(taxLiability
          ? ["", `${taxLiability.final_liability > 0 ? "Estimated amount owing to SARS" : "Estimated refund"}: ${fmt(Math.abs(taxLiability.final_liability))}`]
          : []),
        "",
        "Not a SARS document. Check each figure before you file on eFiling.",
        `Generated: ${new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}`,
      ].join("\n");
      await Share.share({
        message: lines,
        title: `MyExpense ITR12 Preview ${taxYear}`,
      });
    } catch {
      showNotice({ title: "Couldn't share this", message: "Please try again." });
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
        title="Export preview"
        subtitle={`Year of Assessment ${yoa} · ITR12`}
        showBack
        backLabel="Export setup"
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
                  {tab === "summary" ? "Summary" : "By field"}
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
                    Taxpayer Ref: {profile?.tax_number || "Not added yet"}
                  </Text>
                </View>
              </View>
              {[
                { label: "Return", value: "ITR12" },
                { label: "Year of Assessment", value: `${yoa} (${assessmentPeriod(taxYear)})` },
                { label: "Turnover / Sales", value: fmt(result?.turnoverRands ?? 0) },
                {
                  label: (result?.taxableRands ?? 0) >= 0 ? "Taxable Profit" : "Taxable Loss",
                  value: fmt(Math.abs(result?.taxableRands ?? 0)),
                },
                {
                  label: "Work type",
                  value: workTypeLabel(profile?.work_type),
                },
                {
                  label: "VAT",
                  value: profile?.vat_registered
                    ? `Registered${profile?.vat_number ? ` (${profile.vat_number})` : ""}`
                    : "Not registered",
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
                {profile?.vat_registered ? "Total expenditure to enter (excl. VAT)" : "Total expenditure to enter"}
              </Text>
              <Text
                style={{
                  color: colour.onPrimary,
                  fontSize: 34,
                  fontWeight: "900",
                }}
              >
                {fmt(totalRands)}
              </Text>
              {taxLiability && (
                <Text
                  style={{
                    color: colour.accent,
                    fontSize: 13,
                    marginTop: 6,
                    fontWeight: "600",
                  }}
                >
                  {taxLiability.final_liability > 0
                    ? `Estimated amount owing to SARS: ${fmt(Math.abs(taxLiability.final_liability))}`
                    : `Estimated refund: ${fmt(Math.abs(taxLiability.final_liability))}`}
                </Text>
              )}
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
                  ITR12 field
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
                  Enter in eFiling
                </Text>
              </View>
              {fieldRows.length === 0 ? (
                <View style={{ padding: space.xl, alignItems: "center" }}>
                  <Text style={{ fontSize: 12, color: colour.textSub }}>
                    No deductible expenses found
                  </Text>
                </View>
              ) : (
                <>
                  {fieldRows.map((r) => (
                    <View
                      key={r.field}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: space.md,
                        paddingVertical: 11,
                        borderTopWidth: 1,
                        borderTopColor: colour.borderLight,
                      }}
                    >
                      <View style={{ flex: 2 }}>
                        <Text style={{ fontSize: 12, fontWeight: "600", color: colour.text }}>
                          {r.field}
                        </Text>
                        <Text style={{ ...typography.bodyXS, color: colour.textSub, marginTop: 2 }}>
                          {detailText(r.categories)}
                        </Text>
                        {r.field === "Other" && expenditure?.otherDescription && (
                          <Text style={{ ...typography.bodyXS, color: colour.textMid, marginTop: 2 }}>
                            Description relating to other: {expenditure.otherDescription}
                          </Text>
                        )}
                        {r.field === "Rental Paid" && homeOfficeSetupLabel && (
                          <Text style={{ ...typography.bodyXS, color: colour.textSub, marginTop: 2 }}>
                            {homeOfficeSetupLabel}
                          </Text>
                        )}
                      </View>
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 12,
                          fontWeight: "700",
                          color: colour.primary,
                          textAlign: "right",
                        }}
                      >
                        {fmt(r.rands)}
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
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 13,
                        fontWeight: "900",
                        color: colour.primary,
                        textAlign: "right",
                      }}
                    >
                      {fmt(totalRands)}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </>
        ) : (
          <View style={{ marginHorizontal: space.md }}>
            {fieldRows.map((r) => (
              <View
                key={r.field}
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
                    {r.field}
                  </Text>
                  <Text
                    style={{
                      color: colour.accent,
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    {fmt(r.rands)}
                  </Text>
                </View>
                <View style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
                  {r.categories.map((c) => (
                    <View key={`${c.category}${c.fromSetup ? "-setup" : ""}`} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                      <Text style={{ fontSize: 11, color: colour.textSub, flex: 1 }}>
                        {c.category} · {c.fromSetup ? "from setup" : `${c.count} ${c.count === 1 ? "item" : "items"}`}
                      </Text>
                      <Text style={{ fontSize: 11, color: colour.textSub }}>{fmt(c.amount)}</Text>
                    </View>
                  ))}
                  {r.field === "Other" && expenditure?.otherDescription && (
                    <Text style={{ ...typography.bodyXS, color: colour.textMid, marginTop: 2 }}>
                      Description relating to other: {expenditure.otherDescription}
                    </Text>
                  )}
                  {r.field === "Rental Paid" && homeOfficeSetupLabel && (
                    <Text style={{ ...typography.bodyXS, color: colour.textSub, marginTop: 2 }}>
                      {homeOfficeSetupLabel}
                    </Text>
                  )}
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
                        width: `${totalRands > 0 ? (r.rands / totalRands) * 100 : 0}%`,
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
                    {totalRands > 0 ? ((r.rands / totalRands) * 100).toFixed(1) : 0}% of total expenditure
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
                taxYear,
              });
            } catch {
              showNotice({ title: "Couldn't make the PDF", message: "Please try again." });
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
              Make PDF summary
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
              Share as text
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/itr12-efiling-guide" as any)}
          style={{
            marginHorizontal: space.md,
            backgroundColor: colour.primary50,
            borderRadius: radius.md,
            padding: 14,
            alignItems: "center",
            marginBottom: space.sm,
            flexDirection: "row",
            justifyContent: "center",
            gap: space.sm,
          }}
        >
          <IconSymbol name="doc.text.fill" size={18} color={colour.accentDeep} />
          <Text
            style={{ color: colour.accentDeep, fontSize: 15, fontWeight: "700" }}
          >
            eFiling guide
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => safeBack(router)}
          style={{ alignItems: "center", paddingVertical: 8 }}
        >
          <Text style={{ color: colour.textSub, fontSize: 13 }}>
            Back to setup
          </Text>
        </TouchableOpacity>
      </ScrollView>
      <MXTabBar />
    </SafeAreaView>
  );
}
