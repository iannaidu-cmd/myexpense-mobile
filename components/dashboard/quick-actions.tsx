import { colour, radius, typography } from "@/tokens";
import { Text, TouchableOpacity, View } from "react-native";

interface Action { icon: string; label: string; color: string; }

const ACTIONS: Action[] = [
  { icon: "📸", label: "Scan receipt", color: colour.info    },
  { icon: "✏️", label: "Add expense",  color: colour.primary },
  { icon: "📊", label: "ITR12 Export", color: colour.info    },
  { icon: "📋", label: "Reports",      color: colour.primary },
];

export function QuickActions() {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-around",
        paddingVertical: 16,
        borderRadius: radius.lg,
      }}
    >
      {ACTIONS.map((action) => (
        <TouchableOpacity
          key={action.label}
          style={{ alignItems: "center", gap: 8 }}
          accessibilityRole="button"
        >
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 16,
              backgroundColor: action.color + "18",
              borderWidth: 2,
              borderColor: action.color + "33",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 22 }}>{action.icon}</Text>
          </View>
          <Text
            style={{
              ...typography.micro,
              fontWeight: "600",
              color: colour.primary,
              textAlign: "center",
              maxWidth: 60,
            }}
          >
            {action.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
