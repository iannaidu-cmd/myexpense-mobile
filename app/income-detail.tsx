import { ConfirmModal } from "@/components/ConfirmModal";
import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { expenseService } from "@/services/expenseService";
import { incomeService } from "@/services/incomeService";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
import { ACTIVE_TAX_YEAR } from "@/types/database";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const fmt = (n: number) =>
  `R ${Number(n).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingVertical: space.md,
        borderBottomWidth: 1,
        borderBottomColor: colour.border,
      }}
    >
      <Text style={{ ...typography.caption, color: colour.textSecondary, flex: 1 }}>
        {label}
      </Text>
      <Text
        style={{
          ...typography.labelM,
          color: colour.textPrimary,
          flex: 2,
          textAlign: "right",
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export default function IncomeDetailScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [converting, setConverting] = useState(false);
  const [income, setIncome] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConvertConfirm, setShowConvertConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;
    incomeService
      .getIncomeById(id)
      .then((data) => {
        setIncome(data);
        setLoading(false);
      })
      .catch((e) => {
        console.error("IncomeDetail load error:", e);
        setLoading(false);
      });
  }, [id]);

  const confirmDelete = async () => {
    if (!income) return;
    setShowDeleteConfirm(false);
    setDeleting(true);
    try {
      await incomeService.deleteIncome(income.id);
      router.replace("/income-history" as any);
    } catch (e: any) {
      Alert.alert("Error", e.message);
      setDeleting(false);
    }
  };

  const confirmConvertToExpense = async () => {
    if (!income || !user) return;
    setShowConvertConfirm(false);
    setConverting(true);
    try {
      await expenseService.addExpense(user.id, {
        vendor: income.source,
        amount: income.amount,
        category: "Non-deductible",
        tax_year: ACTIVE_TAX_YEAR,
        expense_date: income.date,
        is_deductible: false,
        notes: income.description ?? "Converted from income",
      });
      await incomeService.deleteIncome(income.id);
      router.replace("/expense-history" as any);
    } catch (e: any) {
      Alert.alert("Error", e.message);
      setConverting(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />

      <MXHeader
        title="Income details"
        showBack
        right={
          income ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              <TouchableOpacity
                onPress={() => router.push(`/add-income?id=${income.id}` as any)}
                hitSlop={8}
              >
                <IconSymbol name="pencil" size={20} color={colour.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowDeleteConfirm(true)}
                disabled={deleting}
                hitSlop={8}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color={colour.danger} />
                ) : (
                  <IconSymbol name="trash.fill" size={20} color={colour.danger} />
                )}
              </TouchableOpacity>
            </View>
          ) : undefined
        }
      />

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colour.success} size="large" />
        </View>
      ) : !income ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ ...typography.bodyM, color: colour.textSecondary }}>
            Income not found.
          </Text>
        </View>
      ) : (
        <>
          {/* Hero amount card */}
          <View
            style={{
              backgroundColor: colour.noir,
              marginHorizontal: space.lg,
              marginTop: space.md,
              marginBottom: space.lg,
              borderRadius: radius.xl,
              padding: space.lg,
              overflow: "hidden",
            }}
          >
            <View style={{
              position: "absolute", width: 160, height: 160, borderRadius: 80,
              backgroundColor: colour.success, opacity: 0.18, top: -50, right: -40,
            }} />
            <Text style={{ fontSize: 12, color: colour.onNoir2, fontWeight: "500", marginBottom: 8 }}>
              Amount received
            </Text>
            <Text style={{ fontSize: 38, fontWeight: "800", color: colour.onNoir, letterSpacing: -1.5, marginBottom: 4 }}>
              {fmt(income.amount)}
            </Text>
            <Text style={{ fontSize: 13, color: colour.onNoir2, opacity: 0.75 }}>
              {formatDate(income.date)}
            </Text>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: space.lg,
              paddingBottom: space["4xl"],
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Details card */}
            <View
              style={{
                backgroundColor: colour.bgCard,
                borderRadius: radius.xl,
                paddingHorizontal: space.lg,
                marginBottom: space.lg,
              }}
            >
              <Row label="Source" value={income.source} />
              <Row label="Date" value={formatDate(income.date)} />
              {income.description ? (
                <Row label="Description" value={income.description} />
              ) : null}
              {income.category ? (
                <Row label="Category" value={income.category} />
              ) : null}
            </View>

            {/* ITR12 note */}
            <View
              style={{
                backgroundColor: colour.primary50,
                borderRadius: radius.lg,
                padding: space.md,
                flexDirection: "row",
                alignItems: "flex-start",
                gap: space.sm,
              }}
            >
              <IconSymbol name="info.circle.fill" size={16} color={colour.primary} style={{ marginTop: 1 } as any} />
              <Text style={{ ...typography.bodyS, color: colour.textSub, flex: 1, lineHeight: 20 }}>
                This income entry is included in your ITR12 tax calculations for the active tax year.
              </Text>
            </View>

            {/* Reclassify as expense */}
            <TouchableOpacity
              onPress={() => setShowConvertConfirm(true)}
              disabled={converting}
              style={{
                marginTop: space.xl,
                borderRadius: radius.pill,
                borderWidth: 1.5,
                borderColor: colour.primary,
                paddingVertical: 14,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: space.sm,
              }}
            >
              {converting ? (
                <ActivityIndicator color={colour.primary} />
              ) : (
                <>
                  <IconSymbol name="arrow.left.arrow.right" size={16} color={colour.primary} />
                  <Text style={{ ...typography.btnL, color: colour.primary }}>
                    Reclassify as expense
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Delete button */}
            <TouchableOpacity
              onPress={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              style={{
                marginTop: space.md,
                borderRadius: radius.pill,
                borderWidth: 1.5,
                borderColor: colour.danger,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ ...typography.btnL, color: colour.danger }}>
                Delete income
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </>
      )}

      <ConfirmModal
        visible={showDeleteConfirm}
        title="Delete income"
        message={income ? `Remove "${income.source}" from your income records? This cannot be undone.` : undefined}
        confirmLabel="Delete"
        cancelLabel="Keep it"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
      <ConfirmModal
        visible={showConvertConfirm}
        title="Reclassify as expense?"
        message="This will remove the income record and create a new expense entry with the same amount and date."
        confirmLabel="Convert"
        cancelLabel="Cancel"
        onConfirm={confirmConvertToExpense}
        onCancel={() => setShowConvertConfirm(false)}
        icon="arrow.left.arrow.right"
      />

      <MXTabBar />
    </SafeAreaView>
  );
}
