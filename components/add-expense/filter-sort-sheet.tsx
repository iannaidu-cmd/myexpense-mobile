import { colour, radius, space, typography } from "@/tokens";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

interface FilterSortSheetProps {
  onApplyFilters?: (filters: { sortBy: string; filterBy: string }) => void;
  onCancel?: () => void;
}

const SORT_OPTIONS = [
  { id: "date",   label: "📅 Date (Newest)" },
  { id: "amount", label: "💵 Amount (Highest)" },
  { id: "vendor", label: "🏢 Vendor (A-Z)" },
];

const FILTER_OPTIONS = [
  { id: "all",          label: "All expenses"         },
  { id: "deductible",   label: "✓ Deductible only"    },
  { id: "non-deductible",label: "✗ Non-deductible"     },
  { id: "month",        label: "📅 This month"        },
];

export function FilterSortSheet({
  onApplyFilters,
  onCancel,
}: FilterSortSheetProps) {
  const [sortBy,   setSortBy]   = useState("date");
  const [filterBy, setFilterBy] = useState("all");

  const OptionList = ({
    title,
    options,
    selected,
    onSelect,
  }: {
    title: string;
    options: { id: string; label: string }[];
    selected: string;
    onSelect: (id: string) => void;
  }) => (
    <View style={{ marginBottom: 28 }}>
      <Text
        style={{
          ...typography.labelM,
          color: colour.text,
          marginBottom: space.md,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: colour.surface1,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colour.border,
          overflow: "hidden",
        }}
      >
        {options.map((option, index) => {
          const isSelected = selected === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => onSelect(option.id)}
              style={{
                paddingHorizontal: space.lg,
                paddingVertical: 14,
                borderBottomWidth: index === options.length - 1 ? 0 : 1,
                borderBottomColor: colour.border,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: isSelected ? colour.primary50 : colour.white,
              }}
            >
              <Text style={{ ...typography.bodyM, color: colour.text }}>
                {option.label}
              </Text>
              {isSelected && (
                <Text style={{ ...typography.bodyM, color: colour.primary }}>
                  ✓
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colour.white }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: space.xl,
          paddingTop: space.xl,
          paddingBottom: space.xl,
          backgroundColor: colour.primary,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ ...typography.h4, color: colour.white }}>
          Filter & sort
        </Text>
        <Pressable onPress={onCancel}>
          <Text
            style={{ ...typography.h4, color: "rgba(255,255,255,0.65)" }}
          >
            ✕
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1, padding: space.xl }}
        showsVerticalScrollIndicator={false}
      >
        <OptionList
          title="Sort by"
          options={SORT_OPTIONS}
          selected={sortBy}
          onSelect={setSortBy}
        />
        <OptionList
          title="Filter by"
          options={FILTER_OPTIONS}
          selected={filterBy}
          onSelect={setFilterBy}
        />
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer buttons */}
      <View
        style={{
          flexDirection: "row",
          gap: space.md,
          paddingHorizontal: space.xl,
          paddingVertical: space.xl,
          borderTopWidth: 1,
          borderTopColor: colour.border,
        }}
      >
        <Pressable
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: radius.md,
            borderWidth: 1.5,
            borderColor: colour.border,
            alignItems: "center",
          }}
          onPress={onCancel}
        >
          <Text style={{ ...typography.labelM, color: colour.text }}>
            Cancel
          </Text>
        </Pressable>
        <Pressable
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: radius.md,
            backgroundColor: colour.primary,
            alignItems: "center",
          }}
          onPress={() => {
            onApplyFilters?.({ sortBy, filterBy });
            onCancel?.();
          }}
        >
          <Text style={{ ...typography.labelM, color: colour.onPrimary }}>
            Apply
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
