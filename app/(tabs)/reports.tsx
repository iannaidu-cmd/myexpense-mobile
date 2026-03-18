import { BudgetVsActualScreen } from "@/components/dashboard/budget-vs-actual";
import { DeductionForecastScreen } from "@/components/dashboard/deduction-forecast";
import { MonthlyTrendScreen } from "@/components/dashboard/monthly-trend";
import { ReportHomeScreen } from "@/components/dashboard/report-home-screen";
import { SpendingByCategoryScreen } from "@/components/dashboard/spending-by-category";
import { TopVendorScreen } from "@/components/dashboard/top-vendor";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

const REPORT_SCREENS = [
  { name: "Report Home", component: ReportHomeScreen },
  { name: "Spending by Category", component: SpendingByCategoryScreen },
  { name: "Monthly Trend", component: MonthlyTrendScreen },
  { name: "Budget vs Actual", component: BudgetVsActualScreen },
  { name: "Top Vendor", component: TopVendorScreen },
  { name: "Deduction Forecast", component: DeductionForecastScreen },
];

export default function ReportsTab() {
  const [selected, setSelected] = React.useState(0);
  const bg = useThemeColor({}, "background");
  const tint = useThemeColor({}, "tint");
  const text = useThemeColor({}, "text");
  const ScreenComponent = REPORT_SCREENS[selected].component;

  return (
    <ThemedView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView
        horizontal
        style={styles.tabBar}
        showsHorizontalScrollIndicator={false}
      >
        {REPORT_SCREENS.map((r, i) => (
          <Pressable
            key={r.name}
            onPress={() => setSelected(i)}
            style={[
              styles.tab,
              { backgroundColor: selected === i ? tint : bg },
            ]}
          >
            <ThemedText
              type="defaultSemiBold"
              style={{ color: selected === i ? text : tint }}
            >
              {r.name}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>
      <View style={{ flex: 1 }}>
        <ScreenComponent />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingTop: 8,
    backgroundColor: "transparent",
  },
  tab: {
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginRight: 8,
    marginBottom: 4,
  },
});
