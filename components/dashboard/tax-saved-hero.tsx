import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { StyleSheet, View } from "react-native";

interface TaxSavedHeroProps {
  taxSaved: number;
  month: string;
  deductiblePct: number;
  totalExpenses: number;
}

export function TaxSavedHero({
  taxSaved,
  month,
  deductiblePct,
  totalExpenses,
}: TaxSavedHeroProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <ThemedView
      lightColor="rgba(255,255,255,0.10)"
      darkColor="rgba(0,0,0,0.10)"
      style={styles.container}
    >
      <ThemedText
        lightColor="rgba(255,255,255,0.6)"
        darkColor="rgba(100,100,100,0.6)"
        style={styles.label}
      >
        TAX SAVED — {month.toUpperCase()}
      </ThemedText>

      <ThemedText style={styles.amount}>
        R {taxSaved.toLocaleString()}
      </ThemedText>

      <View style={styles.footer}>
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>
            ↑ {deductiblePct}% deductible
          </ThemedText>
        </View>
        <ThemedText
          lightColor="rgba(255,255,255,0.5)"
          darkColor="rgba(100,100,100,0.5)"
          style={styles.subtitle}
        >
          of R{totalExpenses.toLocaleString()} tracked
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  label: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
    fontWeight: "600",
  },
  amount: {
    fontSize: 38,
    fontWeight: "800",
    lineHeight: 40,
    marginBottom: 10,
    color: "#0288D1",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexDirection: "row",
  },
  badge: {
    backgroundColor: "#0288D1",
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 11,
  },
});
