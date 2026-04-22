import { colour, radius, space, typography } from "@/tokens";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface DeductionForecastScreenProps {
  navigation?: any;
}

interface ForecastMonth {
  month: string;
  deduct: number;
  actual: boolean;
}

interface CategoryForecast {
  category: string;
  ytd: number;
  projected: number;
  itr12: string;
  color: string;
}

// ─── Tax Brackets (2024/25 SARS) ──────────────────────────────────────────────
const TAX_BRACKETS = [
  { min: 0,       max: 237100,  rate: 0.18, base: 0      },
  { min: 237100,  max: 370500,  rate: 0.26, base: 42678  },
  { min: 370500,  max: 512800,  rate: 0.31, base: 77362  },
  { min: 512800,  max: 673000,  rate: 0.36, base: 121475 },
  { min: 673000,  max: 857900,  rate: 0.39, base: 179147 },
  { min: 857900,  max: 1817000, rate: 0.41, base: 251258 },
  { min: 1817000, max: Infinity,rate: 0.45, base: 644489 },
];
const PRIMARY_REBATE = 17235;

function calcTax(income: number): number {
  const bracket =
    TAX_BRACKETS.find((b) => income >= b.min && income < b.max) ||
    TAX_BRACKETS[TAX_BRACKETS.length - 1];
  return Math.max(bracket.base + (income - bracket.min) * bracket.rate - PRIMARY_REBATE, 0);
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MONTHS_ELAPSED = 6;
const MONTHS_REMAINING = 6;
const YTD_INCOME = 182000;
const YTD_DEDUCTIBLE = 47840;
const MONTHLY_AVG_DEDUCT = YTD_DEDUCTIBLE / MONTHS_ELAPSED;
const PROJECTED_DEDUCT = YTD_DEDUCTIBLE + MONTHLY_AVG_DEDUCT * MONTHS_REMAINING;
const PROJECTED_INCOME = (YTD_INCOME / MONTHS_ELAPSED) * 12;
const TAX_WITHOUT = calcTax(PROJECTED_INCOME);
const TAX_WITH    = calcTax(PROJECTED_INCOME - PROJECTED_DEDUCT);
const TAX_SAVING  = TAX_WITHOUT - TAX_WITH;

const FORECAST_MONTHS: ForecastMonth[] = [
  { month: "Oct", deduct: 7100,               actual: true  },
  { month: "Nov", deduct: 8900,               actual: true  },
  { month: "Dec", deduct: 5600,               actual: true  },
  { month: "Jan", deduct: 9800,               actual: true  },
  { month: "Feb", deduct: 8200,               actual: true  },
  { month: "Mar", deduct: 8240,               actual: true  },
  { month: "Apr", deduct: MONTHLY_AVG_DEDUCT, actual: false },
  { month: "May", deduct: MONTHLY_AVG_DEDUCT, actual: false },
  { month: "Jun", deduct: MONTHLY_AVG_DEDUCT, actual: false },
  { month: "Jul", deduct: MONTHLY_AVG_DEDUCT, actual: false },
  { month: "Aug", deduct: MONTHLY_AVG_DEDUCT, actual: false },
  { month: "Sep", deduct: MONTHLY_AVG_DEDUCT, actual: false },
];
const MAX_DEDUCT = Math.max(...FORECAST_MONTHS.map((m) => m.deduct));

const CATEGORY_FORECAST: CategoryForecast[] = [
  { category: "Travel & Transport", ytd: 8400,  projected: 16800, itr12: "S11(a)", color: colour.primary  },
  { category: "Home Office",        ytd: 6200,  projected: 12400, itr12: "S11(a)", color: colour.info     },
  { category: "Equipment & Tools",  ytd: 5600,  projected: 7800,  itr12: "S11(e)", color: colour.midNavy2 },
  { category: "Software & Subscr.", ytd: 3280,  projected: 6560,  itr12: "S11(a)", color: colour.success  },
  { category: "Professional Fees",  ytd: 2400,  projected: 4800,  itr12: "S11(a)", color: colour.warning  },
  { category: "Other Deductible",   ytd: 21960, projected: 43920, itr12: "S11(a)", color: colour.danger   },
];

// ─── Forecast category row ────────────────────────────────────────────────────
function ForecastCatRow({ item }: { item: CategoryForecast }) {
  const pct = ((item.projected / PROJECTED_DEDUCT) * 100).toFixed(0);
  return (
    <View
      style={{
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colour.border,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: item.color, marginRight: 8 }}
          />
          <Text style={{ ...typography.labelM, color: colour.text }}>{item.category}</Text>
        </View>
        <Text style={{ ...typography.bodyXS, color: colour.textSub }}>{item.itr12}</Text>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
        <Text style={{ ...typography.bodyXS, color: colour.textSub }}>
          YTD: R {item.ytd.toLocaleString()}
        </Text>
        <Text style={{ ...typography.labelS, color: item.color }}>
          Proj: R {item.projected.toLocaleString()}
        </Text>
      </View>
      <View style={{ height: 5, backgroundColor: colour.surface1, borderRadius: 3 }}>
        <View
          style={{ width: `${pct}%` as any, height: 5, borderRadius: 3, backgroundColor: item.color }}
        />
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function DeductionForecastScreen({ navigation }: DeductionForecastScreenProps) {
  const [scenario, setScenario] = useState("Realistic");
  const scenarios = ["Conservative", "Realistic", "Optimistic"];
  const scenarioMultiplier: Record<string, number> = {
    Conservative: 0.85, Realistic: 1.0, Optimistic: 1.15,
  };

  const mult         = scenarioMultiplier[scenario] || 1.0;
  const scenarioDeduc = PROJECTED_DEDUCT * mult;
  const scenarioTax   = calcTax(PROJECTED_INCOME - scenarioDeduc);
  const scenarioSave  = TAX_WITHOUT - scenarioTax;

  return (
    <View style={{ flex: 1, backgroundColor: colour.white }}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View
          style={{
            backgroundColor: colour.primary,
            paddingTop: 52,
            paddingBottom: 28,
            paddingHorizontal: 20,
          }}
        >
          <TouchableOpacity onPress={() => navigation?.goBack()}>
            <Text style={{ color: colour.accent2, fontSize: 13, marginBottom: 10 }}>
              ‹ Reports
            </Text>
          </TouchableOpacity>
          <Text style={{ color: colour.accent2, fontSize: 12, fontWeight: "600", letterSpacing: 1 }}>
            DEDUCTION FORECAST
          </Text>
          <Text style={{ color: colour.white, fontSize: 22, fontWeight: "800", marginTop: 4 }}>
            ITR12 Tax Projection
          </Text>
          <Text style={{ color: colour.textSub, fontSize: 12, marginTop: 4 }}>
            Tax Year 2024/25 · 6 months remaining
          </Text>

          {/* Scenario tabs */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: colour.navyDark,
              borderRadius: radius.md,
              padding: 3,
              marginTop: 16,
            }}
          >
            {scenarios.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setScenario(s)}
                style={{
                  flex: 1,
                  paddingVertical: 7,
                  borderRadius: radius.sm,
                  backgroundColor: scenario === s ? colour.primary : "transparent",
                  alignItems: "center",
                }}
              >
                <Text style={{ ...typography.labelS, color: colour.white }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Body */}
        <View
          style={{
            backgroundColor: colour.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            marginTop: -16,
            paddingTop: 20,
            paddingHorizontal: 16,
            paddingBottom: 30,
          }}
        >
          {/* Savings hero */}
          <View
            style={{ marginBottom: 16, borderRadius: 16, overflow: "hidden" }}
          >
            <View
              style={{ backgroundColor: colour.primary, padding: 20, alignItems: "center" }}
            >
              <Text style={{ ...typography.labelM, color: colour.white, opacity: 0.85 }}>
                Projected Tax Saving ({scenario})
              </Text>
              <Text style={{ ...typography.amountXL, color: colour.white, marginTop: 4 }}>
                R {Math.round(scenarioSave).toLocaleString()}
              </Text>
              <Text style={{ ...typography.bodyXS, color: colour.white, opacity: 0.8, marginTop: 4 }}>
                vs. filing without deductions
              </Text>
            </View>
            <View
              style={{
                backgroundColor: colour.navyDark,
                flexDirection: "row",
              }}
            >
              {[
                { label: "Proj. Deductions",  value: `R ${Math.round(scenarioDeduc).toLocaleString()}`, color: colour.white },
                { label: "Proj. Tax Payable", value: `R ${Math.round(scenarioTax).toLocaleString()}`,   color: colour.teal  },
                { label: "Tax Without",       value: `R ${Math.round(TAX_WITHOUT).toLocaleString()}`,   color: colour.dangerMid },
              ].map((m, i, arr) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    padding: 14,
                    alignItems: "center",
                    borderRightWidth: i < arr.length - 1 ? 1 : 0,
                    borderRightColor: colour.primary,
                  }}
                >
                  <Text style={{ ...typography.micro, color: colour.textSub }}>{m.label}</Text>
                  <Text style={{ ...typography.labelM, color: m.color, marginTop: 4 }}>{m.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* YTD progress */}
          <View
            style={{
              backgroundColor: colour.white,
              borderRadius: radius.md,
              padding: 16,
              borderWidth: 1,
              borderColor: colour.border,
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
              <Text style={{ ...typography.labelM, color: colour.text }}>
                YTD vs Projected
              </Text>
              <Text style={{ ...typography.labelM, color: colour.primary }}>
                {((YTD_DEDUCTIBLE / PROJECTED_DEDUCT) * 100).toFixed(0)}%
              </Text>
            </View>
            <View style={{ height: 10, borderRadius: 5, backgroundColor: colour.surface1, overflow: "hidden" }}>
              <View
                style={{
                  width: `${(YTD_DEDUCTIBLE / PROJECTED_DEDUCT) * 100}%`,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: colour.primary,
                }}
              />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
              <Text style={{ ...typography.micro, color: colour.textSub }}>
                YTD R {YTD_DEDUCTIBLE.toLocaleString()}
              </Text>
              <Text style={{ ...typography.micro, color: colour.textSub }}>
                Proj R {Math.round(PROJECTED_DEDUCT).toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Bar chart */}
          <View
            style={{
              backgroundColor: colour.white,
              borderRadius: radius.md,
              padding: 16,
              borderWidth: 1,
              borderColor: colour.border,
              marginBottom: 16,
            }}
          >
            <Text style={{ ...typography.labelM, color: colour.text, marginBottom: 12 }}>
              Monthly Deductions — Actual vs Forecast
            </Text>
            <View style={{ flexDirection: "row", alignItems: "flex-end", height: 100 }}>
              {FORECAST_MONTHS.map((m, i) => {
                const h = Math.max((m.deduct / MAX_DEDUCT) * 88, 4);
                return (
                  <View key={i} style={{ flex: 1, alignItems: "center" }}>
                    <View
                      style={{
                        width: "75%",
                        height: h,
                        borderRadius: 3,
                        backgroundColor: m.actual ? colour.primary : colour.primary100,
                        borderWidth: m.actual ? 0 : 1,
                        borderColor: colour.primary,
                      }}
                    />
                    <Text style={{ ...typography.micro, color: colour.textSub, marginTop: 4 }}>
                      {m.month}
                    </Text>
                  </View>
                );
              })}
            </View>
            <View style={{ flexDirection: "row", gap: 16, marginTop: space.sm }}>
              {[
                { c: colour.primary,     l: "Actual"   },
                { c: colour.primary100,  l: "Forecast" },
              ].map((item) => (
                <View key={item.l} style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
                  <View style={{ width: 12, height: 8, borderRadius: 2, backgroundColor: item.c }} />
                  <Text style={{ ...typography.micro, color: colour.textSub }}>{item.l}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Category forecast */}
          <View
            style={{
              backgroundColor: colour.white,
              borderRadius: radius.md,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: colour.border,
              marginBottom: 16,
            }}
          >
            <View
              style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colour.border }}
            >
              <Text style={{ ...typography.labelM, color: colour.text }}>
                Category Projections
              </Text>
              <Text style={{ ...typography.bodyXS, color: colour.textSub, marginTop: 2 }}>
                Full-year estimates based on YTD averages
              </Text>
            </View>
            {CATEGORY_FORECAST.map((item, i) => (
              <ForecastCatRow key={i} item={item} />
            ))}
          </View>

          {/* Tips */}
          <View
            style={{
              backgroundColor: colour.navyDark,
              borderRadius: radius.md,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <Text style={{ ...typography.labelM, color: colour.white, marginBottom: 12 }}>
              💡 Optimisation Tips
            </Text>
            {[
              "Track remaining receipts — 6 months left to maximise deductions.",
              `At your current rate, you'll claim ~R ${Math.round(PROJECTED_DEDUCT).toLocaleString()} by Feb 2026.`,
              'Review "Personal" spend — R2,550 may include deductible items.',
              "File before 31 Oct 2025 to avoid penalties.",
            ].map((tip, i) => (
              <View key={i} style={{ flexDirection: "row", marginBottom: 10 }}>
                <Text style={{ ...typography.bodyS, color: colour.primary, marginRight: 8 }}>•</Text>
                <Text style={{ ...typography.bodyS, color: colour.white, flex: 1, lineHeight: 18 }}>
                  {tip}
                </Text>
              </View>
            ))}
          </View>

          {/* Disclaimer */}
          <Text
            style={{
              ...typography.micro,
              color: colour.textSub,
              textAlign: "center",
              lineHeight: 15,
            }}
          >
            ⚠ This forecast is an estimate based on recorded expenses. Consult a
            registered tax practitioner for your final ITR12 submission. SARS
            tax brackets for 2024/25 applied.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
