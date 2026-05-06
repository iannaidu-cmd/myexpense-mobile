import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { incomeService } from "@/services/incomeService";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
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

const sourceIcon = (source: string): any => {
  const s = source.toLowerCase();
  if (s.includes("salary") || s.includes("wage") || s.includes("employment"))
    return "dollarsign.circle.fill";
  if (s.includes("commission")) return "person.badge.fill";
  if (s.includes("consult") || s.includes("fees") || s.includes("services"))
    return "briefcase.fill";
  if (s.includes("rental") || s.includes("rent")) return "building.2.fill";
  if (s.includes("investment")) return "chart.bar.fill";
  if (s.includes("bonus")) return "star.fill";
  if (s.includes("royalt")) return "doc.text.fill";
  if (s.includes("interest")) return "chart.pie.fill";
  if (s.includes("annuit")) return "calendar";
  if (s.includes("trust")) return "lock.fill";
  if (s.includes("petrol") || s.includes("fuel")) return "car.fill";
  if (s.includes("car") || s.includes("vehicle")) return "car.fill";
  if (s.includes("cell") || s.includes("phone")) return "phone.fill";
  return "dollarsign.circle.fill";
};

export default function IncomeHistoryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [income, setIncome] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await incomeService.getIncome(user.id);
      setIncome(data);
    } catch (e) {
      console.error("IncomeHistory load error:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const data = await incomeService.getIncome(user.id);
      setIncome(data);
    } catch (e) {
      console.error("IncomeHistory refresh error:", e);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleView = (item: any) => {
    Alert.alert(
      item.source,
      [
        `Amount: ${fmt(item.amount)}`,
        `Date: ${formatDate(item.date)}`,
        item.description ? `Notes: ${item.description}` : null,
        item.category ? `Category: ${item.category}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      [
        { text: "Close", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDelete(item.id, item.source),
        },
      ],
    );
  };

  const handleDelete = (id: string, source: string) => {
    Alert.alert(
      "Delete income",
      `Remove "${source}" from your income records? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingId(id);
            try {
              await incomeService.deleteIncome(id);
              setIncome((prev) => prev.filter((e) => e.id !== id));
            } catch (e: any) {
              Alert.alert("Error", e.message);
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return income.filter(
      (e) =>
        (e.source ?? "").toLowerCase().includes(q) ||
        (e.description ?? "").toLowerCase().includes(q),
    );
  }, [income, search]);

  const totalIncome = useMemo(
    () => filtered.reduce((s, e) => s + Number(e.amount), 0),
    [filtered],
  );

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.background }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />

      <MXHeader
        title="Income History"
        showBack
        right={
          <TouchableOpacity
            onPress={() => router.push("/add-income" as any)}
            style={{
              backgroundColor: colour.primary50,
              borderRadius: radius.pill,
              paddingHorizontal: space.md,
              paddingVertical: space.xs,
            }}
          >
            <Text style={{ ...typography.labelS, color: colour.accentDeep }}>
              + Add
            </Text>
          </TouchableOpacity>
        }
      >
        {/* Summary row */}
        <View
          style={{ flexDirection: "row", gap: space.md, marginTop: space.md }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{ ...typography.caption, color: colour.textSub }}
            >
              Total Income
            </Text>
            <Text style={{ ...typography.amountM, color: colour.text }}>
              {fmt(totalIncome)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{ ...typography.caption, color: colour.textSub }}
            >
              Entries
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
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colour.bgPage,
            borderRadius: radius.pill,
            paddingHorizontal: space.md,
            height: 44,
          }}
        >
          <IconSymbol name="magnifyingglass" size={16} color={colour.textHint} style={{ marginRight: space.sm } as any} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search income..."
            placeholderTextColor={colour.textHint}
            style={{ ...typography.bodyM, flex: 1, color: colour.textPrimary }}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Text style={{ color: colour.textSecondary, fontSize: 18 }}>
                ×
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {loading ? (
          <View style={{ alignItems: "center", paddingTop: space["4xl"] }}>
            <ActivityIndicator color={colour.success} size="large" />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            getItemLayout={(_data, index) => ({
              length: 69,
              offset: 69 * index,
              index,
            })}
            windowSize={10}
            maxToRenderPerBatch={10}
            initialNumToRender={15}
            contentContainerStyle={{
              paddingHorizontal: space.lg,
              paddingBottom: space["4xl"],
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colour.success]}
                tintColor={colour.success}
              />
            }
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingTop: space["4xl"] }}>
                <IconSymbol name="dollarsign.circle.fill" size={40} color={colour.textHint} style={{ marginBottom: space.md } as any} />
                <Text style={{ ...typography.h4, color: colour.textPrimary }}>
                  No income recorded
                </Text>
                <Text
                  style={{
                    ...typography.bodyM,
                    color: colour.textSecondary,
                    textAlign: "center",
                    marginTop: space.xs,
                    marginBottom: space.xl,
                  }}
                >
                  {search
                    ? "Try adjusting your search"
                    : "Add your first income entry to get started"}
                </Text>
                {!search && (
                  <TouchableOpacity
                    onPress={() => router.push("/add-income" as any)}
                    style={{
                      backgroundColor: colour.success,
                      borderRadius: radius.pill,
                      paddingVertical: space.md,
                      paddingHorizontal: space.xl,
                    }}
                  >
                    <Text
                      style={{ ...typography.btnL, color: colour.text }}
                    >
                      Add Income
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleView(item)}
                onLongPress={() => handleDelete(item.id, item.source)}
                delayLongPress={500}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: space.md,
                  borderBottomWidth: 1,
                  borderBottomColor: colour.border,
                }}
              >
                {/* Icon */}
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colour.successBg,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: space.md,
                  }}
                >
                  {deletingId === item.id ? (
                    <ActivityIndicator color={colour.success} size="small" />
                  ) : (
                    <IconSymbol name={sourceIcon(item.source)} size={20} color={colour.success} />
                  )}
                </View>

                {/* Details */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ ...typography.labelM, color: colour.textPrimary }}
                    numberOfLines={1}
                  >
                    {item.source}
                  </Text>
                  <Text
                    style={{
                      ...typography.caption,
                      color: colour.textSecondary,
                    }}
                  >
                    {item.description ? `${item.description} · ` : ""}
                    {formatDate(item.date)}
                  </Text>
                </View>

                {/* Amount */}
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={{
                      ...typography.amountS,
                      color: colour.success,
                      fontWeight: "700",
                    }}
                  >
                    {fmt(item.amount)}
                  </Text>
                  <Text
                    style={{
                      ...typography.micro,
                      color: colour.textSecondary,
                      marginTop: 2,
                    }}
                  >
                    ITR12
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* Hint */}
      {income.length > 0 && !loading && (
        <View
          style={{
            backgroundColor: colour.bgCard,
            paddingHorizontal: space.lg,
            paddingVertical: space.sm,
          }}
        >
          <Text
            style={{
              ...typography.micro,
              color: colour.textHint,
              textAlign: "center",
            }}
          >
            Tap to view details · Long press to delete
          </Text>
        </View>
      )}

      <MXTabBar />
    </SafeAreaView>
  );
}
