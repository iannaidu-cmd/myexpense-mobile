import { colour, radius, space, typography } from "@/tokens";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import type { Category } from "./types";

interface CategoryPickerProps {
  visible: boolean;
  categories: Category[];
  selectedIdx: number | null;
  onSelect: (idx: number) => void;
  onClose: () => void;
}

export function CategoryPicker({
  visible,
  categories,
  selectedIdx,
  onSelect,
  onClose,
}: CategoryPickerProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(31,32,36,0.55)",
          justifyContent: "flex-end",
        }}
      >
        {/* Backdrop tap to close */}
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Sheet */}
        <View
          style={{
            backgroundColor: colour.surface1,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            paddingHorizontal: space.xl,
            paddingBottom: 40,
            maxHeight: "80%",
          }}
        >
          {/* Handle */}
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: radius.pill,
              backgroundColor: colour.border,
              alignSelf: "center",
              marginVertical: space.xl,
            }}
          />

          <Text
            style={{
              ...typography.h4,
              color: colour.text,
              marginBottom: space.lg,
            }}
          >
            ITR12 Category
          </Text>

          <ScrollView style={{ maxHeight: "100%" }}>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: space.sm,
                justifyContent: "space-between",
              }}
            >
              {categories.map((cat, i) => {
                const isSelected = selectedIdx === i;
                return (
                  <TouchableOpacity
                    key={i}
                    style={{
                      width: "48%",
                      alignItems: "center",
                      paddingVertical: space.md,
                      paddingHorizontal: 14,
                      borderRadius: radius.md,
                      backgroundColor: isSelected
                        ? cat.color + "18"
                        : colour.white,
                      borderWidth: 1.5,
                      borderColor: isSelected ? cat.color : colour.borderLight,
                    }}
                    onPress={() => {
                      onSelect(i);
                      onClose();
                    }}
                  >
                    <Text style={{ fontSize: 20, marginBottom: space.xs }}>
                      {cat.icon}
                    </Text>
                    <Text
                      style={{
                        ...typography.labelS,
                        color: isSelected ? cat.color : colour.textSub,
                        textAlign: "center",
                      }}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
