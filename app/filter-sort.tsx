import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { colour, radius, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SortKey = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

const SORT_OPTIONS: { key: SortKey; label: string; sub: string }[] = [
  {
    key: "date_desc",
    label: "Date (Newest first)",
    sub: "Most recent expenses first",
  },
  {
    key: "date_asc",
    label: "Date (Oldest first)",
    sub: "Oldest expenses first",
  },
  {
    key: "amount_desc",
    label: "Amount (High to low)",
    sub: "Largest expenses first",
  },
  {
    key: "amount_asc",
    label: "Amount (Low to high)",
    sub: "Smallest expenses first",
  },
];

const CATEGORIES = [
  "All categories",
  "Phone & Internet",
  "Fuel & Oil",
  "Software & Subscriptions",
  "Advertising & Marketing",
  "Travel – Business",
  "Home Office",
  "Computer & IT Equipment",
];
const DATE_RANGES = [
  "All time",
  "This month",
  "Last month",
  "This quarter",
  "This tax year",
  "Last tax year",
  "Custom range",
];
const DEDUCTIBILITY = [
  "All",
  "Fully deductible (100%)",
  "Partially deductible",
  "Non-deductible (0%)",
];

export default function FilterSortScreen() {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortKey>("date_desc");
  const [category, setCategory] = useState("All categories");
  const [dateRange, setDateRange] = useState("This month");
  const [deductible, setDeductible] = useState("All");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const activeFilterCount = [
    sortBy !== "date_desc",
    category !== "All categories",
    dateRange !== "This month",
    deductible !== "All",
  ].filter(Boolean).length;

  const handleReset = () => {
    setSortBy("date_desc");
    setCategory("All categories");
    setDateRange("This month");
    setDeductible("All");
    setMinAmount("");
    setMaxAmount("");
  };

  const handleApply = () => router.back();

  const RadioGroup = ({
    label,
    options,
    value,
    onChange,
  }: {
    label: string;
    options: string[];
    value: string;
    onChange: (v: string) => void;
  }) => (
    <View style={{ marginBottom: space.xl }}>
      <Text
        style={[
          typography.labelM,
          { color: colour.textSecondary, marginBottom: space.sm },
        ]}
      >
        {label}
      </Text>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          onPress={() => onChange(opt)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: space.md,
            borderBottomWidth: 1,
            borderBottomColor: colour.border,
          }}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: value === opt ? colour.primary : colour.border,
              alignItems: "center",
              justifyContent: "center",
              marginRight: space.md,
            }}
          >
            {value === opt && (
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: colour.primary,
                }}
              />
            )}
          </View>
          <Text style={[typography.bodyM, { color: colour.textPrimary }]}>
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.bgPage }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colour.bgPage} />

      <MXHeader
        title="Filter & Sort"
        showBack
        right={
          <TouchableOpacity onPress={handleReset} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[typography.labelM, { color: colour.danger }]}>Reset</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={{ padding: space.lg, paddingBottom: 100 }}
      >
        {/* Sort */}
        <Text
          style={[
            typography.labelM,
            { color: colour.textSecondary, marginBottom: space.sm },
          ]}
        >
          SORT BY
        </Text>
        {SORT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            onPress={() => setSortBy(opt.key)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: space.md,
              borderBottomWidth: 1,
              borderBottomColor: colour.border,
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor:
                  sortBy === opt.key ? colour.primary : colour.border,
                alignItems: "center",
                justifyContent: "center",
                marginRight: space.md,
              }}
            >
              {sortBy === opt.key && (
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: colour.primary,
                  }}
                />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyM, { color: colour.textPrimary }]}>
                {opt.label}
              </Text>
              <Text
                style={[typography.caption, { color: colour.textSecondary }]}
              >
                {opt.sub}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        <View
          style={{
            height: 1,
            backgroundColor: colour.border,
            marginVertical: space.xl,
          }}
        />

        <RadioGroup
          label="DATE RANGE"
          options={DATE_RANGES}
          value={dateRange}
          onChange={setDateRange}
        />
        <RadioGroup
          label="CATEGORY"
          options={CATEGORIES}
          value={category}
          onChange={setCategory}
        />
        <RadioGroup
          label="DEDUCTIBILITY"
          options={DEDUCTIBILITY}
          value={deductible}
          onChange={setDeductible}
        />
      </ScrollView>

      {/* Apply button */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colour.bgCard,
          padding: space.lg,
          borderTopWidth: 1,
          borderTopColor: colour.border,
        }}
      >
        <TouchableOpacity
          onPress={handleApply}
          style={{
            backgroundColor: colour.primary,
            borderRadius: radius.pill,
            height: 52,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={[typography.btnL, { color: colour.textOnPrimary }]}>
            Apply Filters
          </Text>
        </TouchableOpacity>
      </View>
      <MXTabBar />
    </SafeAreaView>
  );
}
