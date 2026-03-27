import { expenseService } from "@/services/expenseService";
import { useAuthStore } from "@/stores/authStore";
import { MXTabBar } from "@/components/MXTabBar";
import { colour, radius, space, typography } from "@/tokens";
import { ACTIVE_TAX_YEAR } from "@/types/database";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const fmt = (n: number) =>
  `R ${Number(n).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
};

const deductibleColour = (isDeductible: boolean) =>
  isDeductible ? colour.success : colour.danger;

type Filter = "all" | "deductible" | "non";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all",        label: "All" },
  { key: "deductible", label: "Deductible" },
  { key: "non",        label: "Non-deductible" },
];

export default function ExpenseHistoryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<Filter>("all");

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await expenseService.getExpenses(user.id, ACTIVE_TAX_YEAR);
      setExpenses(data);
    } catch (e) {
      console.error("ExpenseHistory load error:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const filtered = expenses.filter((e) => {
    const matchSearch =
      (e.vendor ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.category ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      activeFilter === "all" ? true
      : activeFilter === "deductible" ? e.is_deductible
      : !e.is_deductible;
    return matchSearch && matchFilter;
  });

  const total = filtered.reduce((s, e) => s + Number(e.amount), 0);
  const claimable = filtered
    .filter((e) => e.is_deductible)
    .reduce((s, e) => s + Number(e.amount), 0);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={colour.primary} />

      {/* Header */}
      <View style={{ paddingHorizontal: space.lg, paddingTop: 3, paddingBottom: space["3xl"] }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space.md }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={{ color: colour.textOnPrimary, fontSize: 26, lineHeight: 30 }}>‹</Text>
          </TouchableOpacity>
          <Text style={{ ...typography.labelM, color: "rgba(255,255,255,0.85)" }}>Expense History</Text>
          <TouchableOpacity onPress={() => router.push("/filter-sort")}>
            <Text style={{ fontSize: 20 }}>⚙</Text>
          </TouchableOpacity>
        </View>

        {/* Summary row */}
        <View style={{ flexDirection: "row", gap: space.md }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.caption, color: "rgba(255,255,255,0.7)" }}>Total Spent</Text>
            <Text style={{ ...typography.amountM, color: colour.textOnPrimary }}>{fmt(total)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.caption, color: "rgba(255,255,255,0.7)" }}>Claimable</Text>
            <Text style={{ ...typography.amountM, color: colour.teal }}>{fmt(claimable)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.caption, color: "rgba(255,255,255,0.7)" }}>Expenses</Text>
            <Text style={{ ...typography.amountM, color: colour.textOnPrimary }}>{filtered.length}</Text>
          </View>
        </View>
      </View>

      {/* Card */}
      <View style={{ flex: 1, backgroundColor: colour.bgCard, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }}>

        {/* Search */}
        <View style={{ margin: space.lg, flexDirection: "row", alignItems: "center", backgroundColor: colour.bgPage, borderRadius: radius.pill, paddingHorizontal: space.md, height: 44 }}>
          <Text style={{ fontSize: 16, marginRight: space.sm }}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search expenses..."
            placeholderTextColor={colour.textHint}
            style={{ ...typography.bodyM, flex: 1, color: colour.textPrimary }}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Text style={{ color: colour.textSecondary, fontSize: 18 }}>×</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter chips */}
        <View style={{ flexDirection: "row", paddingHorizontal: space.lg, gap: space.sm, marginBottom: space.md }}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setActiveFilter(f.key)}
              style={{
                borderRadius: radius.full,
                paddingVertical: space.xs,
                paddingHorizontal: space.md,
                backgroundColor: activeFilter === f.key ? colour.primary : colour.bgPage,
                borderWidth: 1,
                borderColor: activeFilter === f.key ? colour.primary : colour.border,
              }}
            >
              <Text style={{ ...typography.labelS, color: activeFilter === f.key ? colour.textOnPrimary : colour.textSecondary }}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={{ alignItems: "center", paddingTop: space["4xl"] }}>
            <ActivityIndicator color={colour.primary} size="large" />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space["4xl"] }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingTop: space["4xl"] }}>
                <Text style={{ fontSize: 40, marginBottom: space.md }}>🔍</Text>
                <Text style={{ ...typography.h4, color: colour.textPrimary }}>No expenses found</Text>
                <Text style={{ ...typography.bodyM, color: colour.textSecondary, textAlign: "center", marginTop: space.xs }}>
                  {search ? "Try adjusting your search or filters" : "Add your first expense to get started"}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => router.push(`/expense-detail?id=${item.id}` as any)}
                style={{ flexDirection: "row", alignItems: "center", paddingVertical: space.md, borderBottomWidth: 1, borderBottomColor: colour.border }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colour.primaryLight, alignItems: "center", justifyContent: "center", marginRight: space.md }}>
                  <Text style={{ fontSize: 18 }}>💳</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...typography.labelM, color: colour.textPrimary }} numberOfLines={1}>
                    {item.vendor}
                  </Text>
                  <Text style={{ ...typography.caption, color: colour.textSecondary }}>
                    {item.category} · {formatDate(item.expense_date)}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ ...typography.amountS, color: colour.textPrimary }}>
                    {fmt(item.amount)}
                  </Text>
                  <View style={{ backgroundColor: deductibleColour(item.is_deductible) + "20", borderRadius: radius.full, paddingHorizontal: space.xs, paddingVertical: 2, marginTop: 2 }}>
                    <Text style={{ ...typography.micro, color: deductibleColour(item.is_deductible), fontWeight: "600" }}>
                      {item.is_deductible ? "Deductible" : "Non-deductible"}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
      <MXTabBar />
    </SafeAreaView>
  );
}
