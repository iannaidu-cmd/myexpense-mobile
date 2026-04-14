import { colour, radius, space, typography } from "@/tokens";
import { Pressable, ScrollView, Text, View } from "react-native";

interface DeductionCategory { icon: string; name: string; amount: number; }

interface ITR12PDFReportProps {
  taxpayerName?: string;
  taxNumber?: string;
  workType?: string;
  categories?: DeductionCategory[];
  totalDeductible?: number;
  totalVAT?: number;
  taxSavedPercent?: number;
  onDownload?: () => void;
  onShare?: () => void;
}

const DEFAULT_CATEGORIES: DeductionCategory[] = [
  { icon: "💻", name: "Software & Tech",       amount: 12400 },
  { icon: "🚗", name: "Travel & Transport",     amount: 9200  },
  { icon: "📁", name: "Office & Stationery",    amount: 7800  },
  { icon: "📋", name: "Professional Services",  amount: 6100  },
  { icon: "🍽️", name: "Meals & Entertainment", amount: 3400  },
  { icon: "🏠", name: "Home Office",            amount: 2100  },
];

export function ITR12PDFReportScreen({
  taxpayerName   = "Ian Naidu",
  taxNumber      = "1234567890",
  workType       = "Sole Proprietor",
  categories     = DEFAULT_CATEGORIES,
  totalDeductible = 41000,
  totalVAT        = 5346,
  taxSavedPercent = 45,
  onDownload,
  onShare,
}: ITR12PDFReportProps) {
  const taxSaved = Math.round(totalDeductible * (taxSavedPercent / 100));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colour.background }}>

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: 24,
          backgroundColor: colour.primary,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <Pressable style={{ padding: 4 }}>
            <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 22 }}>←</Text>
          </Pressable>
          <Text style={{ ...typography.labelM, color: colour.white, marginLeft: 8 }}>MyExpense</Text>
        </View>
        <Text style={{ ...typography.h3, color: colour.white, marginBottom: 6 }}>ITR12 PDF Report</Text>
        <Text style={{ ...typography.bodyS, color: "rgba(255,255,255,0.5)" }}>
          Tax Year 2026 · Generated 12 Mar 2026
        </Text>
      </View>

      {/* PDF preview */}
      <View
        style={{
          marginHorizontal: 16,
          marginTop: 16,
          marginBottom: 16,
          backgroundColor: colour.white,
          borderRadius: radius.lg,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colour.border,
        }}
      >
        {/* PDF header strip */}
        <View style={{ backgroundColor: colour.navyDark, paddingHorizontal: 18, paddingVertical: 16 }}>
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, letterSpacing: 1 }}>
            MYEXPENSE — OFFICIAL REPORT
          </Text>
          <Text style={{ ...typography.h4, color: colour.white, marginTop: 4 }}>
            ITR12 Expense Deduction Report
          </Text>
          <Text style={{ ...typography.bodyXS, color: colour.info, marginTop: 2 }}>
            Tax Year: 1 March 2025 – 28 February 2026
          </Text>
        </View>

        {/* Taxpayer details */}
        <View
          style={{
            paddingHorizontal: 18,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: colour.border,
          }}
        >
          <Text style={{ ...typography.micro, fontWeight: "700", color: colour.textSub, marginBottom: 8, letterSpacing: 0.5 }}>
            TAXPAYER DETAILS
          </Text>
          {[
            { label: "Full Name",    value: taxpayerName },
            { label: "Tax Number",   value: taxNumber    },
            { label: "Work Type",    value: workType     },
            { label: "Report Date",  value: "12 March 2026" },
          ].map((r, i) => (
            <View
              key={i}
              style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}
            >
              <Text style={{ ...typography.bodyS, color: colour.textSub }}>{r.label}</Text>
              <Text style={{ ...typography.labelS, color: colour.primary }}>{r.value}</Text>
            </View>
          ))}
        </View>

        {/* Deductions summary */}
        <View
          style={{
            paddingHorizontal: 18,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: colour.border,
          }}
        >
          <Text style={{ ...typography.micro, fontWeight: "700", color: colour.textSub, marginBottom: 8, letterSpacing: 0.5 }}>
            SECTION 11(a) DEDUCTIONS SUMMARY
          </Text>
          {categories.map((cat, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 6,
                ...(i < categories.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colour.borderLight } : {}),
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 13 }}>{cat.icon}</Text>
                <Text style={{ ...typography.bodyS, color: colour.primary }}>{cat.name}</Text>
              </View>
              <Text style={{ ...typography.labelS, color: colour.primary }}>
                R {cat.amount.toLocaleString()}
              </Text>
            </View>
          ))}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingTop: 10,
              borderTopWidth: 1.5,
              borderTopColor: colour.border,
              marginTop: 4,
            }}
          >
            <Text style={{ ...typography.labelM, color: colour.primary }}>TOTAL DEDUCTIBLE</Text>
            <Text style={{ ...typography.amountS, color: colour.info }}>
              R {totalDeductible.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Tax impact */}
        <View style={{ paddingHorizontal: 18, paddingVertical: 14, backgroundColor: colour.tealLight }}>
          <Text style={{ ...typography.micro, fontWeight: "700", color: colour.textSub, marginBottom: 8, letterSpacing: 0.5 }}>
            ESTIMATED TAX IMPACT
          </Text>
          {[
            { label: "Total deductible expenses",           value: `R ${totalDeductible.toLocaleString()}`, highlight: false },
            { label: "VAT input tax (15%)",                 value: `R ${totalVAT.toLocaleString()}`,        highlight: false },
            { label: `Est. tax saving @ ${taxSavedPercent}%`, value: `R ${taxSaved.toLocaleString()}`,     highlight: true  },
          ].map((r, i) => (
            <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
              <Text style={{ ...typography.bodyS, color: colour.textSub }}>{r.label}</Text>
              <Text
                style={{
                  ...typography.labelS,
                  color: r.highlight ? colour.teal : colour.primary,
                  fontWeight: r.highlight ? "900" : "700",
                }}
              >
                {r.value}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Page count */}
      <View style={{ alignItems: "center", marginVertical: 8 }}>
        <Text style={{ ...typography.bodyXS, color: colour.textSub }}>📄 6 pages · 2.4 MB · PDF</Text>
      </View>

      {/* Actions */}
      <View style={{ flexDirection: "row", gap: 10, marginHorizontal: 20 }}>
        <Pressable
          style={{
            flex: 1,
            borderRadius: radius.pill,
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
            borderRadius: radius.pill,
            paddingVertical: 14,
            alignItems: "center",
            backgroundColor: colour.white,
            borderWidth: 2,
            borderColor: colour.primary,
          }}
          onPress={onShare}
        >
          <Text style={{ ...typography.btnL, color: colour.primary }}>📤 Share</Text>
        </Pressable>
      </View>

      {/* Email option */}
      <Pressable
        style={{
          marginHorizontal: 20,
          marginTop: 12,
          backgroundColor: colour.white,
          borderRadius: radius.md,
          paddingVertical: 14,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1.5,
          borderColor: colour.border,
        }}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: radius.sm,
            backgroundColor: colour.primary50,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 18 }}>📧</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ ...typography.labelM, color: colour.text }}>Email to accountant</Text>
          <Text style={{ ...typography.bodyXS, color: colour.textSub }}>Send directly from the app</Text>
        </View>
        <Text style={{ ...typography.bodyL, color: colour.info }}>›</Text>
      </Pressable>

      {/* SARS note */}
      <View
        style={{
          marginHorizontal: 20,
          marginTop: 12,
          backgroundColor: colour.surface1,
          borderWidth: 1.5,
          borderColor: colour.border,
          borderStyle: "dashed",
          borderRadius: radius.md,
          paddingVertical: 12,
          paddingHorizontal: 16,
        }}
      >
        <Text style={{ ...typography.bodyXS, color: colour.textSub, lineHeight: 18 }}>
          ⚠️ This report is for tax planning purposes. Please consult a
          registered tax practitioner before submitting to SARS.
        </Text>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
