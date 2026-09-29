// ─── VehiclePicker ────────────────────────────────────────────────────────────
// Radio-style list of the user's vehicles for a mileage trip, with an
// "Add vehicle" row. Same selected/unselected styling as the trip purpose list.

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
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: space.sm,
              paddingHorizontal: space.sm,
              borderRadius: radius.md,
              backgroundColor: selected ? colour.primary50 : "transparent",
              marginBottom: 4,
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: selected ? colour.primary : colour.border,
                alignItems: "center",
                justifyContent: "center",
                marginRight: space.sm,
              }}
            >
              {selected && (
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colour.primary }} />
              )}
            </View>
            <Text style={{ ...typography.bodyM, color: colour.text, flex: 1 }}>{vehicleLabel(v)}</Text>
            <Text style={{ ...typography.bodyXS, color: colour.textSub }}>{v.registration}</Text>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity
        onPress={onAddVehicle}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: space.sm,
          paddingHorizontal: space.sm,
          gap: space.sm,
        }}
      >
        <IconSymbol name="plus.circle.fill" size={20} color={colour.primary} />
        <Text style={{ ...typography.actionS, color: colour.primary }}>
          {vehicles.length === 0 ? "Add your vehicle" : "Add another vehicle"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
