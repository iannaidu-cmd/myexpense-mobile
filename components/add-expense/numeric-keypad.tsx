import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface NumericKeypadProps {
  onKeyPress: (key: string) => void;
}

export function NumericKeypad({ onKeyPress }: NumericKeypadProps) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

  return (
    <View style={styles.container}>
      {keys.map((key) => (
        <TouchableOpacity
          key={key}
          onPress={() => onKeyPress(key)}
          style={[styles.key, key === "⌫" && styles.deleteKey]}
          activeOpacity={0.7}
        >
          <Text style={[styles.keyText, key === "⌫" && styles.deleteKeyText]}>
            {key}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
  },
  key: {
    width: "31%",
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  deleteKey: {
    backgroundColor: "rgba(2,136,209,0.1)",
  },
  keyText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0D47A1",
  },
  deleteKeyText: {
    color: "#0288D1",
    fontSize: 18,
  },
});
