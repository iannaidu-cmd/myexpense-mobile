import { colour, radius, space } from "@/tokens";
import { Text, TouchableOpacity, View } from "react-native";

interface NumericKeypadProps {
  onKeyPress: (key: string) => void;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

export function NumericKeypad({ onKeyPress }: NumericKeypadProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: space.sm,
        backgroundColor: colour.white,
        borderRadius: radius.lg,
        padding: space.lg,
      }}
    >
      {KEYS.map((key) => {
        const isDelete = key === "⌫";
        return (
          <TouchableOpacity
            key={key}
            onPress={() => onKeyPress(key)}
            activeOpacity={0.7}
            style={{
              width: "31%",
              height: 48,
              borderRadius: radius.md,
              backgroundColor: isDelete ? colour.primary50 : colour.surface1,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1.5,
              borderColor: isDelete ? colour.primary100 : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: isDelete ? 18 : 20,
                fontWeight: "700",
                color: isDelete ? colour.primary : colour.text,
              }}
            >
              {key}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
