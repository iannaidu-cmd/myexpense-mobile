import { NavigationProp } from "@react-navigation/native";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

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

const DEDUCTION_ROWS = [
  {
    category: "Travel & Transport",
    itr12: "4011",
    amount: 16800,
    receipts: 42,
  },
  { category: "Home Office", itr12: "4018", amount: 12400, receipts: 12 },
  { category: "Equipment & Tools", itr12: "4022", amount: 7800, receipts: 8 },
  { category: "Software & Subscr.", itr12: "4011", amount: 6560, receipts: 24 },
  { category: "Professional Fees", itr12: "4011", amount: 4800, receipts: 6 },
  { category: "Utilities", itr12: "4011", amount: 2320, receipts: 12 },
  { category: "Bank Charges", itr12: "4011", amount: 1440, receipts: 6 },
  { category: "Marketing", itr12: "4011", amount: 960, receipts: 4 },
];

const TOTAL = DEDUCTION_ROWS.reduce((s, r) => s + r.amount, 0);

export default function ITR12ExportPreviewScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<"summary" | "detail">("summary");

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
          <Text style={{ color: C.teal, fontSize: 13 }}>‹ Export Setup</Text>
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
          Export Preview
        </Text>
        <Text style={{ color: C.textSub, fontSize: 12, marginTop: 4 }}>
          Tax Year 2024/25 · ITR12 Format
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
        {/* Tab toggle */}
        <View
          style={{ paddingHorizontal: 16, paddingTop: 20, marginBottom: 16 }}
        >
          <View
            style={{
              flexDirection: "row",
              backgroundColor: C.bgLight,
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
                  backgroundColor: activeTab === tab ? C.navy : "transparent",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: activeTab === tab ? C.white : C.textSub,
                  }}
                >
                  {tab === "summary" ? "Summary" : "Line Items"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {activeTab === "summary" ? (
          <>
            {/* Taxpayer info block */}
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
                    backgroundColor: C.navy,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Text
                    style={{ color: C.white, fontSize: 16, fontWeight: "800" }}
                  >
                    IN
                  </Text>
                </View>
                <View>
                  <Text
                    style={{ fontSize: 14, fontWeight: "700", color: C.text }}
                  >
                    Ian Naidu
                  </Text>
                  <Text style={{ fontSize: 12, color: C.textSub }}>
                    Tax No: 1234567890 · {new Date().getFullYear()}
                  </Text>
                </View>
              </View>
              {[
                { label: "Income Tax Return", value: "ITR12" },
                { label: "Tax Period", value: "1 Mar 2024 – 28 Feb 2025" },
                { label: "Employment Type", value: "Sole Proprietor" },
              ].map((r, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <Text style={{ fontSize: 12, color: C.textSub }}>
                    {r.label}
                  </Text>
                  <Text
                    style={{ fontSize: 12, fontWeight: "600", color: C.text }}
                  >
                    {r.value}
                  </Text>
                </View>
              ))}
            </View>

            {/* Total deductions hero */}
            <View
              style={{
                marginHorizontal: 16,
                backgroundColor: C.navy,
                borderRadius: 14,
                padding: 20,
                marginBottom: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: C.textSub, fontSize: 12, marginBottom: 6 }}>
                Total Section 11 Deductions
              </Text>
              <Text style={{ color: C.white, fontSize: 34, fontWeight: "900" }}>
                R {TOTAL.toLocaleString()}
              </Text>
              <Text
                style={{
                  color: C.teal,
                  fontSize: 13,
                  marginTop: 6,
                  fontWeight: "600",
                }}
              >
                Est. Tax Saving: R 26,390
              </Text>
            </View>

            {/* Category summary */}
            <View
              style={{
                marginHorizontal: 16,
                backgroundColor: C.white,
                borderRadius: 14,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: C.border,
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: C.bgLight,
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                }}
              >
                <Text
                  style={{
                    flex: 2,
                    fontSize: 10,
                    fontWeight: "700",
                    color: C.textSub,
                  }}
                >
                  CATEGORY
                </Text>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 10,
                    fontWeight: "700",
                    color: C.textSub,
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
                    color: C.textSub,
                    textAlign: "right",
                  }}
                >
                  AMOUNT
                </Text>
              </View>
              {DEDUCTION_ROWS.map((row, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 11,
                    borderTopWidth: 1,
                    borderTopColor: C.border,
                  }}
                >
                  <Text style={{ flex: 2, fontSize: 12, color: C.text }}>
                    {row.category}
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 11,
                      color: C.textSub,
                      textAlign: "center",
                    }}
                  >
                    {row.itr12}
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 12,
                      fontWeight: "700",
                      color: C.navy,
                      textAlign: "right",
                    }}
                  >
                    R {row.amount.toLocaleString()}
                  </Text>
                </View>
              ))}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderTopWidth: 2,
                  borderTopColor: C.navy,
                  backgroundColor: C.bgLighter,
                }}
              >
                <Text
                  style={{
                    flex: 2,
                    fontSize: 13,
                    fontWeight: "800",
                    color: C.text,
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
                    color: C.navy,
                    textAlign: "right",
                  }}
                >
                  R {TOTAL.toLocaleString()}
                </Text>
              </View>
            </View>
          </>
        ) : (
          /* Line items view */
          <View style={{ marginHorizontal: 16 }}>
            {DEDUCTION_ROWS.map((cat, ci) => (
              <View
                key={ci}
                style={{
                  backgroundColor: C.white,
                  borderRadius: 14,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: C.border,
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    backgroundColor: C.navy,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{ color: C.white, fontSize: 13, fontWeight: "700" }}
                  >
                    {cat.category}
                  </Text>
                  <Text
                    style={{ color: C.teal, fontSize: 13, fontWeight: "700" }}
                  >
                    R {cat.amount.toLocaleString()}
                  </Text>
                </View>
                <View style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
                  <Text style={{ fontSize: 11, color: C.textSub }}>
                    ITR12 Code {cat.itr12} · {cat.receipts} receipts
                  </Text>
                  <View
                    style={{
                      height: 4,
                      backgroundColor: C.bgLight,
                      borderRadius: 2,
                      marginTop: 8,
                    }}
                  >
                    <View
                      style={{
                        width: `${(cat.amount / TOTAL) * 100}%`,
                        height: 4,
                        backgroundColor: C.teal,
                        borderRadius: 2,
                      }}
                    />
                  </View>
                  <Text
                    style={{ fontSize: 10, color: C.textSub, marginTop: 4 }}
                  >
                    {((cat.amount / TOTAL) * 100).toFixed(1)}% of total
                    deductions
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Action buttons */}
        <TouchableOpacity
          onPress={() => navigation?.navigate("ITR12PDFReport")}
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
            Generate PDF Report
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            marginHorizontal: 16,
            borderWidth: 2,
            borderColor: C.navy,
            borderRadius: 14,
            padding: 14,
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <Text style={{ color: C.navy, fontSize: 15, fontWeight: "700" }}>
            Export as CSV
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={{ alignItems: "center", paddingVertical: 8 }}
        >
          <Text style={{ color: C.textSub, fontSize: 13 }}>
            ← Back to Setup
          </Text>
        </TouchableOpacity>
      </View>
    </PhoneShell>
  );
}
