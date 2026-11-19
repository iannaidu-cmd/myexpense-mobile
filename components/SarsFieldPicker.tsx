import { sarsFieldTypes, validSarsField } from "@/lib/itr12Summary";
import { colour, radius, space, typography } from "@/tokens";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  category: string;
  /** Saved ITR12 field, or null for the category's default. */
  value: string | null;
  onChange: (field: string) => void;
}

/**
 * "Type" chips for categories that go into more than one ITR12 field
 * (Professional Fees, Home Office). Renders nothing for other categories.
 */
export function SarsFieldPicker({ category, value, onChange }: Props) {
  const types = sarsFieldTypes(category);
  if (!types) return null;
  const selected = validSarsField(category, value) ?? types[0].field;
  const current = types.find((t) => t.field === selected)!;

  return (
    <View style={{ marginBottom: space.md }}>
      <Text style={{ fontSize: 11, fontWeight: "700", color: colour.textSub, letterSpacing: 0.5, marginBottom: 8 }}>
        Type
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs }}>
        {types.map((t) => {
          const on = t.field === selected;
          return (
            <TouchableOpacity
              key={t.label}
              onPress={() => onChange(t.field)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: on ? colour.primary : colour.border,
                backgroundColor: on ? colour.primary : colour.white,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: on ? colour.onPrimary : colour.text }}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={{ ...typography.bodyXS, color: colour.textSub, marginTop: space.xs }}>
        Goes in the ITR12 field: {current.field}
      </Text>
      {current.hint ? (
        <Text style={{ ...typography.bodyXS, color: colour.textMid, marginTop: 2 }}>{current.hint}</Text>
      ) : null}
    </View>
  );
}
