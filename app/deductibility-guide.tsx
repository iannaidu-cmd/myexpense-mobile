import { MXTabBar } from "@/components/MXTabBar";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { colour, space } from "@/tokens";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, TextInput, TouchableOpacity, View } from "react-native";

const NAV = { Home: "⊞", Scan: "⊡", Reports: "◈", Settings: "⚙" };

function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemedView style={{ flex: 1, backgroundColor: colour.surface1 }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      <MXTabBar />
    </ThemedView>
  );
}

interface GuideEntry {
  icon: string;
  category: string;
  section: string;
  itr12Line: string;
  deductPct: string;
  condition: string;
  docs: string;
}

const GUIDE: GuideEntry[] = [
  {
    icon: "🚗",
    category: "Travel & Vehicle",
    section: "S11(a)",
    itr12Line: "4011",
    deductPct: "100%",
    condition: "Business travel only. Logbook required.",
    docs: "Logbook, fuel receipts, trip purpose",
  },
  {
    icon: "🏠",
    category: "Home Office",
    section: "S11(a)",
    itr12Line: "4018",
    deductPct: "Floor ratio",
    condition: "Dedicated workspace used regularly for business.",
    docs: "Floor plan, utility bills, lease agreement",
  },
  {
    icon: "🔧",
    category: "Equipment & Tools",
    section: "S11(e)",
    itr12Line: "4022",
    deductPct: "Wear & Tear",
    condition: "Business use assets. Depreciation schedule applies.",
    docs: "Purchase invoice, asset register",
  },
  {
    icon: "💻",
    category: "Software & Subscr.",
    section: "S11(a)",
    itr12Line: "4011",
    deductPct: "100%",
    condition: "Business-use software and services only.",
    docs: "Invoices or statements",
  },
  {
    icon: "🍽",
    category: "Meals & Entertain.",
    section: "S11(a)",
    itr12Line: "4011",
    deductPct: "80%",
    condition: "80% of amount. Business purpose must be documented.",
    docs: "Receipt with attendees and purpose noted",
  },
  {
    icon: "📋",
    category: "Professional Fees",
    section: "S11(a)",
    itr12Line: "4011",
    deductPct: "100%",
    condition: "Legal, accounting, consulting fees for business.",
    docs: "Tax invoice from registered practitioner",
  },
  {
    icon: "⚡",
    category: "Utilities",
    section: "S11(a)",
    itr12Line: "4011",
    deductPct: "Office ratio",
    condition: "Proportional to home office floor area.",
    docs: "Municipal bill, floor plan calculation",
  },
  {
    icon: "📣",
    category: "Marketing & Adverts",
    section: "S11(a)",
    itr12Line: "4011",
    deductPct: "100%",
    condition: "Direct business promotion expenses.",
    docs: "Invoice, proof of business purpose",
  },
  {
    icon: "🏦",
    category: "Bank Charges",
    section: "S11(a)",
    itr12Line: "4011",
    deductPct: "100%",
    condition: "Business account charges only.",
    docs: "Bank statement",
  },
  {
    icon: "📞",
    category: "Communication",
    section: "S11(a)",
    itr12Line: "4011",
    deductPct: "Business %",
    condition: "Business % of phone/internet costs.",
    docs: "Invoice, call log or allocation method",
  },
  {
    icon: "🎓",
    category: "Training & CPD",
    section: "S11(a)",
    itr12Line: "4011",
    deductPct: "100%",
    condition: "Job-related training and professional development.",
    docs: "Invoice, certificate of attendance",
  },
  {
    icon: "👤",
    category: "Personal Expenses",
    section: "Not allowed",
    itr12Line: "—",
    deductPct: "0%",
    condition: "Personal expenses may not be claimed.",
    docs: "N/A",
  },
];

function GuideCard({
  entry,
  expanded,
  onToggle,
}: {
  entry: GuideEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isDeductible = entry.deductPct !== "0%";
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={{
        backgroundColor: colour.background,
        borderBottomWidth: 1,
        borderBottomColor: colour.border,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: space.md,
          paddingVertical: space.md,
        }}
      >
        <ThemedText style={{ fontSize: 20, marginRight: space.md }}>
          {entry.icon}
        </ThemedText>
        <View style={{ flex: 1 }}>
          <ThemedText
            style={{ fontSize: 13, fontWeight: "600", color: colour.text }}
          >
            {entry.category}
          </ThemedText>
          <ThemedText
            style={{ fontSize: 11, color: colour.textSub, marginTop: 2 }}
          >
            {entry.section} · Line {entry.itr12Line}
          </ThemedText>
        </View>
        <View style={{ alignItems: "flex-end", marginRight: space.md }}>
          <View
            style={{
              backgroundColor: isDeductible
                ? colour.successLight
                : colour.surface2,
              borderRadius: space.xxs,
              paddingHorizontal: space.xxs,
              paddingVertical: 3,
            }}
          >
            <ThemedText
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: isDeductible ? colour.successMid : colour.textSub,
              }}
            >
              {entry.deductPct}
            </ThemedText>
          </View>
        </View>
        <ThemedText style={{ color: colour.primary, fontSize: 16 }}>
          {expanded ? "∨" : "›"}
        </ThemedText>
      </View>
      {expanded && (
        <ThemedView
          style={{
            paddingHorizontal: space.md,
            paddingBottom: space.md,
            backgroundColor: colour.surface1,
          }}
        >
          <View style={{ marginBottom: space.xxs }}>
            <ThemedText
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: colour.textSub,
                letterSpacing: 0.5,
                marginBottom: 4,
              }}
            >
              Condition
            </ThemedText>
            <ThemedText
              style={{ fontSize: 13, color: colour.text, lineHeight: 19 }}
            >
              {entry.condition}
            </ThemedText>
          </View>
          <View>
            <ThemedText
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: colour.textSub,
                letterSpacing: 0.5,
                marginBottom: 4,
              }}
            >
              Required documentation
            </ThemedText>
            <ThemedText
              style={{ fontSize: 13, color: colour.text, lineHeight: 19 }}
            >
              {entry.docs}
            </ThemedText>
          </View>
          <ThemedText
            style={{ fontSize: 11, color: colour.textSub, marginTop: 8 }}
          >
            Retain all supporting documents for 5 years (SARS requirement).
          </ThemedText>
        </ThemedView>
      )}
    </TouchableOpacity>
  );
}

export default function DeductibilityGuideScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<"All" | "Deductible" | "Not Deductible">(
    "All",
  );

  const filtered = GUIDE.filter((e) => {
    const matchSearch =
      e.category.toLowerCase().includes(search.toLowerCase()) ||
      e.section.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "All"
        ? true
        : filter === "Deductible"
          ? e.deductPct !== "0%"
          : e.deductPct === "0%";
    return matchSearch && matchFilter;
  });

  return (
    <PhoneShell>
      <ThemedView
        style={{
          backgroundColor: colour.primary,
          paddingTop: space.xxl,
          paddingBottom: space.xl,
          paddingHorizontal: space.lg,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginBottom: space.md }}
        >
          <ThemedText style={{ color: colour.accent, fontSize: 13 }}>
            ‹ Tax summary
          </ThemedText>
        </TouchableOpacity>
        <ThemedText
          style={{
            color: colour.accent,
            fontSize: 12,
            fontWeight: "600",
            letterSpacing: 1,
          }}
        >
          TAX & ITR12
        </ThemedText>
        <ThemedText
          style={{
            color: colour.onPrimary,
            fontSize: 22,
            fontWeight: "800",
            marginTop: 4,
          }}
        >
          Deductibility Guide
        </ThemedText>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colour.primary200,
            borderRadius: space.md,
            paddingHorizontal: space.md,
            paddingVertical: space.md,
            marginTop: space.md,
          }}
        >
          <ThemedText style={{ fontSize: 16, marginRight: space.md }}>
            🔍
          </ThemedText>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search categories…"
            placeholderTextColor={colour.textSub}
            style={{ flex: 1, color: colour.onPrimary, fontSize: 14 }}
          />
        </View>
      </ThemedView>

      <ThemedView
        style={{
          backgroundColor: colour.surface1,
          borderTopLeftRadius: space.xl,
          borderTopRightRadius: space.xl,
          marginTop: -16,
          paddingBottom: space.xl,
        }}
      >
        {/* SARS disclaimer */}
        <View
          style={{
            margin: space.md,
            backgroundColor: colour.primary200,
            borderRadius: space.md,
            padding: space.md,
            flexDirection: "row",
            alignItems: "flex-start",
          }}
        >
          <ThemedText style={{ fontSize: 18, marginRight: space.md }}>
            ⚖️
          </ThemedText>
          <ThemedText
            style={{
              flex: 1,
              fontSize: 12,
              color: colour.textSub,
              lineHeight: 18,
            }}
          >
            Based on SARS Income Tax Act provisions. Always confirm
            deductibility with a registered tax practitioner. Rules may change
            annually.
          </ThemedText>
        </View>

        {/* Filter */}
        <ThemedView
          style={{ paddingHorizontal: space.md, marginBottom: space.md }}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: space.xxs }}>
              {(["All", "Deductible", "Not Deductible"] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFilter(f)}
                  style={{
                    paddingHorizontal: space.md,
                    paddingVertical: space.xxs,
                    borderRadius: 20,
                    backgroundColor:
                      filter === f ? colour.primary : colour.surface2,
                  }}
                >
                  <ThemedText
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: filter === f ? colour.onPrimary : colour.textSub,
                    }}
                  >
                    {f}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </ThemedView>

        <ThemedView
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colour.border,
            overflow: "hidden",
          }}
        >
          {filtered.length > 0 ? (
            filtered.map((entry, i) => (
              <GuideCard
                key={i}
                entry={entry}
                expanded={expanded === entry.category}
                onToggle={() =>
                  setExpanded(
                    expanded === entry.category ? null : entry.category,
                  )
                }
              />
            ))
          ) : (
            <ThemedView
              style={{
                padding: space.xl,
                alignItems: "center",
                backgroundColor: colour.background,
              }}
            >
              <ThemedText style={{ fontSize: 32 }}>🔍</ThemedText>
              <ThemedText
                style={{
                  fontSize: 13,
                  color: colour.textSub,
                  marginTop: space.md,
                }}
              >
                No categories match "{search}"
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      </ThemedView>
    </PhoneShell>
  );
}
