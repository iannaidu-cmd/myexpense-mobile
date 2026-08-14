import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { expenseService } from "@/services/expenseService";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
import { useFocusEffect, useRouter } from "expo-router";
import { useAppForeground } from "@/hooks/use-app-foreground";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
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
  return d.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const deductibleColour = (isDeductible: boolean) =>
  isDeductible ? colour.success : colour.danger;

type Filter = "all" | "deductible" | "non";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "deductible", label: "Deductible" },
  { key: "non", label: "Non-deductible" },
];

export default function ExpenseHistoryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoaded = useRef(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<Filter>("all");

  // Bulk edit mode
  const [editMode, setEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchSaving, setBatchSaving] = useState(false);

  const enterEditMode = () => {
    setSelectedIds(new Set());
    setEditMode(true);
  };

  const exitEditMode = () => {
    setSelectedIds(new Set());
    setEditMode(false);
  };

  const toggleRowSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBatchAssign = async (isDeductible: boolean) => {
    if (selectedIds.size === 0) return;
    const ids = [...selectedIds];
    setExpenses((prev) =>
      prev.map((e) => (selectedIds.has(e.id) ? { ...e, is_deductible: isDeductible } : e)),
    );
    setSelectedIds(new Set());
    setEditMode(false);
    setBatchSaving(true);
    try {
      await Promise.all(ids.map((id) => expenseService.updateExpense({ id, is_deductible: isDeductible })));
    } catch {
      // silent — optimistic update already applied
    } finally {
      setBatchSaving(false);
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    const ids = [...selectedIds];
    Alert.alert(
      "Delete expenses",
      `Delete ${ids.length} expense${ids.length !== 1 ? "s" : ""}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setExpenses((prev) => prev.filter((e) => !selectedIds.has(e.id)));
            setSelectedIds(new Set());
            setEditMode(false);
            try {
              await Promise.all(ids.map((id) => expenseService.deleteExpense(id)));
            } catch {
              // silent
            }
          },
        },
      ],
    );
  };

  const loadData = useCallback(async (silent = false) => {
    if (!user) { setLoading(false); return; }
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await expenseService.getAllExpenses(user.id);
      setExpenses(data);
      hasLoaded.current = true;
    } catch (e) {
      console.error("ExpenseHistory load error:", e);
      setError("Failed to load expenses. Pull down to retry.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    setError(null);
    try {
      const data = await expenseService.getAllExpenses(user.id);
      setExpenses(data);
    } catch (e) {
      console.error("ExpenseHistory refresh error:", e);
      setError("Failed to load expenses. Pull down to retry.");
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData(hasLoaded.current);
    }, [loadData]),
  );
  useAppForeground(() => loadData(true));

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return expenses.filter((e) => {
      const matchSearch =
        (e.vendor ?? "").toLowerCase().includes(q) ||
        (e.category ?? "").toLowerCase().includes(q) ||
        (e.description ?? "").toLowerCase().includes(q);
      const matchFilter =
        activeFilter === "all"
          ? true
          : activeFilter === "deductible"
            ? e.is_deductible
            : !e.is_deductible;
      return matchSearch && matchFilter;
    });
  }, [expenses, search, activeFilter]);

  const total = useMemo(
    () => filtered.reduce((s, e) => s + Number(e.amount), 0),
    [filtered],
  );

  const claimable = useMemo(
    () => filtered.filter((e) => e.is_deductible).reduce((s, e) => s + Number(e.amount), 0),
    [filtered],
  );

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((e) => selectedIds.has(e.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((e) => e.id)));
    }
  };

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{ flex: 1, backgroundColor: colour.background }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />

      <MXHeader
        title="Expense history"
        showBack
        right={
          editMode ? (
            <TouchableOpacity onPress={exitEditMode}>
              <Text style={{ ...typography.labelM, color: colour.primary }}>Cancel</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => router.push("/filter-sort")}>
              <IconSymbol name="gearshape.fill" size={20} color={colour.textSecondary} />
            </TouchableOpacity>
          )
        }
      >
        {/* Summary row */}
        <View style={{ flexDirection: "row", gap: space.md, marginTop: space.md }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.caption, color: colour.textSub }}>
              Total Spent
            </Text>
            <Text
              style={{ ...typography.amountM, color: colour.text }}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {fmt(total)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.caption, color: colour.textSub }}>
              Claimable
            </Text>
            <Text
              style={{ ...typography.amountM, color: colour.success }}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {fmt(claimable)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.caption, color: colour.textSub }}>
              Expenses
            </Text>
            <Text style={{ ...typography.amountM, color: colour.text }}>
              {filtered.length}
            </Text>
          </View>
        </View>
      </MXHeader>

      {/* Card */}
      <View
        style={{
          flex: 1,
          backgroundColor: colour.bgCard,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
        }}
      >
        {/* Search */}
        <View
          style={{
            margin: space.lg,
            marginBottom: space.sm,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colour.bgPage,
            borderRadius: radius.pill,
            paddingHorizontal: space.md,
            height: 44,
          }}
        >
          <IconSymbol
            name="magnifyingglass"
            size={16}
            color={colour.textHint}
            style={{ marginRight: space.sm } as any}
          />
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

        {/* Filter chips + edit-types button */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: space.lg,
            gap: space.sm,
            marginBottom: space.sm,
            alignItems: "center",
          }}
        >
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
              <Text
                style={{
                  ...typography.labelS,
                  color: activeFilter === f.key ? colour.textOnPrimary : colour.textSecondary,
                }}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={{ flex: 1 }} />

          {!editMode && (
            <TouchableOpacity
              onPress={enterEditMode}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingVertical: space.xs,
                paddingHorizontal: space.sm,
                borderRadius: radius.full,
                backgroundColor: colour.bgPage,
                borderWidth: 1,
                borderColor: colour.border,
              }}
            >
              <IconSymbol name="tag.fill" size={11} color={colour.primary} />
              <Text style={{ ...typography.labelS, color: colour.primary }}>
                Edit types
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Edit mode: select-all bar */}
        {editMode && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: space.lg,
              paddingVertical: space.sm,
              marginBottom: space.xs,
              backgroundColor: colour.primaryLight,
              borderRadius: radius.md,
              marginHorizontal: space.lg,
            }}
          >
            <TouchableOpacity
              onPress={toggleSelectAll}
              style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: allVisibleSelected ? colour.primary : colour.border,
                  backgroundColor: allVisibleSelected ? colour.primary : colour.bgCard,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {allVisibleSelected && (
                  <IconSymbol name="checkmark" size={10} color={colour.textOnPrimary} />
                )}
              </View>
              <Text style={{ ...typography.labelS, color: colour.textPrimary }}>
                {selectedIds.size > 0
                  ? `${selectedIds.size} selected`
                  : "Select all"}
              </Text>
            </TouchableOpacity>
            <Text style={{ ...typography.caption, color: colour.textSecondary }}>
              Tap rows to select
            </Text>
          </View>
        )}

        {loading ? (
          <View style={{ alignItems: "center", paddingTop: space["4xl"] }}>
            <ActivityIndicator color={colour.primary} size="large" />
          </View>
        ) : error ? (
          <View style={{ alignItems: "center", paddingTop: space["4xl"], paddingHorizontal: space.lg }}>
            <IconSymbol name="exclamationmark.triangle.fill" size={40} color={colour.danger} style={{ marginBottom: space.md } as any} />
            <Text style={{ ...typography.h4, color: colour.text, marginBottom: space.sm }}>{error}</Text>
            <TouchableOpacity onPress={() => loadData(false)}>
              <Text style={{ ...typography.bodyM, color: colour.primary, fontWeight: "600" }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            windowSize={10}
            maxToRenderPerBatch={10}
            initialNumToRender={15}
            contentContainerStyle={{
              paddingHorizontal: space.lg,
              paddingBottom: editMode ? 120 : space["4xl"],
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colour.primary]}
                tintColor={colour.primary}
              />
            }
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingTop: space["4xl"] }}>
                <IconSymbol
                  name="magnifyingglass"
                  size={40}
                  color={colour.textHint}
                  style={{ marginBottom: space.md } as any}
                />
                <Text style={{ ...typography.h4, color: colour.textPrimary }}>
                  No expenses found
                </Text>
                <Text
                  style={{
                    ...typography.bodyM,
                    color: colour.textSecondary,
                    textAlign: "center",
                    marginTop: space.xs,
                  }}
                >
                  {search
                    ? "Try adjusting your search or filters"
                    : "Add your first expense to get started"}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <TouchableOpacity
                  onPress={() =>
                    editMode
                      ? toggleRowSelected(item.id)
                      : router.push(`/expense-detail?id=${item.id}` as any)
                  }
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: space.md,
                    borderBottomWidth: 1,
                    borderBottomColor: colour.border,
                    backgroundColor: isSelected && editMode ? colour.primaryLight : "transparent",
                  }}
                >
                  {/* Checkbox (edit mode only) */}
                  {editMode && (
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 5,
                        borderWidth: 2,
                        borderColor: isSelected ? colour.primary : colour.border,
                        backgroundColor: isSelected ? colour.primary : colour.bgCard,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: space.md,
                      }}
                    >
                      {isSelected && (
                        <IconSymbol name="checkmark" size={11} color={colour.textOnPrimary} />
                      )}
                    </View>
                  )}

                  {/* Icon (normal mode only) */}
                  {!editMode && (
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colour.primaryLight,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: space.md,
                      }}
                    >
                      <IconSymbol name="creditcard.fill" size={18} color={colour.primary} />
                    </View>
                  )}

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ ...typography.labelM, color: colour.textPrimary }}
                      numberOfLines={1}
                    >
                      {item.vendor}
                    </Text>
                    <Text
                      style={{ ...typography.caption, color: colour.textSecondary }}
                    >
                      {item.category} · {formatDate(item.expense_date)}
                    </Text>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ ...typography.amountS, color: colour.textPrimary }}>
                      {fmt(item.amount)}
                    </Text>
                    <View
                      style={{
                        backgroundColor: deductibleColour(item.is_deductible) + "20",
                        borderRadius: radius.full,
                        paddingHorizontal: space.xs,
                        paddingVertical: 2,
                        marginTop: 2,
                      }}
                    >
                      <Text
                        style={{
                          ...typography.micro,
                          color: deductibleColour(item.is_deductible),
                          fontWeight: "600",
                        }}
                      >
                        {item.is_deductible ? "Business" : "Personal"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* Bulk action bar — shown in edit mode */}
        {editMode && (
          <View
            style={{
              position: "absolute",
              bottom: 6,
              left: space.md,
              right: space.md,
              backgroundColor: colour.bgCard,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colour.border,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 6,
              paddingHorizontal: space.sm,
              paddingVertical: space.sm,
            }}
          >
            {selectedIds.size === 0 && (
              <Text
                style={{
                  ...typography.caption,
                  color: colour.textSecondary,
                  textAlign: "center",
                  marginBottom: space.xs,
                }}
              >
                Select expenses above, then assign a type
              </Text>
            )}
            <View style={{ flexDirection: "row", gap: space.xs }}>
              <TouchableOpacity
                onPress={() => handleBatchAssign(true)}
                disabled={selectedIds.size === 0 || batchSaving}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  paddingVertical: 10,
                  borderRadius: radius.md,
                  backgroundColor: selectedIds.size > 0 ? colour.success : colour.bgPage,
                  opacity: selectedIds.size === 0 ? 0.4 : 1,
                }}
              >
                <IconSymbol name="briefcase.fill" size={12} color={selectedIds.size > 0 ? colour.white : colour.textHint} />
                <Text style={{ fontSize: 13, fontWeight: "700", color: selectedIds.size > 0 ? colour.white : colour.textHint }}>
                  Business
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleBatchAssign(false)}
                disabled={selectedIds.size === 0 || batchSaving}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  paddingVertical: 10,
                  borderRadius: radius.md,
                  backgroundColor: selectedIds.size > 0 ? colour.danger : colour.bgPage,
                  opacity: selectedIds.size === 0 ? 0.4 : 1,
                }}
              >
                <IconSymbol name="person.fill" size={12} color={selectedIds.size > 0 ? colour.white : colour.textHint} />
                <Text style={{ fontSize: 13, fontWeight: "700", color: selectedIds.size > 0 ? colour.white : colour.textHint }}>
                  Personal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleBatchDelete}
                disabled={selectedIds.size === 0 || batchSaving}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  paddingVertical: 10,
                  borderRadius: radius.md,
                  backgroundColor: selectedIds.size > 0 ? colour.danger + "18" : colour.bgPage,
                  borderWidth: selectedIds.size > 0 ? 1 : 0,
                  borderColor: selectedIds.size > 0 ? colour.danger : "transparent",
                  opacity: selectedIds.size === 0 ? 0.4 : 1,
                }}
              >
                <IconSymbol name="trash.fill" size={12} color={selectedIds.size > 0 ? colour.danger : colour.textHint} />
                <Text style={{ fontSize: 13, fontWeight: "700", color: selectedIds.size > 0 ? colour.danger : colour.textHint }}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <MXTabBar />
    </SafeAreaView>
  );
}
