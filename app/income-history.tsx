import { incomeService } from "@/services/incomeService";
import { useAuthStore } from "@/stores/authStore";
import { MXTabBar } from "@/components/MXTabBar";
import { colour, radius, space, typography } from "@/tokens";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

// Source → emoji mapping for visual variety
const sourceIcon = (source: string) => {
  const s = source.toLowerCase();
  if (s.includes("salary") || s.includes("wage") || s.includes("employment")) return "💵";
  if (s.includes("commission")) return "🤝";
  if (s.includes("consult") || s.includes("fees") || s.includes("services")) return "💼";
  if (s.includes("rental") || s.includes("rent")) return "🏠";
  if (s.includes("investment")) return "📈";
  if (s.includes("bonus")) return "🎉";
  if (s.includes("royalt")) return "©️";
  if (s.includes("interest")) return "💹";
  if (s.includes("annuit")) return "📋";
  if (s.includes("trust")) return "📑";
  if (s.includes("petrol") || s.includes("fuel")) return "⛽";
  if (s.includes("car") || s.includes("vehicle")) return "🚗";
  if (s.includes("cell") || s.includes("phone")) return "📱";
  return "💰";
};

export default function IncomeHistoryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
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

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleDelete = (id: string, source: string) => {
    Alert.alert(
      "Delete Income",
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
      ]
    );
  };

  const filtered = income.filter((e) => {
    const q = search.toLowerCase();
    return (
      (e.source ?? "").toLowerCase().includes(q) ||
      (e.description ?? "").toLowerCase().includes(q)
    );
  });

  const totalIncome = filtered.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.success }}>
      <StatusBar barStyle="light-content" backgroundColor={colour.success} />

      {/* Header */}
      <View style={{ paddingHorizontal: space.lg, paddingTop: 3, paddingBottom: space["3xl"] }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space.md }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={{ color: colour.onPrimary, fontSize: 26, lineHeight: 30 }}>‹</Text>
          </TouchableOpacity>
          <Text style={{ ...typography.labelM, color: "rgba(255,255,255,0.85)" }}>Income History</Text>
          <TouchableOpacity
            onPress={() => router.push("/add-income" as any)}
            style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: space.xs }}
          >
            <Text style={{ ...typography.labelS, color: colour.onPrimary }}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Summary */}
        <View style={{ flexDirection: "row", gap: space.md }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.caption, color: "rgba(255,255,255,0.7)" }}>Total Income</Text>
            <Text style={{ ...typography.amountM, color: colour.onPrimary }}>{fmt(totalIncome)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.caption, color: "rgba(255,255,255,0.7)" }}>Entries</Text>
            <Text style={{ ...typography.amountM, color: colour.onPrimary }}>{filtered.length}</Text>
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
            placeholder="Search income..."
            placeholderTextColor={colour.textHint}
            style={{ ...typography.bodyM, flex: 1, color: colour.textPrimary }}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Text style={{ color: colour.textSecondary, fontSize: 18 }}>×</Text>
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
            contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space["4xl"] }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingTop: space["4xl"] }}>
                <Text style={{ fontSize: 40, marginBottom: space.md }}>💵</Text>
                <Text style={{ ...typography.h4, color: colour.textPrimary }}>No income recorded</Text>
                <Text style={{ ...typography.bodyM, color: colour.textSecondary, textAlign: "center", marginTop: space.xs, marginBottom: space.xl }}>
                  {search ? "Try adjusting your search" : "Add your first income entry to get started"}
                </Text>
                {!search && (
                  <TouchableOpacity
                    onPress={() => router.push("/add-income" as any)}
                    style={{ backgroundColor: colour.success, borderRadius: radius.pill, paddingVertical: space.md, paddingHorizontal: space.xl }}
                  >
                    <Text style={{ ...typography.btnL, color: colour.onPrimary }}>Add Income</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                onLongPress={() => handleDelete(item.id, item.source)}
                delayLongPress={500}
                style={{ flexDirection: "row", alignItems: "center", paddingVertical: space.md, borderBottomWidth: 1, borderBottomColor: colour.border }}
              >
                {/* Icon */}
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colour.successBg, alignItems: "center", justifyContent: "center", marginRight: space.md }}>
                  {deletingId === item.id
                    ? <ActivityIndicator color={colour.success} size="small" />
                    : <Text style={{ fontSize: 20 }}>{sourceIcon(item.source)}</Text>
                  }
                </View>

                {/* Details */}
                <View style={{ flex: 1 }}>
                  <Text style={{ ...typography.labelM, color: colour.textPrimary }} numberOfLines={1}>
                    {item.source}
                  </Text>
                  <Text style={{ ...typography.caption, color: colour.textSecondary }}>
                    {item.description ? `${item.description} · ` : ""}{formatDate(item.date)}
                  </Text>
                </View>

                {/* Amount */}
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ ...typography.amountS, color: colour.success, fontWeight: "700" }}>
                    {fmt(item.amount)}
                  </Text>
                  <Text style={{ ...typography.micro, color: colour.textSecondary, marginTop: 2 }}>
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
        <View style={{ backgroundColor: colour.bgCard, paddingHorizontal: space.lg, paddingVertical: space.sm }}>
          <Text style={{ ...typography.micro, color: colour.textHint, textAlign: "center" }}>
            Long press any entry to delete it
          </Text>
        </View>
      )}

      <MXTabBar />
    </SafeAreaView>
  );
}
