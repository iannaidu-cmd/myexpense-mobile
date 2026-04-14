// ─── tax-saved-hero.tsx ───────────────────────────────────────────────────────
import { colour, radius, typography } from "@/tokens";
import { Text, View } from "react-native";

interface TaxSavedHeroProps {
  taxSaved: number; month: string;
  deductiblePct: number; totalExpenses: number;
}

export function TaxSavedHero({ taxSaved, month, deductiblePct, totalExpenses }: TaxSavedHeroProps) {
  return (
    <View
      style={{
        borderRadius: radius.lg,
        paddingVertical: 18,
        paddingHorizontal: 22,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
        backgroundColor: "rgba(255,255,255,0.10)",
      }}
    >
      <Text style={{ fontSize: 11, letterSpacing: 1, marginBottom: 6, fontWeight: "600", color: "rgba(255,255,255,0.6)" }}>
        Tax saved — {month}
      </Text>
      <Text style={{ fontSize: 38, fontWeight: "800", lineHeight: 40, marginBottom: 10, color: colour.teal }}>
        R {taxSaved.toLocaleString()}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View
          style={{
            backgroundColor: colour.teal,
            borderRadius: radius.pill,
            paddingVertical: 3,
            paddingHorizontal: 10,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "700", color: colour.white }}>
            ↑ {deductiblePct}% deductible
          </Text>
        </View>
        <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
          of R{totalExpenses.toLocaleString()} tracked
        </Text>
      </View>
    </View>
  );
}
