import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { colour, radius, space, typography } from "@/tokens";
import React, { useState } from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface GuideEntry {
  icon: string;
  iconBg: string;
  iconColor: string;
  category: string;
  section: string;
  itr12Line: string;
  deductPct: string;
  condition: string;
  docs: string;
}

const GUIDE: GuideEntry[] = [
  {
    icon: "car.fill",
    iconBg: colour.warningBg,
    iconColor: colour.warning,
    category: "Travel & Vehicle",
    section: "S11(a)",
    itr12Line: "4011",
    deductPct: "100%",
    condition: "Business travel only. Logbook required.",
    docs: "Logbook, fuel receipts, trip purpose",
  },
  {
    icon: "house.fill",
    iconBg: colour.tealLight,
    iconColor: colour.teal,
    category: "Home Office",
    section: "S11(a)",
    itr12Line: "4018",
    deductPct: "Floor ratio",
    condition:
      "Dedicated workspace used regularly and exclusively for business. General costs (utilities, levies, rates) are claimed proportionally: office m² ÷ total floor m².",
    docs: "Floor plan or measurements, utility bills, lease or title deed",
  },
  {
    icon: "building.columns.fill",
    iconBg: colour.primary50,
    iconColor: colour.primary,
    category: "Home Office — Bond Interest",
    section: "S11(a)",
    itr12Line: "4018",
    deductPct: "Floor ratio",
    condition:
      "Sole proprietors and freelancers may deduct the proportional interest portion of their home bond — not the capital repayment. Formula: (Office m² ÷ Total floor m²) × Annual bond interest paid. The workspace must be used exclusively and regularly for trade.",
    docs: "Annual bond statement (interest vs capital split), floor plan or room measurements, proof of exclusive business use",
  },
  {
    icon: "key.fill",
    iconBg: colour.successBg,
    iconColor: colour.success,
    category: "Home Office — Rent",
    section: "S11(a)",
    itr12Line: "4018",
    deductPct: "Floor ratio",
    condition:
      "Renters may deduct the proportional rental cost attributable to the home office. Formula: (Office m² ÷ Total floor m²) × Annual rent paid. The workspace must be used exclusively and regularly for trade.",
    docs: "Lease agreement, monthly rental invoices or bank statements, floor plan or room measurements",
  },
  {
    icon: "wrench.fill",
    iconBg: colour.surface2,
    iconColor: colour.textSub,
    category: "Equipment & Tools",
    section: "S11(e)",
    itr12Line: "4022",
    deductPct: "Wear & Tear",
    condition: "Business use assets. Depreciation schedule applies.",
    docs: "Purchase invoice, asset register",
  },
  {
    icon: "laptopcomputer",
    iconBg: colour.primary50,
    iconColor: colour.accentDeep,
    category: "Software & Subscr.",
    section: "S11(a)",
    itr12Line: "4011",
    deductPct: "100%",
    condition: "Business-use software and services only.",
    docs: "Invoices or statements",
  },
  {
    icon: "fork.knife",
    iconBg: colour.warningBg,
    iconColor: colour.warning,
    category: "Meals & Entertain.",
    section: "S11(a)",
    itr12Line: "4011",
    deductPct: "80%",
    condition: "80% of amount. Business purpose must be documented.",
    docs: "Receipt with attendees and purpose noted",
  },
  {
    icon: "doc.text.fill",
    iconBg: colour.primary50,
    iconColor: colour.accentDeep,
    category: "Professional Fees",
    section: "S11(a)",
    itr12Line: "4011",
    deductPct: "100%",
    condition: "Legal, accounting, consulting fees for business.",
    docs: "Tax invoice from registered practitioner",
  },
  {
    icon: "bolt.fill",
    iconBg: colour.warningBg,
    iconColor: colour.warning,
    category: "Utilities",
    section: "S11(a)",
    itr12Line: "4011",
    deductPct: "Office ratio",
    condition: "Proportional to home office floor area.",
    docs: "Municipal bill, floor plan calculation",
  },
  {
    icon: "megaphone.fill",
    iconBg: colour.dangerBg,
    iconColor: colour.danger,
    category: "Marketing & Adverts",
    section: "S11(a)",
    itr12Line: "4011",
    deductPct: "100%",
    condition: "Direct business promotion expenses.",
    docs: "Invoice, proof of business purpose",
  },
  {
    icon: "creditcard.fill",
    iconBg: colour.surface2,
    iconColor: colour.textSub,
    category: "Bank Charges",
    section: "S11(a)",
    itr12Line: "4011",
    deductPct: "100%",
    condition: "Business account charges only.",
    docs: "Bank statement",
  },
  {
    icon: "phone.fill",
    iconBg: colour.primary50,
    iconColor: colour.primary,
    category: "Communication",
    section: "S11(a)",
    itr12Line: "4011",
    deductPct: "Business %",
    condition: "Business % of phone/internet costs.",
    docs: "Invoice, call log or allocation method",
  },
  {
    icon: "graduationcap.fill",
    iconBg: colour.successBg,
    iconColor: colour.success,
    category: "Training & CPD",
    section: "S11(a)",
    itr12Line: "4011",
    deductPct: "100%",
    condition: "Job-related training and professional development.",
    docs: "Invoice, certificate of attendance",
  },
  {
    icon: "person.fill",
    iconBg: colour.surface2,
    iconColor: colour.textSub,
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
      activeOpacity={0.7}
      style={{
        backgroundColor: colour.white,
        borderBottomWidth: 1,
        borderBottomColor: colour.borderLight,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: space.md,
          paddingVertical: 14,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: radius.md,
            backgroundColor: entry.iconBg,
            alignItems: "center",
            justifyContent: "center",
            marginRight: space.md,
            flexShrink: 0,
          }}
        >
          <IconSymbol name={entry.icon as any} size={16} color={entry.iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colour.text }}>
            {entry.category}
          </Text>
          <Text style={{ fontSize: 11, color: colour.textSub, marginTop: 2 }}>
            {entry.section} · Line {entry.itr12Line}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: isDeductible ? colour.successBg : colour.surface2,
            borderRadius: radius.sm,
            paddingHorizontal: 8,
            paddingVertical: 3,
            marginRight: space.sm,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: isDeductible ? colour.success : colour.textSub,
            }}
          >
            {entry.deductPct}
          </Text>
        </View>
        <IconSymbol
          name={expanded ? "chevron.down" : "chevron.right"}
          size={14}
          color={colour.textSub}
        />
      </View>

      {expanded && (
        <View
          style={{
            paddingHorizontal: space.md,
            paddingBottom: space.md,
            backgroundColor: colour.surface1,
            borderTopWidth: 1,
            borderTopColor: colour.borderLight,
          }}
        >
          <View style={{ marginBottom: space.sm, marginTop: space.sm }}>
            <Text
              style={{
                ...typography.labelS,
                color: colour.textSub,
                letterSpacing: 0.5,
                marginBottom: 4,
              }}
            >
              CONDITION
            </Text>
            <Text style={{ fontSize: 13, color: colour.text, lineHeight: 19 }}>
              {entry.condition}
            </Text>
          </View>
          <View>
            <Text
              style={{
                ...typography.labelS,
                color: colour.textSub,
                letterSpacing: 0.5,
                marginBottom: 4,
              }}
            >
              REQUIRED DOCUMENTATION
            </Text>
            <Text style={{ fontSize: 13, color: colour.text, lineHeight: 19 }}>
              {entry.docs}
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: colour.textHint, marginTop: 8 }}>
            Retain all supporting documents for 5 years (SARS requirement).
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function DeductibilityGuideScreen() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<"All" | "Deductible" | "Not Deductible">("All");

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
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />

      <MXHeader title="Deductibility Guide" showBack />

      {/* Search bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colour.surface1,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colour.borderLight,
          paddingHorizontal: space.md,
          paddingVertical: space.sm,
          marginHorizontal: space.lg,
          marginBottom: space.sm,
        }}
      >
        <IconSymbol name="magnifyingglass" size={15} color={colour.textSub} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search categories…"
          placeholderTextColor={colour.textHint}
          style={{
            flex: 1,
            color: colour.text,
            fontSize: 14,
            marginLeft: space.sm,
            paddingVertical: 0,
          }}
        />
      </View>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingVertical: space.xs, gap: space.xs }}
      >
        {(["All", "Deductible", "Not Deductible"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={{
              paddingHorizontal: space.md,
              paddingVertical: 6,
              borderRadius: radius.pill,
              backgroundColor: filter === f ? colour.noir : colour.surface1,
              borderWidth: 1,
              borderColor: filter === f ? colour.noir : colour.borderLight,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: filter === f ? colour.onNoir : colour.textSub,
              }}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* SARS disclaimer */}
        <View
          style={{
            marginHorizontal: space.lg,
            marginVertical: space.sm,
            backgroundColor: colour.primary50,
            borderRadius: radius.md,
            padding: space.md,
            flexDirection: "row",
            alignItems: "flex-start",
            gap: space.sm,
          }}
        >
          <IconSymbol name="info.circle.fill" size={16} color={colour.primary} style={{ marginTop: 1 } as any} />
          <Text style={{ flex: 1, fontSize: 12, color: colour.textSub, lineHeight: 18 }}>
            Based on SARS Income Tax Act provisions. Always confirm
            deductibility with a registered tax practitioner. Rules may change annually.
          </Text>
        </View>

        {/* Guide list */}
        <View
          style={{
            marginHorizontal: space.lg,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colour.borderLight,
            overflow: "hidden",
            marginBottom: space.xl,
          }}
        >
          {filtered.length > 0 ? (
            filtered.map((entry) => (
              <GuideCard
                key={entry.category}
                entry={entry}
                expanded={expanded === entry.category}
                onToggle={() =>
                  setExpanded(expanded === entry.category ? null : entry.category)
                }
              />
            ))
          ) : (
            <View
              style={{
                padding: space.xl,
                alignItems: "center",
                backgroundColor: colour.white,
              }}
            >
              <IconSymbol name="magnifyingglass" size={32} color={colour.textSub} />
              <Text style={{ fontSize: 13, color: colour.textSub, marginTop: space.md }}>
                No categories match "{search}"
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <MXTabBar />
    </SafeAreaView>
  );
}
