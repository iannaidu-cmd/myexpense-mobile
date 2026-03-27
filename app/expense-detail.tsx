import { expenseService } from "@/services/expenseService";
import { useAuthStore } from "@/stores/authStore";
import { MXTabBar } from "@/components/MXTabBar";
import { colour, radius, space, typography } from "@/tokens";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const fmt = (n: number) =>
  `R ${Number(n).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
};

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: space.md, borderBottomWidth: 1, borderBottomColor: colour.border }}>
      <Text style={{ ...typography.bodyS, color: colour.textSecondary, flex: 1 }}>{label}</Text>
      <Text style={{ ...typography.bodyM, color: accent ? colour.primary : colour.textPrimary, fontWeight: accent ? "600" : "400", textAlign: "right", flex: 1.5 }}>
        {value}
      </Text>
    </View>
  );
}

export default function ExpenseDetailScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [expense, setExpense] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    expenseService.getExpenseById(id).then((data) => {
      setExpense(data);
      setLoading(false);
    }).catch((e) => {
      console.error("ExpenseDetail load error:", e);
      setLoading(false);
    });
  }, [id]);

  const handleDelete = () => {
    Alert.alert(
      "Delete Expense",
      "Are you sure you want to delete this expense? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!expense) return;
            setDeleting(true);
            try {
              await expenseService.deleteExpense(expense.id);
              router.replace("/(tabs)" as any);
            } catch (e: any) {
              Alert.alert("Error", e.message);
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.primary }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colour.onPrimary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!expense) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.background }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ ...typography.bodyM, color: colour.textSub }}>Expense not found.</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: space.lg }}>
            <Text style={{ ...typography.bodyM, color: colour.primary }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const claimable = expense.is_deductible ? Number(expense.amount) : 0;
  const itr12Code = expense.itr12_code ?? "S11(a)";

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={colour.primary} />

      {/* Header */}
      <View style={{ paddingHorizontal: space.lg, paddingTop: 3, paddingBottom: space["3xl"] }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space.md }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={{ color: colour.textOnPrimary, fontSize: 26, lineHeight: 30 }}>‹</Text>
          </TouchableOpacity>
          <Text style={{ ...typography.labelM, color: "rgba(255,255,255,0.85)" }}>Expense Detail</Text>
          <TouchableOpacity onPress={() => router.push(`/edit-expense?id=${expense.id}` as any)}>
            <Text style={{ ...typography.labelM, color: colour.textOnPrimary }}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Amount hero */}
        <Text style={{ ...typography.amountXL, color: colour.textOnPrimary }}>
          {fmt(expense.amount)}
        </Text>
        <Text style={{ ...typography.bodyM, color: "rgba(255,255,255,0.75)", marginTop: space.xs }}>
          {expense.vendor}
        </Text>

        {/* Badges */}
        <View style={{ flexDirection: "row", gap: space.sm, marginTop: space.md }}>
          {itr12Code ? (
            <View style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: radius.full, paddingVertical: 4, paddingHorizontal: space.sm }}>
              <Text style={{ ...typography.labelS, color: colour.textOnPrimary }}>{itr12Code}</Text>
            </View>
          ) : null}
          <View style={{ backgroundColor: expense.is_deductible ? "rgba(255,255,255,0.2)" : "rgba(231,76,60,0.4)", borderRadius: radius.full, paddingVertical: 4, paddingHorizontal: space.sm }}>
            <Text style={{ ...typography.labelS, color: colour.textOnPrimary }}>
              {expense.is_deductible ? "Deductible" : "Non-deductible"}
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1, backgroundColor: colour.bgCard, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }}
        contentContainerStyle={{ padding: space.lg, paddingBottom: 100 }}
      >
        {/* Claimable callout */}
        {expense.is_deductible ? (
          <View style={{ backgroundColor: colour.successLight, borderRadius: radius.md, padding: space.md, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space.xl }}>
            <View>
              <Text style={{ ...typography.labelM, color: colour.success }}>Tax Claimable Amount</Text>
              <Text style={{ ...typography.caption, color: colour.success }}>ITR12 · {itr12Code}</Text>
            </View>
            <Text style={{ ...typography.amountM, color: colour.success }}>{fmt(claimable)}</Text>
          </View>
        ) : (
          <View style={{ backgroundColor: colour.dangerBg, borderRadius: radius.md, padding: space.md, marginBottom: space.xl }}>
            <Text style={{ ...typography.labelM, color: colour.danger }}>Non-deductible expense</Text>
            <Text style={{ ...typography.caption, color: colour.danger }}>This expense cannot be claimed on your ITR12</Text>
          </View>
        )}

        {/* Details */}
        <Text style={{ ...typography.labelM, color: colour.textSecondary, marginBottom: space.xs }}>EXPENSE DETAILS</Text>
        <View style={{ backgroundColor: colour.bgCard, borderRadius: radius.md, borderWidth: 1, borderColor: colour.border, paddingHorizontal: space.lg, marginBottom: space.xl }}>
          <Row label="Category"    value={expense.category ?? "—"} />
          <Row label="Vendor"      value={expense.vendor ?? "—"} />
          <Row label="Date"        value={formatDate(expense.expense_date)} />
          <Row label="Tax Year"    value={expense.tax_year ?? ACTIVE_TAX_YEAR} />
          <Row label="Currency"    value={expense.currency ?? "ZAR"} />
          {expense.vat_amount ? <Row label="VAT Amount" value={fmt(expense.vat_amount)} /> : null}
          {expense.notes ? <Row label="Notes" value={expense.notes} /> : null}
          <Row label="Reference"   value={expense.id.slice(0, 8).toUpperCase()} accent />
        </View>

        {/* Receipt */}
        <Text style={{ ...typography.labelM, color: colour.textSecondary, marginBottom: space.xs }}>RECEIPT</Text>
        <TouchableOpacity
          onPress={() => {
            if (expense.receipt_url) Linking.openURL(expense.receipt_url);
            else router.push(`/scan-receipt-camera` as any);
          }}
          style={{
            backgroundColor: expense.receipt_url ? colour.primaryLight : colour.bgPage,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: expense.receipt_url ? colour.primary : colour.border,
            padding: space.lg,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: space.xl,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontSize: 20, marginRight: space.sm }}>
              {expense.receipt_url ? "🧾" : "📎"}
            </Text>
            <View>
              <Text style={{ ...typography.labelM, color: expense.receipt_url ? colour.primary : colour.textSecondary }}>
                {expense.receipt_url ? "Receipt attached" : "No receipt uploaded"}
              </Text>
              <Text style={{ ...typography.caption, color: colour.textSecondary }}>
                {expense.receipt_url ? "Tap to view" : "Tap to add receipt"}
              </Text>
            </View>
          </View>
          <Text style={{ color: colour.textSecondary, fontSize: 18 }}>›</Text>
        </TouchableOpacity>

        {/* SARS compliance note */}
        <View style={{ backgroundColor: colour.infoLight, borderRadius: radius.md, padding: space.md, marginBottom: space.xl }}>
          <Text style={{ ...typography.labelS, color: colour.info, marginBottom: space.xs }}>
            📋 SARS Compliance
          </Text>
          <Text style={{ ...typography.bodyS, color: colour.info }}>
            Keep this receipt for 5 years from the date of assessment. Required for {itr12Code} deduction claims on your ITR12.
          </Text>
        </View>

        {/* Actions */}
        <TouchableOpacity
          onPress={() => router.push(`/edit-expense?id=${expense.id}` as any)}
          style={{ backgroundColor: colour.primary, borderRadius: radius.pill, height: 52, alignItems: "center", justifyContent: "center", marginBottom: space.md }}
        >
          <Text style={{ ...typography.btnL, color: colour.textOnPrimary }}>Edit Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDelete}
          disabled={deleting}
          style={{ borderRadius: radius.pill, borderWidth: 1.5, borderColor: colour.danger, height: 52, alignItems: "center", justifyContent: "center" }}
        >
          {deleting
            ? <ActivityIndicator color={colour.danger} />
            : <Text style={{ ...typography.btnL, color: colour.danger }}>Delete Expense</Text>
          }
        </TouchableOpacity>
      </ScrollView>
      <MXTabBar />
    </SafeAreaView>
  );
}
