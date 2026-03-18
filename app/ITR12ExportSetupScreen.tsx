import { NavigationProp } from "@react-navigation/native";
import React, { useState } from "react";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";

interface Props {
  navigation?: NavigationProp<any>;
}


const NAV = { Home: "⊞", Scan: "⊡", Reports: "◈", Settings: "⚙" };

function PhoneShell({
  children,
  navigation,
}: {
  children: React.ReactNode;
  navigation?: NavigationProp<any>;
}) {
  const tabs = [
    { key: "Home", label: "Home", icon: NAV.Home },
    { key: "Scan", label: "Scan", icon: NAV.Scan },
    { key: "Reports", label: "Reports", icon: NAV.Reports },
    { key: "Settings", label: "Settings", icon: NAV.Settings },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: C.bgLighter }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      <View
        style={{
          flexDirection: "row",
          backgroundColor: C.white,
          borderTopWidth: 1,
          borderTopColor: C.border,
          paddingBottom: 8,
          paddingTop: 6,
        }}
      >
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => navigation?.navigate(t.key)}
            style={{ flex: 1, alignItems: "center" }}
          >
            <Text style={{ fontSize: 20, color: C.textSub }}>{t.icon}</Text>
            <Text style={{ fontSize: 10, marginTop: 2, color: C.textSub }}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

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
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        backgroundColor: C.white,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: C.text }}>
          {label}
        </Text>
        <Text style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}>
          {sub}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: C.border, true: C.teal }}
        thumbColor={C.white}
      />
    </View>
  );
}

export default function ITR12ExportSetupScreen({ navigation }: Props) {
  const [taxYear, setTaxYear] = useState("2024/25");
  const [includeReceipts, setIncludeReceipts] = useState(true);
  const [includeVAT, setIncludeVAT] = useState(false);
  const [includeTravel, setIncludeTravel] = useState(true);
  const [includePersonal, setIncludePersonal] = useState(false);
  const [summaryOnly, setSummaryOnly] = useState(false);
  const [format, setFormat] = useState<"pdf" | "csv" | "both">("pdf");

  const YEARS = ["2024/25", "2023/24", "2022/23"];
  const FORMATS: Array<{
    key: "pdf" | "csv" | "both";
    label: string;
    icon: string;
  }> = [
    { key: "pdf", label: "PDF Report", icon: "📄" },
    { key: "csv", label: "CSV Spreadsheet", icon: "📊" },
    { key: "both", label: "Both", icon: "📦" },
  ];

  return (
    <PhoneShell navigation={navigation}>
      <View
        style={{
          backgroundColor: C.navy,
          paddingTop: 52,
          paddingBottom: 28,
          paddingHorizontal: 20,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={{ marginBottom: 10 }}
        >
          <Text style={{ color: C.teal, fontSize: 13 }}>‹ Tax Summary</Text>
        </TouchableOpacity>
        <Text
          style={{
            color: C.teal,
            fontSize: 12,
            fontWeight: "600",
            letterSpacing: 1,
          }}
        >
          TAX & ITR12
        </Text>
        <Text
          style={{
            color: C.white,
            fontSize: 22,
            fontWeight: "800",
            marginTop: 4,
          }}
        >
          Export Setup
        </Text>
        <Text style={{ color: C.textSub, fontSize: 12, marginTop: 4 }}>
          Configure your ITR12 export
        </Text>
      </View>

      <View
        style={{
          backgroundColor: C.bgLighter,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          marginTop: -16,
          paddingBottom: 30,
        }}
      >
        {/* Tax Year */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 20,
            backgroundColor: C.white,
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: C.border,
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: C.text,
              marginBottom: 14,
            }}
          >
            Tax Year
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
                  backgroundColor: taxYear === y ? C.navy : C.bgLight,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: taxYear === y ? C.navy : C.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: taxYear === y ? C.white : C.textSub,
                  }}
                >
                  {y}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Export Format */}
        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: C.white,
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: C.border,
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: C.text,
              marginBottom: 14,
            }}
          >
            Export Format
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
                  borderRadius: 12,
                  backgroundColor: format === f.key ? C.navy : C.bgLight,
                  borderWidth: 1,
                  borderColor: format === f.key ? C.navy : C.border,
                }}
              >
                <Text style={{ fontSize: 20, marginBottom: 4 }}>{f.icon}</Text>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: format === f.key ? C.white : C.textSub,
                    textAlign: "center",
                  }}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Include Options */}
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: C.textSub,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            paddingHorizontal: 16,
            marginBottom: 8,
          }}
        >
          Include in Export
        </Text>
        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: C.border,
            overflow: "hidden",
            marginBottom: 16,
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

        {/* Export summary */}
        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: C.bgLight,
            borderRadius: 14,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: C.text,
              marginBottom: 10,
            }}
          >
            Export Summary
          </Text>
          {[
            { label: "Tax Year", value: taxYear },
            {
              label: "Format",
              value: FORMATS.find((f) => f.key === format)?.label ?? "",
            },
            { label: "Total Deductions", value: "R 95,680" },
            { label: "Categories", value: "6 deductible" },
            {
              label: "Receipts",
              value: includeReceipts ? "196 attached" : "Not included",
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
              <Text style={{ fontSize: 12, color: C.textSub }}>
                {row.label}
              </Text>
              <Text style={{ fontSize: 12, fontWeight: "600", color: C.text }}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => navigation?.navigate("ITR12ExportPreview")}
          style={{
            marginHorizontal: 16,
            backgroundColor: C.teal,
            borderRadius: 14,
            padding: 16,
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <Text style={{ color: C.white, fontSize: 15, fontWeight: "700" }}>
            Preview Export
          </Text>
        </TouchableOpacity>
        <View style={{ marginHorizontal: 16 }}>
          <Text
            style={{
              fontSize: 11,
              color: C.textSub,
              textAlign: "center",
              lineHeight: 16,
            }}
          >
            ⚠ This export is for your records and tax practitioner. Always have
            your ITR12 reviewed by a registered tax professional before
            submission.
          </Text>
        </View>
      </View>
    </PhoneShell>
  );
}
