import { ThemedText } from "@/components/themed-text";
import {
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
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
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <ThemedText style={styles.title}>ITR12 Category</ThemedText>

          <ScrollView style={styles.scrollContainer}>
            <View style={styles.grid}>
              {categories.map((cat, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.categoryOption,
                    selectedIdx === i && {
                      backgroundColor: cat.color + "18",
                      borderColor: cat.color,
                    },
                  ]}
                  onPress={() => {
                    onSelect(i);
                    onClose();
                  }}
                >
                  <ThemedText style={styles.categoryIcon}>
                    {cat.icon}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.categoryLabel,
                      selectedIdx === i && { color: cat.color },
                    ]}
                  >
                    {cat.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(26,26,92,0.55)",
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: "#F5F5F5",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 100,
    backgroundColor: "#E0E0E0",
    alignSelf: "center",
    marginVertical: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0D47A1",
    marginBottom: 16,
  },
  scrollContainer: {
    maxHeight: "100%",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  categoryOption: {
    width: "48%",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#F5F5F5",
  },
  categoryIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#757575",
    textAlign: "center",
  },
});
