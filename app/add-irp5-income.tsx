import { InfoBanner } from "@/components/InfoBanner";
import { MXButton } from "@/components/MXButton";
import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { incomeService } from "@/services/incomeService";
import { useAuthStore } from "@/stores/authStore";
import { irp5TotalGross, useIRP5Store } from "@/stores/irp5Store";
import { colour, radius, space, typography } from "@/tokens";
import { ACTIVE_TAX_YEAR, TAX_YEARS } from "@/types/database";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Last day of February of a SA tax year's end year (e.g. "2026/27" -> 2027-02-28),
// computed via Date instead of a static lookup so it never goes stale and
// correctly accounts for leap years.
function taxYearEndDate(taxYear: string): string {
  const startYear = parseInt(taxYear.split("/")[0], 10);
  const lastFeb = new Date(startYear + 1, 2, 0); // day 0 of March = last day of Feb
  return lastFeb.toISOString().split("T")[0];
}

const fmt = (n: number) =>
  n > 0
    ? `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : "—";

function AmountField({
  label,
  code,
  value,
  onChange,
  required,
}: {
  label: string;
  code: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const n = parseFloat(value) || 0;
  return (
    <View style={{ marginBottom: space.md }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={{ fontSize: 12, fontWeight: "600", color: colour.text }}>
          {label}{required ? " *" : ""}
        </Text>
        <Text style={{ fontSize: 10, color: colour.textSub, fontFamily: "monospace" }}>{code}</Text>
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colour.white,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderColor: value ? colour.primary : colour.border,
          paddingHorizontal: space.md,
          height: 48,
        }}
      >
        <Text style={{ fontSize: 15, color: colour.textSub, marginRight: 4 }}>R</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="0"
          placeholderTextColor={colour.textHint}
          keyboardType="decimal-pad"
          style={{ flex: 1, fontSize: 16, fontWeight: "600", color: colour.text }}
        />
        {n > 0 && (
          <Text style={{ fontSize: 11, color: colour.textSub }}>
            {fmt(n)}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function AddIRP5IncomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { entries, load, add } = useIRP5Store();

  const [employerName, setEmployerName] = useState("");
  const [certificateRef, setCertificateRef] = useState("");
  const [taxYear, setTaxYear] = useState(ACTIVE_TAX_YEAR);
  const [grossIncome, setGrossIncome] = useState("");
  const [payeDeducted, setPayeDeducted] = useState("");
  const [uifDeducted, setUifDeducted] = useState("");
  const [pensionContrib, setPensionContrib] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const gross = parseFloat(grossIncome) || 0;
  const paye = parseFloat(payeDeducted) || 0;
  const uif = parseFloat(uifDeducted) || 0;
  const pension = parseFloat(pensionContrib) || 0;
  const netOfPAYE = gross - paye;

  const canSave = !!employerName.trim() && gross > 0 && paye >= 0;

  const handleSave = async () => {
    if (!user || !canSave) return;
    setSaving(true);
    try {
      const taxYearEnd = taxYearEndDate(taxYear);

      // Save gross income to income table so it appears in totals
      const incomeRecord = await incomeService.addIncome(user.id, {
        amount: gross,
        source: "IRP5 / Employment Income",
        description: `${employerName.trim()}${certificateRef ? ` · Ref: ${certificateRef}` : ""}`,
        category: "IRP5",
        date: taxYearEnd,
        tax_year: taxYear,
      });

      // Save full breakdown to local store
      await add({
        employerName: employerName.trim(),
        certificateRef: certificateRef.trim(),
        taxYear,
        grossIncome: gross,
        payeDeducted: paye,
        uifDeducted: uif,
        pensionContributions: pension,
        incomeRecordId: incomeRecord.id,
      });

      Alert.alert(
        "IRP5 income saved",
        `${fmt(gross)} gross income from ${employerName} added. PAYE credit of ${fmt(paye)} recorded.`,
        [{ text: "Done", onPress: () => router.back() }],
      );
    } catch (e: any) {
      Alert.alert("Error saving IRP5", e.message);
    } finally {
      setSaving(false);
    }
  };

  const existingThisYear = entries.filter((e) => e.taxYear === taxYear);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />
      <MXHeader
        title="Add IRP5 income"
        subtitle="Employment income from IRP5 certificate"
        showBack
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: space.lg, paddingBottom: space["5xl"] }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <InfoBanner
            icon="doc.text.fill"
            title="Where to find these figures"
            body="Your IRP5 or IT3(a) certificate is issued by your employer after the tax year. The source codes (e.g. 3601, 4102) appear on the certificate next to each amount."
            style={{ marginBottom: space.xl }}
          />

          {existingThisYear.length > 0 && (
            <View
              style={{
                backgroundColor: colour.warningBg,
                borderRadius: radius.md,
                padding: space.md,
                marginBottom: space.xl,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: colour.warning, marginBottom: 2 }}>
                {existingThisYear.length} IRP5 {existingThisYear.length === 1 ? "entry" : "entries"} already recorded for {taxYear}
              </Text>
              <Text style={{ fontSize: 11, color: colour.warning }}>
                Total gross: {fmt(irp5TotalGross(existingThisYear))}. Add another employer below if applicable.
              </Text>
            </View>
          )}

          {/* ── Tax year ──────────────────────────────────────────────── */}
          <Text style={{ ...typography.labelM, color: colour.textSub, marginBottom: space.sm }}>
            TAX YEAR
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: space.xl }}
          >
            <View style={{ flexDirection: "row", gap: space.sm }}>
              {TAX_YEARS.map((y) => (
                <TouchableOpacity
                  key={y}
                  onPress={() => setTaxYear(y)}
                  style={{
                    paddingHorizontal: space.md,
                    paddingVertical: 8,
                    borderRadius: radius.pill,
                    backgroundColor: taxYear === y ? colour.primary : colour.white,
                    borderWidth: 1.5,
                    borderColor: taxYear === y ? colour.primary : colour.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: taxYear === y ? colour.onPrimary : colour.text,
                    }}
                  >
                    {y}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* ── Employer details ──────────────────────────────────────── */}
          <Text style={{ ...typography.labelM, color: colour.textSub, marginBottom: space.sm }}>
            EMPLOYER DETAILS
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
            <Text style={{ fontSize: 11, color: colour.textSub, marginBottom: 4 }}>
              Employer name *
            </Text>
            <TextInput
              value={employerName}
              onChangeText={setEmployerName}
              placeholder="e.g. ABC (Pty) Ltd"
              placeholderTextColor={colour.textHint}
              style={{
                fontSize: 15,
                color: colour.text,
                borderBottomWidth: 1,
                borderBottomColor: colour.borderLight,
                paddingBottom: space.sm,
                marginBottom: space.md,
              }}
            />

            <Text style={{ fontSize: 11, color: colour.textSub, marginBottom: 4 }}>
              IRP5 certificate number (optional)
            </Text>
            <TextInput
              value={certificateRef}
              onChangeText={setCertificateRef}
              placeholder="e.g. 1234567890"
              placeholderTextColor={colour.textHint}
              keyboardType="numeric"
              style={{ fontSize: 15, color: colour.text, paddingBottom: space.xs }}
            />
          </View>

          {/* ── Income ───────────────────────────────────────────────── */}
          <Text style={{ ...typography.labelM, color: colour.textSub, marginBottom: space.sm }}>
            INCOME & DEDUCTIONS
          </Text>
          <View
            style={{
              backgroundColor: colour.white,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colour.borderLight,
              padding: space.md,
              marginBottom: space.md,
            }}
          >
            <AmountField
              label="Gross income"
              code="3601"
              value={grossIncome}
              onChange={setGrossIncome}
              required
            />
            <AmountField
              label="PAYE deducted"
              code="4102"
              value={payeDeducted}
              onChange={setPayeDeducted}
              required
            />
            <AmountField
              label="UIF contributions"
              code="4141"
              value={uifDeducted}
              onChange={setUifDeducted}
            />
            <AmountField
              label="Pension / provident fund"
              code="4001"
              value={pensionContrib}
              onChange={setPensionContrib}
            />
          </View>

          {/* ── Live summary ──────────────────────────────────────────── */}
          {gross > 0 && (
            <View
              style={{
                backgroundColor: colour.noir,
                borderRadius: radius.md,
                padding: space.lg,
                marginBottom: space.xl,
              }}
            >
              <Text
                style={{ fontSize: 11, color: colour.onNoir2, marginBottom: space.sm }}
              >
                IRP5 SUMMARY
              </Text>
              {[
                { label: "Gross income (3601)", value: fmt(gross), colour: colour.onNoir },
                { label: "PAYE deducted (4102)", value: paye > 0 ? `−${fmt(paye)}` : "—", colour: paye > 0 ? colour.danger : colour.onNoir2 },
                ...(uif > 0 ? [{ label: "UIF (4141)", value: `−${fmt(uif)}`, colour: colour.onNoir2 }] : []),
                ...(pension > 0 ? [{ label: "Pension (4001)", value: `−${fmt(pension)}`, colour: colour.success }] : []),
              ].map((row) => (
                <View
                  key={row.label}
                  style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}
                >
                  <Text style={{ fontSize: 12, color: colour.onNoir2 }}>{row.label}</Text>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: row.colour }}>{row.value}</Text>
                </View>
              ))}
              <View
                style={{ height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginVertical: space.sm }}
              />
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: colour.primary }}>
                  Net of PAYE
                </Text>
                <Text style={{ fontSize: 13, fontWeight: "800", color: colour.primary }}>
                  {fmt(netOfPAYE)}
                </Text>
              </View>
            </View>
          )}

          <InfoBanner
            icon="info.circle.fill"
            body="Pension/provident contributions (code 4001) are deductible up to 27.5% of gross income, capped at R350,000 per year. These reduce your taxable income on your ITR12."
            style={{ marginBottom: space.xl }}
          />

          <MXButton
            label={saving ? "Saving…" : "Save IRP5 income"}
            variant="primary"
            size="L"
            onPress={handleSave}
            fullWidth
          />
        </ScrollView>
      </KeyboardAvoidingView>
      <MXTabBar />
    </SafeAreaView>
  );
}
