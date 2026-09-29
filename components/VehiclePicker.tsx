// ─── VehiclePicker ────────────────────────────────────────────────────────────
// Radio-style list of the user's vehicles for a mileage trip, with an
// "Add vehicle" row. Sits inside a SectionCard (components/MXSection.tsx) and
// uses the mockup's list-item type roles (itemTitle / itemSub).

import { IconSymbol } from "@/components/ui/icon-symbol";
import { vehicleLabel, type Vehicle } from "@/stores/vehicleStore";
import { colour, radius, space, typography } from "@/tokens";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface VehiclePickerProps {
  vehicles: Vehicle[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddVehicle: () => void;
}

export function VehiclePicker({ vehicles, selectedId, onSelect, onAddVehicle }: VehiclePickerProps) {
  return (
    <View>
      {vehicles.map((v) => {
        const selected = v.id === selectedId;
        return (
          <TouchableOpacity
            key={v.id}
            onPress={() => onSelect(v.id)}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: space.sm,
              paddingHorizontal: space.sm,
              borderRadius: radius.md,
              backgroundColor: selected ? colour.primary50 : "transparent",
              marginBottom: 4,
              gap: space.md,
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: selected ? colour.primary : colour.border,
                backgroundColor: selected ? colour.primary : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {selected && (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colour.onPrimary }} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.itemTitle, color: colour.textPrimary }} numberOfLines={1}>
                {vehicleLabel(v)}
              </Text>
              <Text style={{ ...typography.itemSub, color: colour.textSecondary, marginTop: 2 }}>
                {v.registration}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity
        onPress={onAddVehicle}
        activeOpacity={0.7}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: space.sm,
          paddingHorizontal: space.sm,
          gap: space.md,
        }}
      >
        <IconSymbol name="plus.circle.fill" size={20} color={colour.primary} />
        <Text style={{ ...typography.mTbtn, color: colour.primary }}>
          {vehicles.length === 0 ? "Add your vehicle" : "Add another vehicle"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
