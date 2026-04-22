import { colour, radius, space, typography } from "@/tokens";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

interface ExportCategory {
  name: string;
  icon: string;
  color: string;
  gross: number;
  vat: number;
  net: number;
  items: number;
  note?: boolean;
}

interface ITR12ExportPreviewProps {
  categories?: ExportCategory[];
  taxYear?: string;
  format?: string;
  includeVAT?: boolean;
  includeReceipts?: boolean;
  onGenerate?: () => void;
  onEditSetup?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
}

const DEFAULT_CATEGORIES: ExportCategory[] = [
  { name: "Software & Tech",       icon: "💻", color: colour.midNavy2, gross: 12400, vat: 1617, net: 10783, items: 28 },
  { name: "Travel & Transport",    icon: "🚗", color: colour.info,     gross: 9200,  vat: 1200, net: 8000,  items: 34 },
  { name: "Office & Stationery",   icon: "📁", color: colour.primary,  gross: 7800,  vat: 1017, net: 6783,  items: 19 },
  { name: "Professional Services", icon: "📋", color: colour.teal,     gross: 6100,  vat: 795,  net: 5305,  items: 8  },
  { name: "Meals (50% rule)",      icon: "🍽️", color: colour.danger,   gross: 3400,  vat: 443,  net: 1479,  items: 22, note: true },
];

export function ITR12ExportPreviewScreen({
  categories = DEFAULT_CATEGORIES,
  taxYear = "2026 (Mar 2025 – Feb 2026)",
  format = "📄 PDF Report",
  includeVAT = true,
  includeReceipts = true,
  onGenerate,
  onEditSetup,
  onDownload,
  onShare,
}: ITR12ExportPreviewProps) {
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const totalGross = categories.reduce((s, c) => s + c.gross, 0);
  const totalVAT   = categories.reduce((s, c) => s + c.vat,   0);
  const totalNet   = categories.reduce((s, c) => s + c.net,   0);
  const taxSaved   = Math.round(totalNet * 0.45);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setDone(true);
      if (typeof onGenerate === "function") onGenerate();
    }, 2000);
  };

  // ── Success state ────────────────────────────────────────────────────────────
  if (done) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colour.primary }}
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 28,
          paddingVertical: 40,
        }}
      >
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: colour.teal,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 44, color: colour.white }}>✓</Text>
        </View>

        <Text style={{ ...typography.h3, color: colour.white, marginBottom: space.sm, textAlign: "center" }}>
          Report Generated!
        </Text>
        <Text
          style={{
            ...typography.bodyM,
            color: "rgba(255,255,255,0.55)",
            marginBottom: 32,
            textAlign: "center",
            lineHeight: 22,
          }}
        >
          Your ITR12 expense report is ready.{"\n"}
          Tax Year 2026 · PDF format
        </Text>

        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.10)",
            borderRadius: radius.lg,
            paddingVertical: 18,
            paddingHorizontal: 22,
            width: "100%",
            marginBottom: 24,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.15)",
          }}
        >
          {[
            { label: "Total deductions",    value: `R ${totalNet.toLocaleString()}`,   highlight: false },
            { label: "VAT input tax",       value: `R ${totalVAT.toLocaleString()}`,   highlight: false },
            { label: "Estimated tax saving",value: `R ${taxSaved.toLocaleString()}`,   highlight: true  },
            { label: "Expenses included",   value: "111 receipts",                     highlight: false },
          ].map((r, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 9,
                borderBottomWidth: i < 3 ? 1 : 0,
                borderBottomColor: "rgba(255,255,255,0.1)",
              }}
            >
              <Text style={{ ...typography.bodyS, color: "rgba(255,255,255,0.45)" }}>
                {r.label}
              </Text>
              <Text
                style={{
                  ...typography.labelM,
                  color: r.highlight ? colour.teal : colour.white,
                }}
              >
                {r.value}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: "row", gap: 10, width: "100%" }}>
          <Pressable
            style={{
              flex: 1,
              borderRadius: radius.md,
              paddingVertical: 14,
              alignItems: "center",
              backgroundColor: colour.primary,
            }}
            onPress={onDownload}
          >
            <Text style={{ ...typography.btnL, color: colour.white }}>📥 Download PDF</Text>
          </Pressable>
          <Pressable
            style={{
              flex: 1,
              borderRadius: radius.md,
              paddingVertical: 14,
              alignItems: "center",
              backgroundColor: "rgba(255,255,255,0.12)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.2)",
            }}
            onPress={onShare}
          >
            <Text style={{ ...typography.btnL, color: colour.white }}>📤 Share</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  // ── Main preview ─────────────────────────────────────────────────────────────
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colour.white }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: colour.primary,
          paddingTop: 52,
          paddingHorizontal: 20,
          paddingBottom: 24,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <Pressable>
            <Text style={{ fontSize: 22, color: "rgba(255,255,255,0.65)" }}>←</Text>
          </Pressable>
          <Text style={{ ...typography.labelM, color: colour.white }}>MyExpense</Text>
          <Pressable onPress={onEditSetup}>
            <Text style={{ ...typography.labelM, color: colour.accent2 }}>Edit Setup</Text>
          </Pressable>
        </View>
        <Text style={{ ...typography.h3, color: colour.white, marginBottom: 6 }}>
          Export Preview
        </Text>
        <Text style={{ ...typography.bodyS, color: "rgba(255,255,255,0.5)" }}>
          Review before generating your ITR12 report
        </Text>
      </View>

      {/* Report meta card */}
      <View
        style={{
          marginHorizontal: 20,
          marginTop: 16,
          borderRadius: radius.lg,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colour.border,
        }}
      >
        <View
          style={{
            backgroundColor: colour.midNavy2,
            paddingHorizontal: 18,
            paddingVertical: 12,
          }}
        >
          <Text style={{ ...typography.labelM, color: colour.white }}>
            Report Configuration
          </Text>
        </View>
        <View style={{ backgroundColor: colour.white, paddingHorizontal: 18, paddingVertical: 14 }}>
          {[
            { label: "Tax year",   value: taxYear },
            { label: "Format",     value: format  },
            { label: "Generated",  value: "12 Mar 2026, 09:41" },
            { label: "VAT included",  value: includeVAT      ? "Yes (15%)" : "No" },
            { label: "Receipts",   value: includeReceipts ? "Thumbnails attached" : "Not included" },
          ].map((r, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 9,
                borderBottomWidth: i < 4 ? 1 : 0,
                borderBottomColor: colour.surface1,
              }}
            >
              <Text style={{ ...typography.bodyS, color: colour.textSub }}>{r.label}</Text>
              <Text style={{ ...typography.labelS, color: colour.primary }}>{r.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Summary totals */}
      <View
        style={{
          marginHorizontal: 20,
          marginTop: 14,
          backgroundColor: colour.primary,
          borderRadius: radius.lg,
          paddingHorizontal: 18,
          paddingVertical: 16,
        }}
      >
        <Text
          style={{
            ...typography.micro,
            color: "rgba(255,255,255,0.6)",
            fontWeight: "600",
            marginBottom: 12,
            letterSpacing: 0.5,
          }}
        >
          EXPORT TOTALS
        </Text>
        <View style={{ flexDirection: "row" }}>
          {[
            { label: "Gross expenses", value: `R ${totalGross.toLocaleString()}` },
            { label: "VAT (Input)",    value: `R ${totalVAT.toLocaleString()}`   },
            { label: "Net deductible", value: `R ${totalNet.toLocaleString()}`   },
          ].map((s, i) => (
            <View key={i} style={{ flex: 1 }}>
              <Text style={{ ...typography.micro, color: "rgba(255,255,255,0.5)", marginBottom: 3 }}>
                {s.label}
              </Text>
              <Text style={{ ...typography.labelM, color: colour.white }}>{s.value}</Text>
            </View>
          ))}
        </View>
        <View
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.2)",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ ...typography.bodyS, color: "rgba(255,255,255,0.6)" }}>
            Estimated tax saving @ 45%
          </Text>
          <Text style={{ ...typography.amountS, color: colour.white }}>
            R {taxSaved.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Category table */}
      <Text
        style={{
          ...typography.labelS,
          color: colour.primary,
          letterSpacing: 0.5,
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 10,
        }}
      >
        CATEGORY BREAKDOWN PREVIEW
      </Text>
      <View
        style={{
          marginHorizontal: 20,
          backgroundColor: colour.white,
          borderRadius: radius.lg,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colour.border,
        }}
      >
        {/* Table header */}
        <View
          style={{
            backgroundColor: colour.primary,
            paddingHorizontal: 16,
            paddingVertical: 10,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          {["Category", "Gross", "Net Ded."].map((h, i) => (
            <Text
              key={i}
              style={{
                ...typography.labelS,
                color: colour.white,
                flex: i === 0 ? 2 : 1,
                textAlign: i === 0 ? "left" : "right",
              }}
            >
              {h}
            </Text>
          ))}
        </View>

        <FlatList
          data={categories}
          keyExtractor={(_, i) => `cat-${i}`}
          scrollEnabled={false}
          renderItem={({ item: cat, index: i }) => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 11,
                ...(i < categories.length - 1
                  ? { borderBottomWidth: 1, borderBottomColor: colour.surface1 }
                  : {}),
              }}
            >
              <View style={{ flex: 2, flexDirection: "row", alignItems: "center", gap: space.sm }}>
                <Text style={{ fontSize: 15 }}>{cat.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...typography.labelS, color: colour.primary }} numberOfLines={1}>
                    {cat.name}
                  </Text>
                  {cat.note && (
                    <Text style={{ ...typography.micro, color: colour.danger, fontWeight: "600" }}>
                      50% rule applied
                    </Text>
                  )}
                </View>
              </View>
              <Text style={{ flex: 1, ...typography.labelS, color: colour.textSub, textAlign: "right" }}>
                R {cat.gross.toLocaleString()}
              </Text>
              <Text style={{ flex: 1, ...typography.labelM, color: colour.primary, textAlign: "right" }}>
                R {cat.net.toLocaleString()}
              </Text>
            </View>
          )}
        />

        {/* Footer totals */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: colour.surface1,
            borderTopWidth: 2,
            borderTopColor: colour.primary,
          }}
        >
          <Text style={{ flex: 2, ...typography.labelM, color: colour.primary }}>Total</Text>
          <Text style={{ flex: 1, ...typography.labelM, color: colour.primary, textAlign: "right" }}>
            R {totalGross.toLocaleString()}
          </Text>
          <Text style={{ flex: 1, ...typography.labelM, color: colour.info, textAlign: "right" }}>
            R {totalNet.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Generate CTA */}
      <Pressable
        style={{
          marginHorizontal: 20,
          marginTop: 16,
          backgroundColor: generating ? colour.navyDark : colour.primary,
          borderRadius: radius.lg,
          paddingVertical: 16,
          alignItems: "center",
        }}
        onPress={handleGenerate}
        disabled={generating}
      >
        <Text style={{ ...typography.btnL, color: colour.white }}>
          {generating ? "Generating…" : "🚀 Generate Report"}
        </Text>
      </Pressable>
      <Text style={{ ...typography.bodyXS, color: colour.textSub, textAlign: "center", marginTop: 10, marginBottom: 30 }}>
        ← Back to setup
      </Text>
    </ScrollView>
  );
}
