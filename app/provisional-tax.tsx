import { InfoBanner } from "@/components/InfoBanner";
import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getCurrentTaxYear, taxDataForYear } from "@/lib/taxRules";
import { incomeService } from "@/services/incomeService";
import { useAuthStore } from "@/stores/authStore";
import { useExpenseStore } from "@/stores/expenseStore";
import { irp5TotalPAYE, useIRP5Store } from "@/stores/irp5Store";
import { colour, radius, space } from "@/tokens";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const fmt = (n: number) =>
  `R ${Math.round(n).toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

// SARS individual tax table for a given tax year — brackets and primary
// rebate looked up from lib/taxRules.ts (single source of truth, updated by
// hand each Budget Speech) instead of a hardcoded duplicate. This screen
// previously always used the 2025/26 figures regardless of the active tax
// year, understating what's owed once brackets moved for 2026/27.
function computeTax(taxableIncome: number, taxYear: string): number {
  if (taxableIncome <= 0) return 0;
  const { brackets, rebates } = taxDataForYear(taxYear);
  let tax = 0;
  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i];
    if (taxableIncome <= bracket.limit) {
      const lowerLimit = i === 0 ? 0 : brackets[i - 1].limit;
      tax = bracket.base + (taxableIncome - lowerLimit) * bracket.rate;
      break;
    }
  }
  return Math.max(0, Math.round(tax - rebates.primary));
}

// ── Upcoming provisional deadlines ────────────────────────────────────────────
interface Deadline {
  key: string;
  label: string;
  dateStr: string;
  isoDate: string;
  desc: string;
}

// Local-calendar ISO formatter — deliberately not Date.toISOString(), which
// converts to UTC and would shift a SAST (UTC+2) midnight date back a day.
const toIsoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fmtDeadlineDate = (d: Date) =>
  d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
const lastDayOfFeb = (year: number) => new Date(year, 2, 0); // day 0 of March = leap-safe last day of Feb

// Provisional tax payment calendar for the REAL current tax year (derived
// from today's date via getCurrentTaxYear, not whichever year is selected
// in the tax-year picker — these are actionable payment dates, so they
// should always reflect what's actually due next, not a historical view).
// Previously 4 literal hardcoded dates covering only 2025/26-2026/27; once
// the last one (30 Sep 2027) passed, the list would have gone silently
// blank with nothing new ever appearing until a developer noticed and
// hand-edited it. Now rolls forward automatically every 1 March.
function buildDeadlines(): Deadline[] {
  const currentTaxYear = getCurrentTaxYear();
  const startYear = parseInt(currentTaxYear.split("/")[0], 10);
  const endYear = startYear + 1;
  const priorTaxYear = `${startYear - 1}/${String(startYear).slice(-2)}`;

  const entries: { key: string; label: string; date: Date; desc: string }[] = [
    {
      key: `${startYear - 1}${startYear}-topup`,
      label: `Pay any leftover tax — ${priorTaxYear}`,
      date: new Date(startYear, 8, 30), // 30 Sep
      desc: "Settle any remaining tax from last year to avoid a penalty",
    },
    {
      key: `${startYear}${endYear}-irp6-1`,
      label: `1st payment — ${currentTaxYear}`,
      date: new Date(startYear, 7, 31), // 31 Aug
      desc: "Pay at least half your estimated tax for the year",
    },
    {
      key: `${startYear}${endYear}-irp6-2`,
      label: `2nd payment — ${currentTaxYear}`,
      date: lastDayOfFeb(endYear),
      desc: "Pay the rest of your estimated tax for the year",
    },
    {
      key: `${startYear}${endYear}-topup`,
      label: `Pay any leftover tax — ${currentTaxYear}`,
      date: new Date(endYear, 8, 30), // 30 Sep
      desc: "Optional — top up if you underpaid to avoid interest charges",
    },
  ];

  const lines: Deadline[] = entries.map((e) => ({
    key: e.key,
    label: e.label,
    dateStr: fmtDeadlineDate(e.date),
    isoDate: toIsoDate(e.date),
    desc: e.desc,
  }));
  // Sort chronologically
  return lines.sort((a, b) => a.isoDate.localeCompare(b.isoDate));
}

function DeadlineRow({
  deadline,
  isPast,
  isNext,
}: {
  deadline: Deadline;
  isPast: boolean;
  isNext: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        paddingVertical: space.md,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.07)",
        gap: space.md,
      }}
    >
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: isPast
            ? "rgba(255,255,255,0.07)"
            : isNext
              ? colour.primary
              : "rgba(255,255,255,0.12)",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 2,
          flexShrink: 0,
        }}
      >
        <IconSymbol
          name={isPast ? "checkmark" : "calendar"}
          size={13}
          color={
            isPast ? "rgba(255,255,255,0.3)" : colour.white
          }
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 12.5,
            fontWeight: "700",
            color: isPast ? colour.onNoir2 : colour.onNoir,
          }}
        >
          {deadline.label}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: isPast ? colour.onNoir2 : colour.primary,
            fontWeight: "600",
            marginTop: 1,
          }}
        >
          {deadline.dateStr}
        </Text>
        <Text style={{ fontSize: 11, color: colour.onNoir2, marginTop: 2 }}>
          {deadline.desc}
        </Text>
      </View>
      {isNext && (
        <View
          style={{
            backgroundColor: colour.primary,
            borderRadius: radius.pill,
            paddingHorizontal: 8,
            paddingVertical: 3,
            marginTop: 2,
          }}
        >
          <Text style={{ fontSize: 9, fontWeight: "700", color: colour.white }}>
            NEXT
          </Text>
        </View>
      )}
    </View>
  );
}

// ── Eligibility check row ──────────────────────────────────────────────────────
function CheckRow({ label, value, pass }: { label: string; value: string; pass: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colour.borderLight,
        gap: space.sm,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: pass ? colour.successBg : colour.dangerBg,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <IconSymbol
          name={pass ? "checkmark" : "xmark"}
          size={10}
          color={pass ? colour.success : colour.danger}
        />
      </View>
      <Text style={{ flex: 1, fontSize: 13, color: colour.text }}>{label}</Text>
      <Text style={{ fontSize: 12, fontWeight: "700", color: colour.textSub }}>
        {value}
      </Text>
    </View>
  );
}

const THRESHOLD = 30_000;

export default function ProvisionalTaxScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeTaxYear, totals } = useExpenseStore();
  const { entries, load: loadIRP5 } = useIRP5Store();

  const [totalIncome, setTotalIncome] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIRP5();
  }, []);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    incomeService.getIncome(user.id, activeTaxYear).then((all) => {
      const total = all.reduce((s, e) => s + Number(e.amount), 0);
      setTotalIncome(total);
    }).catch(console.warn).finally(() => setLoading(false));
  }, [user?.id, activeTaxYear]);

  const payeAlreadyPaid = irp5TotalPAYE(entries);
  const irp5Gross = entries.reduce((s, e) => s + e.grossIncome, 0);
  const nonEmploymentIncome = Math.max(0, totalIncome - irp5Gross);
  const needsProvisional = nonEmploymentIncome > THRESHOLD;

  // Simplified provisional tax estimate
  const estimatedDeductions = totals?.totalDeductions ?? 0;
  const taxableIncome = Math.max(0, totalIncome - estimatedDeductions);
  const grossTax = computeTax(taxableIncome, activeTaxYear);
  const provisionalTax = Math.max(0, grossTax - payeAlreadyPaid);
  const irp61 = Math.round(provisionalTax * 0.5);
  const irp62 = provisionalTax - irp61;

  const deadlines = buildDeadlines();
  const today = new Date();
  const nextIdx = deadlines.findIndex((d) => new Date(d.isoDate) >= today);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />
      <MXHeader
        title="Provisional tax"
        subtitle="How much you owe and when to pay"
        showBack
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: space.lg, paddingBottom: space["5xl"] }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <ActivityIndicator color={colour.primary} size="large" />
          </View>
        ) : (
          <>
            {/* ── Do I need to register? ────────────────────────────────── */}
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: colour.textSub,
                letterSpacing: 0.8,
                marginBottom: space.sm,
              }}
            >
              DO I NEED TO REGISTER?
            </Text>
            <View
              style={{
                backgroundColor: colour.white,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colour.borderLight,
                padding: space.md,
                marginBottom: space.xl,
              }}
            >
              <CheckRow
                label="Freelance / non-salary income over R30,000"
                value={nonEmploymentIncome > 0 ? fmt(nonEmploymentIncome) : "—"}
                pass={needsProvisional}
              />
              <CheckRow
                label="You earn income outside a salary"
                value={irp5Gross > 0 && nonEmploymentIncome > 0 ? "Salary + freelance" : irp5Gross === 0 ? "Freelance only" : "Salary only"}
                pass={nonEmploymentIncome > 0}
              />
              <View style={{ paddingTop: space.md }}>
                <View
                  style={{
                    backgroundColor: needsProvisional ? colour.infoLight : colour.successBg,
                    borderRadius: radius.sm,
                    padding: space.md,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: space.sm,
                  }}
                >
                  <IconSymbol
                    name={needsProvisional ? "exclamationmark.triangle.fill" : "checkmark.circle.fill"}
                    size={16}
                    color={needsProvisional ? colour.info : colour.success}
                  />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 12,
                      fontWeight: "600",
                      color: needsProvisional ? colour.info : colour.success,
                    }}
                  >
                    {needsProvisional
                      ? "You likely need to register as a provisional taxpayer. You can do this on SARS eFiling or speak to your accountant."
                      : totalIncome === 0
                        ? "Add your income first and we'll check whether you need to register."
                        : "Based on what you've recorded, you probably don't need to register as a provisional taxpayer."}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── Tax estimate ──────────────────────────────────────────── */}
            {totalIncome > 0 && (
              <>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: colour.textSub,
                    letterSpacing: 0.8,
                    marginBottom: space.sm,
                  }}
                >
                  ESTIMATED TAX ({activeTaxYear})
                </Text>
                <View
                  style={{
                    backgroundColor: colour.noir,
                    borderRadius: radius.md,
                    padding: space.lg,
                    marginBottom: space.xl,
                  }}
                >
                  <Text
                    style={{ fontSize: 11, color: colour.onNoir2, marginBottom: space.md }}
                  >
                    Estimated from your recorded income, expenses and salary tax (PAYE).
                  </Text>

                  {[
                    { label: "Total income", value: fmt(totalIncome), colour: colour.onNoir },
                    { label: "Deductions (your expenses)", value: estimatedDeductions > 0 ? `−${fmt(estimatedDeductions)}` : "—", colour: colour.onNoir2 },
                    { label: "Taxable income", value: fmt(taxableIncome), colour: colour.onNoir },
                    { label: "Tax calculated by SARS", value: fmt(grossTax), colour: colour.onNoir },
                    { label: "Tax already paid (PAYE)", value: payeAlreadyPaid > 0 ? `−${fmt(payeAlreadyPaid)}` : "—", colour: colour.onNoir2 },
                  ].map((row) => (
                    <View
                      key={row.label}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}
                    >
                      <Text style={{ fontSize: 12, color: colour.onNoir2 }}>{row.label}</Text>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: row.colour }}>
                        {row.value}
                      </Text>
                    </View>
                  ))}

                  <View
                    style={{
                      height: 1,
                      backgroundColor: "rgba(255,255,255,0.1)",
                      marginVertical: space.sm,
                    }}
                  />
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: space.md }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: colour.primary }}>
                      Provisional tax owing
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: "800", color: colour.primary }}>
                      {fmt(provisionalTax)}
                    </Text>
                  </View>

                  {provisionalTax > 0 && (
                    <View
                      style={{
                        backgroundColor: "rgba(255,255,255,0.07)",
                        borderRadius: radius.sm,
                        padding: space.md,
                        gap: 6,
                      }}
                    >
                      <Text style={{ fontSize: 11, color: colour.onNoir2, marginBottom: 4 }}>
                        Split into 2 payments:
                      </Text>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={{ fontSize: 12, color: colour.onNoir2 }}>1st payment (Aug 2026)</Text>
                        <Text style={{ fontSize: 12, fontWeight: "700", color: colour.onNoir }}>{fmt(irp61)}</Text>
                      </View>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={{ fontSize: 12, color: colour.onNoir2 }}>2nd payment (Feb 2027)</Text>
                        <Text style={{ fontSize: 12, fontWeight: "700", color: colour.onNoir }}>{fmt(irp62)}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* ── Deadlines ─────────────────────────────────────────────── */}
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: colour.textSub,
                letterSpacing: 0.8,
                marginBottom: space.sm,
              }}
            >
              PAYMENT DATES
            </Text>
            <View
              style={{
                backgroundColor: colour.noir,
                borderRadius: radius.md,
                padding: space.md,
                marginBottom: space.xl,
              }}
            >
              {deadlines.map((d, i) => {
                const isPast = new Date(d.isoDate) < today;
                const isNext = i === nextIdx;
                return (
                  <DeadlineRow
                    key={d.key}
                    deadline={d}
                    isPast={isPast}
                    isNext={isNext}
                  />
                );
              })}
            </View>

            {/* ── Penalty warning ───────────────────────────────────────── */}
            <InfoBanner
              icon="exclamationmark.triangle.fill"
              title="Underpay and SARS will charge you extra"
              body="If your 2nd payment is less than 80% of what you actually owe, SARS adds a 20% penalty on the shortfall — plus interest. It's safer to slightly overpay."
              style={{ marginBottom: space.xl }}
            />

            {/* ── How to pay ────────────────────────────────────────────── */}
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: colour.textSub,
                letterSpacing: 0.8,
                marginBottom: space.sm,
              }}
            >
              HOW TO PAY
            </Text>
            <View
              style={{
                backgroundColor: colour.white,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colour.borderLight,
                padding: space.md,
                marginBottom: space.xl,
              }}
            >
              {[
                {
                  step: "1",
                  text: "Log in to SARS eFiling (efiling.sars.gov.za)",
                },
                {
                  step: "2",
                  text: "Go to Returns → Provisional Tax → IRP6",
                },
                {
                  step: "3",
                  text: "Enter your estimated income for the period",
                },
                {
                  step: "4",
                  text: "Submit and pay by EFT — use the reference number shown on your IRP6",
                },
                {
                  step: "5",
                  text: "Save your proof of payment — late payments attract penalties",
                },
              ].map((item, idx, arr) => (
                <View
                  key={item.step}
                  style={{
                    flexDirection: "row",
                    gap: space.md,
                    paddingVertical: space.sm,
                    borderBottomWidth: idx < arr.length - 1 ? 1 : 0,
                    borderBottomColor: colour.borderLight,
                  }}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: colour.primary50,
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: colour.accentDeep,
                      }}
                    >
                      {item.step}
                    </Text>
                  </View>
                  <Text
                    style={{ flex: 1, fontSize: 13, color: colour.text, lineHeight: 20 }}
                  >
                    {item.text}
                  </Text>
                </View>
              ))}
            </View>

            <InfoBanner
              icon="info.circle.fill"
              body="These numbers are a rough guide based on what you've recorded. Your actual tax depends on your full financial picture. If you're unsure, speak to a tax practitioner."
              style={{ marginBottom: space.xl }}
            />

            {/* ── Add IRP5 CTA ──────────────────────────────────────────── */}
            {entries.length === 0 && (
              <TouchableOpacity
                onPress={() => router.push("/add-irp5-income" as any)}
                style={{
                  backgroundColor: colour.noir,
                  borderRadius: radius.md,
                  padding: space.lg,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: space.md,
                  marginBottom: space.xl,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: colour.primary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconSymbol name="doc.text.fill" size={18} color={colour.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colour.onNoir }}>
                    Add IRP5 income
                  </Text>
                  <Text style={{ fontSize: 11, color: colour.onNoir2, marginTop: 2 }}>
                    Add your salary income to get a more accurate estimate
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={14} color={colour.onNoir2} />
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
      <MXTabBar />
    </SafeAreaView>
  );
}
