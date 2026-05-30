import { InfoBanner } from "@/components/InfoBanner";
import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
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

// ── SARS 2025/26 individual tax table ─────────────────────────────────────────
function computeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  if (taxableIncome <= 237_100)       tax = taxableIncome * 0.18;
  else if (taxableIncome <= 370_500)  tax = 42_678  + (taxableIncome - 237_100) * 0.26;
  else if (taxableIncome <= 512_800)  tax = 77_362  + (taxableIncome - 370_500) * 0.31;
  else if (taxableIncome <= 673_000)  tax = 121_475 + (taxableIncome - 512_800) * 0.36;
  else if (taxableIncome <= 857_900)  tax = 179_147 + (taxableIncome - 673_000) * 0.39;
  else if (taxableIncome <= 1_817_000) tax = 251_258 + (taxableIncome - 857_900) * 0.41;
  else                                tax = 644_489 + (taxableIncome - 1_817_000) * 0.45;
  return Math.max(0, Math.round(tax - 17_235)); // subtract primary rebate
}

// ── Upcoming provisional deadlines ────────────────────────────────────────────
interface Deadline {
  key: string;
  label: string;
  dateStr: string;
  isoDate: string;
  desc: string;
}

function buildDeadlines(): Deadline[] {
  const today = new Date();
  const lines: Deadline[] = [
    // 2025/26 top-up (previous tax year)
    {
      key: "2526-topup",
      label: "2025/26 top-up payment",
      dateStr: "30 Sep 2026",
      isoDate: "2026-09-30",
      desc: "Pay remaining 2025/26 balance to avoid 20% penalty",
    },
    // 2026/27 first provisional
    {
      key: "2627-irp6-1",
      label: "2026/27 · 1st provisional (IRP6-1)",
      dateStr: "31 Aug 2026",
      isoDate: "2026-08-31",
      desc: "At least 50% of estimated annual tax for 2026/27",
    },
    // 2026/27 second provisional
    {
      key: "2627-irp6-2",
      label: "2026/27 · 2nd provisional (IRP6-2)",
      dateStr: "28 Feb 2027",
      isoDate: "2027-02-28",
      desc: "Remaining balance (full estimated tax less IRP6-1)",
    },
    // 2026/27 top-up
    {
      key: "2627-topup",
      label: "2026/27 top-up payment",
      dateStr: "30 Sep 2027",
      isoDate: "2027-09-30",
      desc: "Optional top-up to avoid penalty interest on shortfall",
    },
  ];
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
    incomeService.getIncome(user.id).then((all) => {
      const total = all.reduce((s, e) => s + Number(e.amount), 0);
      setTotalIncome(total);
    }).catch(console.warn).finally(() => setLoading(false));
  }, [user?.id]);

  const payeAlreadyPaid = irp5TotalPAYE(entries);
  const irp5Gross = entries.reduce((s, e) => s + e.grossIncome, 0);
  const nonEmploymentIncome = Math.max(0, totalIncome - irp5Gross);
  const needsProvisional = nonEmploymentIncome > THRESHOLD;

  // Simplified provisional tax estimate
  const estimatedDeductions = totals?.totalDeductions ?? 0;
  const taxableIncome = Math.max(0, totalIncome - estimatedDeductions);
  const grossTax = computeTax(taxableIncome);
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
        subtitle="IRP6 guidance for self-employed income"
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
              DO I NEED TO SUBMIT?
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
                label="Non-employment income > R30,000"
                value={nonEmploymentIncome > 0 ? fmt(nonEmploymentIncome) : "—"}
                pass={needsProvisional}
              />
              <CheckRow
                label="Not solely PAYE taxpayer"
                value={irp5Gross > 0 && nonEmploymentIncome > 0 ? "Mixed" : irp5Gross === 0 ? "No IRP5" : "IRP5 only"}
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
                      ? "You likely need to register as a provisional taxpayer with SARS."
                      : totalIncome === 0
                        ? "Add income entries to check your eligibility."
                        : "Based on current data, provisional tax may not apply to you."}
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
                  ESTIMATED TAX (2025/26)
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
                    Based on your recorded income, deductions and IRP5 PAYE.
                  </Text>

                  {[
                    { label: "Total income", value: fmt(totalIncome), colour: colour.onNoir },
                    { label: "Deductions", value: estimatedDeductions > 0 ? `−${fmt(estimatedDeductions)}` : "—", colour: colour.onNoir2 },
                    { label: "Taxable income", value: fmt(taxableIncome), colour: colour.onNoir },
                    { label: "Gross tax (SARS table)", value: fmt(grossTax), colour: colour.onNoir },
                    { label: "PAYE already paid", value: payeAlreadyPaid > 0 ? `−${fmt(payeAlreadyPaid)}` : "—", colour: colour.onNoir2 },
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
                        Payment split:
                      </Text>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={{ fontSize: 12, color: colour.onNoir2 }}>IRP6-1 (50%)</Text>
                        <Text style={{ fontSize: 12, fontWeight: "700", color: colour.onNoir }}>{fmt(irp61)}</Text>
                      </View>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={{ fontSize: 12, color: colour.onNoir2 }}>IRP6-2 (50%)</Text>
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
              UPCOMING DEADLINES
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
              title="Underestimation penalty"
              body="If your 2nd provisional payment is less than 80% of your actual tax liability, SARS imposes a 20% penalty on the shortfall. Interest also accrues at the official rate."
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
              HOW TO PAY VIA SARS eFILING
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
                  text: "Log in to SARS eFiling at efiling.sars.gov.za",
                },
                {
                  step: "2",
                  text: "Go to Returns → Provisional Tax → IRP6",
                },
                {
                  step: "3",
                  text: "Complete your estimated taxable income for the period",
                },
                {
                  step: "4",
                  text: "Submit and pay via EFT using the SARS payment reference on your IRP6",
                },
                {
                  step: "5",
                  text: "Keep proof of payment — penalties apply if not received by SARS by the deadline",
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
              body="This estimate is a guide only. Your actual provisional tax must be calculated on your full taxable income including allowances and deductions. Consult a registered tax practitioner if unsure."
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
                    Record your employment income and PAYE for a more accurate estimate
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
