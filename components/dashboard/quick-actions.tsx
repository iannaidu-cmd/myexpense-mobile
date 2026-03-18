import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface Action {
  icon: string;
  label: string;
  color: string;
}

const ACTIONS: Action[] = [
  { icon: "📸", label: "Scan Receipt", color: "#0288D1" },
  { icon: "✏️", label: "Add Expense", color: "#1565C0" },
  { icon: "📊", label: "ITR12 Export", color: "#0288D1" },
  { icon: "📋", label: "Reports", color: "#1565C0" },
];

export function QuickActions() {
  const backgroundColor = useThemeColor({}, "background");

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {ACTIONS.map((action) => (
        <TouchableOpacity
          key={action.label}
          style={styles.action}
          accessibilityRole="button"
        >
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: action.color + "18",
                borderColor: action.color + "33",
              },
            ]}
          >
            <ThemedText style={styles.icon}>{action.icon}</ThemedText>
          </View>
          <ThemedText style={styles.label}>{action.label}</ThemedText>
        </TouchableOpacity>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 0,
    paddingVertical: 16,
    borderRadius: 20,
    marginHorizontal: -20,
  },
  action: {
    alignItems: "center",
    gap: 8,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    borderWidth: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 22,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    color: "#1565C0",
    textAlign: "center",
    lineHeight: 1.2,
    maxWidth: 60,
  },
});
