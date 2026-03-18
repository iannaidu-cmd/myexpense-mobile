import { ThemedText } from "@/components/themed-text";
import { StyleSheet, View } from "react-native";

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>{title}</ThemedText>
      {subtitle && <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0D47A1",
    paddingVertical: 32,
    paddingHorizontal: 22,
    justifyContent: "flex-end",
    minHeight: 140,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 1.6,
  },
});
