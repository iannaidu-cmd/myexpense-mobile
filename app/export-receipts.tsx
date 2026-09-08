import { InfoBanner } from "@/components/InfoBanner";
import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getCurrentTaxYear } from "@/lib/taxRules";
import {
  countReceiptsInRange,
  exportReceiptsZip,
} from "@/services/receiptExportService";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Date helpers ───────────────────────────────────────────────────────────

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function fmtDisplay(s: string): string {
  return fromISODate(s).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// SA tax year runs 1 March -> last day of February. "2026/27" -> 2026-03-01.
function taxYearBounds(taxYear: string): { start: string; end: string } {
  const startYear = parseInt(taxYear.split("/")[0], 10);
  const endYear = startYear + 1;
  const isLeap =
    (endYear % 4 === 0 && endYear % 100 !== 0) || endYear % 400 === 0;
  const start = `${startYear}-03-01`;
  const end = `${endYear}-02-${isLeap ? "29" : "28"}`;
  const todayISO = toISODate(new Date());
  return { start, end: end < todayISO ? end : todayISO };
}

function previousTaxYear(taxYear: string): string {
  const startYear = parseInt(taxYear.split("/")[0], 10) - 1;
  return `${startYear}/${String(startYear + 1).slice(-2)}`;
}

const ALL_TIME_START = "2018-01-01"; // MyExpense predates this; wide enough to catch everything

// ─── Date row + inline/native picker ───────────────────────────────────────

function DateRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const handleChange = (event: any, selected?: Date) => {
    if (Platform.OS === "android") setOpen(false);
    if (event.type === "dismissed") return;
    if (selected) onChange(toISODate(selected));
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={{
          flex: 1,
          backgroundColor: colour.surface1,
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor: colour.borderLight,
          paddingVertical: 10,
          paddingHorizontal: 12,
        }}
      >
        <Text style={{ fontSize: 10, fontWeight: "700", color: colour.textSub, letterSpacing: 0.4 }}>
          {label.toUpperCase()}
        </Text>
        <Text style={{ fontSize: 14, fontWeight: "700", color: colour.text, marginTop: 2 }}>
          {fmtDisplay(value)}
        </Text>
      </TouchableOpacity>

      {open && Platform.OS === "android" && (
        <DateTimePicker
          value={fromISODate(value)}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={handleChange}
        />
      )}

      {Platform.OS === "ios" && (
        <Modal visible={open} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" }}>
            <View style={{ backgroundColor: colour.white, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: space.md }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space.sm }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: colour.text }}>{label}</Text>
                <TouchableOpacity onPress={() => setOpen(false)}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colour.primary }}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={fromISODate(value)}
                mode="date"
                display="inline"
                maximumDate={new Date()}
                onChange={handleChange}
              />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────

export default function ExportReceiptsScreen() {
  const { user } = useAuthStore();
  const currentTaxYear = getCurrentTaxYear();
  const defaultRange = taxYearBounds(currentTaxYear);

  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [activeQuickRange, setActiveQuickRange] = useState<
    "current" | "previous" | "all" | "custom"
  >("current");

  const [count, setCount] = useState<number | null>(null);
  const [counting, setCounting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const loadCount = useCallback(async () => {
    if (!user) return;
    setCounting(true);
    try {
      const n = await countReceiptsInRange(user.id, startDate, endDate);
      setCount(n);
    } catch (e) {
      console.warn("countReceiptsInRange failed:", e);
      setCount(null);
    } finally {
      setCounting(false);
    }
  }, [user, startDate, endDate]);

  useEffect(() => { loadCount(); }, [loadCount]);
  useFocusEffect(useCallback(() => { loadCount(); }, [loadCount]));

  const selectQuickRange = (key: "current" | "previous" | "all") => {
    setActiveQuickRange(key);
    if (key === "current") {
      const r = taxYearBounds(currentTaxYear);
      setStartDate(r.start);
      setEndDate(r.end);
    } else if (key === "previous") {
      const r = taxYearBounds(previousTaxYear(currentTaxYear));
      setStartDate(r.start);
      setEndDate(r.end);
    } else {
      setStartDate(ALL_TIME_START);
      setEndDate(toISODate(new Date()));
    }
  };

  const handleStartChange = (iso: string) => {
    setActiveQuickRange("custom");
    setStartDate(iso > endDate ? endDate : iso);
  };
  const handleEndChange = (iso: string) => {
    setActiveQuickRange("custom");
    setEndDate(iso < startDate ? startDate : iso);
  };

  const handleExport = async () => {
    if (!user) return;
    if (!count) {
      Alert.alert("No receipts", "There are no receipts in that date range.");
      return;
    }
    setExporting(true);
    setProgress({ done: 0, total: count });
    try {
      const result = await exportReceiptsZip({
        userId: user.id,
        startDate,
        endDate,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      if (result.skipped > 0) {
        Alert.alert(
          "Export complete",
          `${result.fileCount} receipt${result.fileCount === 1 ? "" : "s"} exported. ${result.skipped} could not be downloaded.`,
        );
      }
    } catch (e: any) {
      Alert.alert("Export failed", e?.message ?? "Could not export receipts. Please try again.");
    } finally {
      setExporting(false);
      setProgress(null);
    }
  };

  const QUICK_RANGES = [
    { key: "current" as const, label: currentTaxYear },
    { key: "previous" as const, label: previousTaxYear(currentTaxYear) },
    { key: "all" as const, label: "All time" },
  ];

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />
      <MXHeader title="Export receipts" subtitle="Proof of expense for SARS" showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: colour.background, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* ── Quick range chips ── */}
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
          <Text style={{ fontSize: 13, fontWeight: "700", color: colour.text, marginBottom: 14 }}>
            Date range
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: space.md }}>
            {QUICK_RANGES.map((r) => (
              <TouchableOpacity
                key={r.key}
                onPress={() => selectQuickRange(r.key)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: activeQuickRange === r.key ? colour.primary : colour.surface1,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: activeQuickRange === r.key ? colour.primary : colour.borderLight,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: activeQuickRange === r.key ? colour.onPrimary : colour.textSub,
                  }}
                >
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <DateRow label="From" value={startDate} onChange={handleStartChange} />
            <DateRow label="To" value={endDate} onChange={handleEndChange} />
          </View>
        </View>

        {/* ── Receipt count preview ── */}
        <View
          style={{
            marginHorizontal: space.md,
            backgroundColor: colour.noir,
            borderRadius: radius.lg,
            padding: space.md,
            paddingHorizontal: 18,
            marginBottom: space.md,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              position: "absolute", width: 120, height: 120, borderRadius: 60,
              backgroundColor: colour.primary, opacity: 0.35, top: -40, right: -30,
            }}
          />
          <View
            style={{
              width: 42, height: 42, borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.15)",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <IconSymbol name="doc.zipper" size={20} color={colour.white} />
          </View>
          <View style={{ flex: 1 }}>
            {counting ? (
              <ActivityIndicator color={colour.white} style={{ alignSelf: "flex-start" }} />
            ) : (
              <Text style={{ fontSize: 20, fontWeight: "800", color: colour.onNoir }}>
                {count ?? 0} receipt{count === 1 ? "" : "s"}
              </Text>
            )}
            <Text style={{ fontSize: 11, color: colour.onNoir2, marginTop: 2 }}>
              {fmtDisplay(startDate)} – {fmtDisplay(endDate)}
            </Text>
          </View>
        </View>

        {/* ── Export button ── */}
        <TouchableOpacity
          onPress={handleExport}
          disabled={exporting || counting || !count}
          style={{
            marginHorizontal: space.md,
            backgroundColor: exporting || !count ? colour.border : colour.accent,
            borderRadius: radius.md,
            padding: space.md,
            alignItems: "center",
            marginBottom: space.md,
          }}
        >
          {exporting ? (
            <View style={{ alignItems: "center" }}>
              <ActivityIndicator color={colour.white} />
              {progress && (
                <Text style={{ ...typography.bodyXS, color: colour.white, marginTop: 6 }}>
                  Downloading {progress.done} of {progress.total}…
                </Text>
              )}
            </View>
          ) : (
            <Text style={{ color: colour.white, fontSize: 15, fontWeight: "700" }}>
              Export as ZIP & Share
            </Text>
          )}
        </TouchableOpacity>

        <InfoBanner
          icon="info.circle.fill"
          title="Keep records for 5 years"
          body="SARS can request supporting documents for up to 5 years after assessment. The ZIP contains the original receipt images, named by date and vendor — save it somewhere durable, like cloud storage, in case you switch devices."
          style={{ marginHorizontal: space.md }}
        />
      </ScrollView>
      <MXTabBar />
    </SafeAreaView>
  );
}
