import { InfoBanner } from "@/components/InfoBanner";
import { SuccessModal } from "@/components/SuccessModal";
import { useNotice } from "@/components/useNotice";
import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { VAT_RATE } from "@/lib/taxRules";
import {
  claimableInputVat,
  countsTowardVatTurnover,
  VAT_COMPULSORY_THRESHOLD,
  VAT_VOLUNTARY_THRESHOLD,
  vatNeedsReview,
} from "@/lib/vat";
import { validateVATNumber } from "@/lib/validation";
import { expenseService } from "@/services/expenseService";
import { incomeService } from "@/services/incomeService";
import { profileService } from "@/services/profileService";
import { useAuthStore } from "@/stores/authStore";
import { useExpenseStore } from "@/stores/expenseStore";
import { colour, radius, space, typography } from "@/tokens";
import { useFocusEffect, useRouter } from "expo-router";
import { useAppForeground } from "@/hooks/use-app-foreground";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,

    ScrollView,
    Share,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const fmt = (n: number) =>
  `R ${Number(n).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function csvField(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n"))
    return `"${str.replace(/"/g, '""')}"`;
  return str;
}

// No "quarter" option: SARS VAT returns run in two-month periods (Category
// A/B), not calendar quarters, so a quarter total matched no real return.
type Period = "month" | "year";

export default function VATSummaryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { notice, showNotice } = useNotice();
  const [vatSaved, setVatSaved] = useState(false);
  const { activeTaxYear } = useExpenseStore();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [period, setPeriod] = useState<Period>("month");
  const [trailing12Revenue, setTrailing12Revenue] = useState(0);
  const [vatRegistered, setVatRegistered] = useState(false);
  const [vatNumber, setVatNumber] = useState("");
  const [savingVat, setSavingVat] = useState(false);

  // See lib/vat.ts for the source (R2.3 million from 1 April 2026).
  const VAT_THRESHOLD = VAT_COMPULSORY_THRESHOLD;
  const fmtRand = (n: number) => `R${Math.round(n).toLocaleString("en-ZA")}`;

  const loadData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const [data, allIncome, profile] = await Promise.all([
        expenseService.getExpenses(user.id, activeTaxYear),
        incomeService.getIncome(user.id),
        profileService.getProfile(user.id),
      ]);
      setExpenses(data.filter((e) => e.vat_amount && Number(e.vat_amount) > 0));
      setVatRegistered(profile?.vat_registered ?? false);
      setVatNumber(profile?.vat_number ?? "");

      // Rolling 12-month business turnover for the VAT threshold. Salary and
      // other employment income aren't business turnover (VAT 404), and nor
      // is the app's automatic vehicle-sale row.
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 1);
      const cutoffStr = cutoff.toISOString().split("T")[0];
      const trailing = allIncome
        .filter((e) => e.date >= cutoffStr && countsTowardVatTurnover(e))
        .reduce((s, e) => s + Number(e.amount), 0);
      setTrailing12Revenue(trailing);
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
  useAppForeground(loadData);

  const handleSaveVatRegistration = async () => {
    if (!user) return;
    if (vatRegistered) {
      const vatError = validateVATNumber(vatNumber);
      if (vatError) {
        showNotice({ title: "Check your VAT number", message: vatError });
        return;
      }
    }
    setSavingVat(true);
    try {
      await profileService.updateProfile(user.id, {
        vat_registered: vatRegistered,
        vat_number: vatRegistered ? vatNumber.trim() : null,
      });
      setVatSaved(true);
    } catch {
      showNotice({
        title: "Couldn't save your VAT details",
        message: "Please check your internet connection and try again.",
      });
    } finally {
      setSavingVat(false);
    }
  };

  const now = new Date();
  const filtered = expenses.filter((e) => {
    const d = new Date(e.expense_date);
    if (period === "month")
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    return true;
  });

  const totalVAT = filtered.reduce((s, e) => s + Number(e.vat_amount), 0);
  // Input tax can only be claimed back from SARS by a registered VAT vendor —
  // an unregistered user's VAT is just a cost, regardless of is_deductible.
  // Only the business share counts, and never entertainment (lib/vat.ts).
  const entryClaimable = (e: any) => (vatRegistered ? claimableInputVat(e) : 0);
  const claimableVAT = filtered.reduce((s, e) => s + entryClaimable(e), 0);
  const nonClaimable = totalVAT - claimableVAT;
  const isEntryClaimable = (e: any) => entryClaimable(e) > 0;
  // Older partly-business entries whose share wasn't saved (lib/vat.ts).
  const reviewCount = vatRegistered ? filtered.filter(vatNeedsReview).length : 0;

  const handleExport = async () => {
    try {
      const periodLabel =
        period === "month"
          ? now.toLocaleDateString("en-ZA", { month: "long", year: "numeric" })
          : `Tax year ${activeTaxYear}`;

      const header = [
        "Vendor", "Date", "Amount (ZAR)", "VAT paid (ZAR)", "VAT you can claim (ZAR)", "Category", "Check",
      ].join(",");

      const rows = filtered.map((e) =>
        [
          csvField(e.vendor),
          csvField(e.expense_date),
          csvField(Number(e.amount).toFixed(2)),
          csvField(Number(e.vat_amount).toFixed(2)),
          csvField(entryClaimable(e).toFixed(2)),
          csvField(e.category),
          csvField(vatRegistered && vatNeedsReview(e) ? "Saved before work-share was recorded: check the VAT" : ""),
        ].join(","),
      );

      const lines = [
        "MyExpense VAT Report",
        `Tax Year: ${activeTaxYear}`,
        `Period: ${periodLabel}`,
        `Generated: ${now.toLocaleDateString("en-ZA")}`,
        vatRegistered
          ? `VAT vendor status: Registered${vatNumber ? ` (${vatNumber})` : ""}`
          : "VAT vendor status: Not registered. The VAT below is a cost, not something you can claim back.",
        "",
        header,
        ...rows,
        "",
        `Total VAT paid,${fmt(totalVAT)}`,
        `VAT you can claim back,${fmt(claimableVAT)}`,
        `VAT you can't claim back,${fmt(nonClaimable)}`,
      ].join("\n");

      await Share.share({ message: lines, title: "VAT Report" });
    } catch {
      showNotice({ title: "Couldn't export your VAT report", message: "Please try again." });
    }
  };

  const periods: { key: Period; label: string }[] = [
    { key: "month", label: "This month" },
    { key: "year", label: "Tax year" },
  ];

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.background }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />
      <MXHeader
        title="VAT summary"
        subtitle={
          vatRegistered
            ? `VAT at ${(VAT_RATE * 100).toFixed(0)}% · Registered vendor${vatNumber ? ` · ${vatNumber}` : ""}`
            : `VAT at ${(VAT_RATE * 100).toFixed(0)}% · Not registered`
        }
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
        {/* ── VAT registration ──────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: colour.white,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colour.borderLight,
            padding: space.md,
            marginBottom: space.xl,
          }}
        >
          <Text
            style={{
              ...typography.captionM,
              color: colour.textHint,
              letterSpacing: 0.5,
              marginBottom: space.sm,
            }}
          >
            VAT registered vendor
          </Text>
          <View style={{ flexDirection: "row", gap: space.sm }}>
            {[
              { label: "Not registered", value: false },
              { label: "Yes — registered", value: true },
            ].map((opt) => (
              <TouchableOpacity
                key={String(opt.value)}
                onPress={() => setVatRegistered(opt.value)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: radius.md,
                  borderWidth: 1.5,
                  borderColor: vatRegistered === opt.value ? colour.primary : colour.borderLight,
                  backgroundColor: vatRegistered === opt.value ? colour.primary50 : colour.white,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: vatRegistered === opt.value ? colour.accentDeep : colour.textSub,
                  }}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {vatRegistered && (
            <View style={{ marginTop: space.md }}>
              <Text style={{ ...typography.captionM, color: colour.textHint, letterSpacing: 0.5, marginBottom: 4 }}>
                VAT registration number
              </Text>
              <TextInput
                value={vatNumber}
                onChangeText={setVatNumber}
                placeholder="e.g. 4123456789"
                placeholderTextColor={colour.textHint}
                keyboardType="numeric"
                maxLength={10}
                style={{ ...typography.bodyM, color: colour.text, paddingVertical: 4 }}
              />
              <Text style={{ fontSize: 11, color: colour.textSub, marginTop: 4 }}>
                10 digits, starting with 4 — as issued by SARS
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleSaveVatRegistration}
            disabled={savingVat}
            style={{
              marginTop: space.md,
              height: 44,
              borderRadius: radius.pill,
              backgroundColor: colour.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {savingVat ? (
              <ActivityIndicator color={colour.onPrimary} size="small" />
            ) : (
              <Text style={{ ...typography.btnM, color: colour.onPrimary }}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── VAT threshold tracker ─────────────────────────────────── */}
        {(() => {
          const pct = Math.min(trailing12Revenue / VAT_THRESHOLD, 1);
          const pctDisplay = Math.round((trailing12Revenue / VAT_THRESHOLD) * 100);
          const barColour =
            pctDisplay >= 95 ? colour.danger
            : pctDisplay >= 80 ? colour.warning
            : colour.brandTeal;
          const bgColour =
            pctDisplay >= 95 ? colour.dangerBg
            : pctDisplay >= 80 ? colour.warning + "38"
            : colour.brandTeal + "38";
          const remaining = VAT_THRESHOLD - trailing12Revenue;

          return (
            <View
              style={{
                backgroundColor: colour.noir,
                borderRadius: radius.md,
                padding: space.md,
                marginBottom: space.xl,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colour.onNoir2, letterSpacing: 0.6 }}>
                  WHEN YOU MUST REGISTER FOR VAT
                </Text>
                <View style={{ backgroundColor: bgColour, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: barColour }}>
                    {pctDisplay}%
                  </Text>
                </View>
              </View>

              <Text style={{ fontSize: 22, fontWeight: "800", color: colour.onNoir, letterSpacing: -0.5, marginBottom: 2 }}>
                {`R ${Math.round(trailing12Revenue).toLocaleString("en-ZA")}`}
              </Text>
              <Text style={{ fontSize: 11, color: colour.onNoir2, marginBottom: space.md }}>
                {`business income in the last 12 months, out of ${fmtRand(VAT_THRESHOLD)}`}
              </Text>

              <View style={{ height: 8, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 4, marginBottom: 8 }}>
                <View
                  style={{
                    width: `${pct * 100}%`,
                    height: 8,
                    backgroundColor: barColour,
                    borderRadius: 4,
                  }}
                />
              </View>

              <Text style={{ fontSize: 11, color: colour.onNoir2 }}>
                {trailing12Revenue >= VAT_THRESHOLD
                  ? `You're ${fmtRand(trailing12Revenue - VAT_THRESHOLD)} over the limit, so you must register for VAT.`
                  : pctDisplay >= 80
                    ? `${fmtRand(remaining)} to go before you must register for VAT. You're getting close.`
                    : `${fmtRand(remaining)} to go before you must register for VAT.`}
              </Text>
              <Text style={{ fontSize: 10, color: colour.onNoir2, marginTop: 4, opacity: 0.8 }}>
                Salary from a job doesn't count towards this.
              </Text>
            </View>
          );
        })()}

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
                  backgroundColor: colour.white,
                  borderRadius: radius.md,
                  padding: space.md,
                  borderLeftWidth: 3,
                  borderLeftColor: colour.brandTeal,
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
                    color: colour.accentDeep,
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
                  backgroundColor: colour.warning + "38",
                  borderRadius: radius.md,
                  padding: space.md,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: space.xl,
                }}
              >
                <View>
                  <Text style={{ ...typography.labelM, color: colour.text }}>
                    VAT you can't claim back
                  </Text>
                  <Text
                    style={{ ...typography.caption, color: colour.text }}
                  >
                    Personal costs, the personal part of mixed costs, and entertainment
                  </Text>
                </View>
                <Text style={{ ...typography.amountS, color: colour.text }}>
                  {fmt(nonClaimable)}
                </Text>
              </View>
            )}

            {vatRegistered ? (
              <InfoBanner
                icon="checkmark.seal.fill"
                title="Registered VAT vendor"
                body={`You can claim back the VAT on your work costs. For costs that are partly personal (like your phone or car), you can only claim the work part. You can never claim VAT on entertainment or on buying a car.${vatNumber ? ` VAT number: ${vatNumber}.` : ""}`}
                style={{ marginBottom: space.xl }}
              />
            ) : (
              <InfoBanner
                icon="percent"
                title="Not VAT registered"
                body={`You can't claim back any of this VAT until you're registered. It's shown as a cost, not a refund. You can choose to register once your business income is over ${fmtRand(VAT_VOLUNTARY_THRESHOLD)} a year, and you must register once it's over ${fmtRand(VAT_COMPULSORY_THRESHOLD)}. Change your status above once you're registered.`}
                style={{ marginBottom: space.xl }}
              />
            )}

            {reviewCount > 0 && (
              <InfoBanner
                icon="exclamationmark.triangle.fill"
                title={`Check ${reviewCount} older entr${reviewCount === 1 ? "y" : "ies"}`}
                body="These were saved before MyExpense kept track of the work part of mixed costs, like a phone or car. We're showing all of their VAT as claimable, but you can only claim the work part. Check them before you do your VAT return."
                style={{ marginBottom: space.xl }}
              />
            )}

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
                    {isEntryClaimable(entry) && entryClaimable(entry) < Number(entry.vat_amount) - 0.005 && (
                      <Text style={{ ...typography.micro, color: colour.textSecondary }}>
                        claim {fmt(entryClaimable(entry))}
                      </Text>
                    )}
                    <View
                      style={{
                        backgroundColor: isEntryClaimable(entry)
                          ? colour.brandTeal + "2E"
                          : colour.dangerBg,
                        borderRadius: radius.full,
                        paddingHorizontal: space.xs,
                        paddingVertical: 2,
                        marginTop: 2,
                      }}
                    >
                      <Text
                        style={{
                          ...typography.micro,
                          color: isEntryClaimable(entry)
                            ? colour.text
                            : colour.danger,
                          fontWeight: "600",
                        }}
                      >
                        {vatRegistered && vatNeedsReview(entry)
                          ? "Check this"
                          : isEntryClaimable(entry)
                            ? "You can claim"
                            : "Can't claim"}
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

      {notice}
      <SuccessModal
        visible={vatSaved}
        title="VAT details saved"
        message={vatRegistered ? "We'll now show the VAT you can claim back." : "We'll treat the VAT you pay as a cost."}
        primaryLabel="Done"
        onPrimary={() => setVatSaved(false)}
      />
    </SafeAreaView>
  );
}
