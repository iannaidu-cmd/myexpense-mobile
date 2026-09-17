import { ConfirmModal } from "@/components/ConfirmModal";
import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { taxYearForDate } from "@/lib/taxRules";
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
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

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

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
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
      <Text
        style={{ ...typography.rowKey, color: colour.textSecondary, flex: 1 }}
      >
        {label}
      </Text>
      <Text
        style={{
          ...typography.rowValue,
          color: accent ? colour.primary : colour.textPrimary,
          textAlign: "right",
          flex: 1.5,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

// ─── Full-screen receipt viewer ───────────────────────────────────────────────
function ReceiptViewer({
  visible,
  storagePath,
  onClose,
}: {
  visible: boolean;
  storagePath: string;
  onClose: () => void;
}) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!visible || !storagePath) return;
    setSignedUrl(null);
    setError(false);
    setLoading(true);

    const generate = async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data, error: signErr } = await supabase.storage
          .from("receipts")
          .createSignedUrl(storagePath, 300); // 5-minute TTL — enough to view
        if (signErr || !data?.signedUrl)
          throw new Error(signErr?.message ?? "Failed to generate URL");
        setSignedUrl(data.signedUrl);
      } catch (e) {
        console.error("ReceiptViewer signed URL error:", e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    generate();
  }, [visible, storagePath]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.95)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Close button */}
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          style={{
            position: "absolute",
            top: 52,
            right: space.lg,
            zIndex: 10,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "rgba(255,255,255,0.15)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconSymbol name="xmark" size={18} color="#fff" />
        </TouchableOpacity>

        {/* Label */}
        <Text
          style={{
            ...typography.labelS,
            color: "rgba(255,255,255,0.6)",
            position: "absolute",
            top: 60,
            left: space.lg,
          }}
        >
          RECEIPT
        </Text>

        {loading && (
          <View style={{ alignItems: "center" }}>
            <ActivityIndicator color="#fff" size="large" />
            <Text
              style={{
                ...typography.bodyS,
                color: "rgba(255,255,255,0.6)",
                marginTop: space.md,
              }}
            >
              Loading receipt…
            </Text>
          </View>
        )}

        {error && !loading && (
          <View style={{ alignItems: "center", paddingHorizontal: space.xl }}>
            <IconSymbol name="exclamationmark.circle" size={40} color="#fff" style={{ marginBottom: space.md } as any} />
            <Text
              style={{
                ...typography.bodyM,
                color: "#fff",
                textAlign: "center",
                marginBottom: space.sm,
              }}
            >
              Could not load receipt
            </Text>
            <Text
              style={{
                ...typography.bodyS,
                color: "rgba(255,255,255,0.5)",
                textAlign: "center",
              }}
            >
              The receipt may have been deleted from storage.
            </Text>
          </View>
        )}

        {signedUrl && !loading && (
          <Image
            source={{ uri: signedUrl }}
            style={{
              width: SCREEN_WIDTH - 32,
              height: SCREEN_HEIGHT * 0.75,
              borderRadius: radius.lg,
            }}
            resizeMode="contain"
          />
        )}

        {/* Footer note */}
        {signedUrl && (
          <Text
            style={{
              ...typography.bodyXS,
              color: "rgba(255,255,255,0.3)",
              position: "absolute",
              bottom: 40,
            }}
          >
            Secure view · Link expires in 5 minutes
          </Text>
        )}
      </View>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ExpenseDetailScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [converting, setConverting] = useState(false);
  const [expense, setExpense] = useState<any>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConvertConfirm, setShowConvertConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;
    expenseService
      .getExpenseById(id)
      .then((data) => {
        setExpense(data);
        setLoading(false);
      })
      .catch((e) => {
        console.error("ExpenseDetail load error:", e);
        setLoading(false);
      });
  }, [id]);

  const handleDelete = () => setShowDeleteConfirm(true);

  const confirmConvertToIncome = async () => {
    if (!expense || !user) return;
    setShowConvertConfirm(false);
    setConverting(true);
    try {
      await incomeService.addIncome(user.id, {
        amount: expense.amount,
        source: expense.vendor,
        date: expense.expense_date,
        description: expense.notes ?? "Converted from expense",
        tax_year: taxYearForDate(expense.expense_date),
      });
      await expenseService.deleteExpense(expense.id);
      router.replace("/income-history" as any);
    } catch (e: any) {
      Alert.alert("Error", e.message);
      setConverting(false);
    }
  };

  const confirmDelete = async () => {
    if (!expense) return;
    setShowDeleteConfirm(false);
    setDeleting(true);
    try {
      await expenseService.deleteExpense(expense.id);
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e.message);
      setDeleting(false);
    }
  };

  // Determine the storage path for signed URL generation.
  // Prefer expense.storage_path — fall back to deriving from receipt_url if needed.
  const storagePath: string = expense?.storage_path ?? "";

  if (loading) {
    return (
      <SafeAreaView
        edges={["top", "bottom"]}
        style={{ flex: 1, backgroundColor: colour.background }}
      >
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color={colour.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!expense) {
    return (
      <SafeAreaView
        edges={["top", "bottom"]}
        style={{ flex: 1, backgroundColor: colour.background }}
      >
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ ...typography.bodyM, color: colour.textSub }}>
            Expense not found.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginTop: space.lg }}
          >
            <Text style={{ ...typography.bodyM, color: colour.primary }}>
              Go back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const claimable = expense.is_deductible ? Number(expense.amount) : 0;
  const itr12Code = expense.itr12_code ?? "S11(a)";
  const hasReceipt = !!storagePath || !!expense.receipt_url;

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.background }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />

      {/* Receipt viewer modal */}
      <ReceiptViewer
        visible={viewerVisible}
        storagePath={storagePath}
        onClose={() => setViewerVisible(false)}
      />

      <MXHeader
        title="Expense detail"
        showBack
        right={
          <TouchableOpacity
            onPress={() => router.push(`/edit-expense?id=${expense.id}` as any)}
            style={{ backgroundColor: colour.primary50, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: space.xs }}
          >
            <Text style={{ ...typography.labelS, color: colour.accentDeep }}>Edit</Text>
          </TouchableOpacity>
        }
      />

      {/* Content */}
      <ScrollView
        style={{
          flex: 1,
          backgroundColor: colour.bgCard,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
        }}
        contentContainerStyle={{ padding: space.lg, paddingBottom: 100 }}
      >
        {/* Hero — amount, vendor, chips and the claimable/non-deductible line
            all live in one dark card, matching the mockup's merged hero
            rather than splitting the amount (header) from the claimable
            figure (a separate card further down). */}
        <View
          style={{
            backgroundColor: colour.heroDark,
            borderRadius: radius.hero,
            padding: space.lg,
            marginBottom: space.xl,
          }}
        >
          <Text style={{ ...typography.eyebrow, color: colour.onNoir2, textTransform: "uppercase" }}>
            {(expense.category ?? "Expense")} · {formatDate(expense.expense_date)}
          </Text>
          <Text style={{ ...typography.heroAmount, color: colour.onNoir, marginTop: 10 }}>
            {fmt(expense.amount)}
          </Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colour.onNoir2, marginTop: 6 }}>
            {expense.vendor}
          </Text>

          <View style={{ flexDirection: "row", gap: space.sm, marginTop: space.md }}>
            {itr12Code ? (
              <View style={{
                backgroundColor: "rgba(255,255,255,0.12)", borderRadius: radius.full,
                paddingVertical: 5, paddingHorizontal: space.sm,
              }}>
                <Text style={{ ...typography.chipText, color: colour.onNoir }}>{itr12Code}</Text>
              </View>
            ) : null}
            <View style={{
              backgroundColor: expense.is_deductible ? colour.brandTeal : colour.danger,
              borderRadius: radius.full, paddingVertical: 5, paddingHorizontal: space.sm,
            }}>
              <Text style={{ ...typography.chipText, color: expense.is_deductible ? colour.text : colour.white }}>
                {expense.is_deductible ? "Deductible" : "Non-deductible"}
              </Text>
            </View>
          </View>

          <View
            style={{
              marginTop: space.lg,
              paddingTop: space.md,
              borderTopWidth: 1,
              borderTopColor: "rgba(255,255,255,0.14)",
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "space-between",
            }}
          >
            <View>
              <Text style={{ ...typography.eyebrow, color: colour.onNoir2, textTransform: "uppercase" }}>
                {expense.is_deductible ? "Tax claimable" : "Not deductible"}
              </Text>
              <Text style={{ fontSize: 11.5, fontWeight: "500", color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                {expense.is_deductible ? `ITR12 · full amount` : "Cannot be claimed on your ITR12"}
              </Text>
            </View>
            {expense.is_deductible && (
              <Text style={{ ...typography.claimValue, color: colour.brandTeal }}>
                {fmt(claimable)}
              </Text>
            )}
          </View>
        </View>

        {/* Details */}
        <Text
          style={{
            ...typography.eyebrow,
            color: colour.textSecondary,
            textTransform: "uppercase",
            marginBottom: space.sm,
          }}
        >
          DETAILS
        </Text>
        <View
          style={{
            backgroundColor: colour.bgCard,
            borderRadius: radius.card,
            borderWidth: 1,
            borderColor: colour.border,
            paddingHorizontal: space.lg,
            marginBottom: space.xl,
          }}
        >
          <Row label="Category" value={expense.category ?? "—"} />
          <Row label="Vendor" value={expense.vendor ?? "—"} />
          <Row label="Date" value={formatDate(expense.expense_date)} />
          <Row label="Tax year" value={expense.tax_year ?? ACTIVE_TAX_YEAR} />
          <Row label="Currency" value={expense.currency ?? "ZAR"} />
          {expense.vat_amount ? (
            <Row label="VAT amount" value={fmt(expense.vat_amount)} />
          ) : null}
          {expense.notes ? <Row label="Notes" value={expense.notes} /> : null}
          <Row
            label="Reference"
            value={expense.id.slice(0, 8).toUpperCase()}
            accent
          />
        </View>

        {/* Receipt */}
        <TouchableOpacity
          onPress={() => {
            if (hasReceipt && storagePath) {
              setViewerVisible(true);
            } else {
              router.push({
                pathname: "/scan-receipt-camera",
                params: { expenseId: expense.id },
              } as any);
            }
          }}
          style={{
            backgroundColor: hasReceipt ? colour.heroDark : colour.bgPage,
            borderRadius: radius.card,
            borderWidth: 1,
            borderColor: hasReceipt ? colour.heroDark : colour.border,
            padding: space.lg,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: space.xl,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 36, height: 36, borderRadius: radius.md, backgroundColor: hasReceipt ? "rgba(255,255,255,0.15)" : colour.surface2, alignItems: "center", justifyContent: "center", marginRight: space.sm }}>
              <IconSymbol name={hasReceipt ? "doc.fill" : "paperclip"} size={16} color={hasReceipt ? colour.white : colour.textSub} />
            </View>
            <View>
              <Text
                style={{
                  ...typography.cardTitle,
                  color: hasReceipt ? colour.onNoir : colour.textSecondary,
                }}
              >
                {hasReceipt ? "Receipt attached" : "No receipt uploaded"}
              </Text>
              <Text
                style={{ ...typography.mSub, marginTop: 3, color: hasReceipt ? colour.onNoir2 : colour.textSecondary }}
              >
                {hasReceipt ? "Tap to view full screen" : "Tap to add receipt"}
              </Text>
            </View>
          </View>
          <Text style={{ color: hasReceipt ? colour.onNoir2 : colour.textSecondary, fontSize: 18 }}>›</Text>
        </TouchableOpacity>

        {/* SARS compliance note */}
        <View
          style={{
            backgroundColor: colour.heroDark,
            borderRadius: radius.card,
            padding: space.md,
            marginBottom: space.xl,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs, marginBottom: space.xs }}>
            <IconSymbol name="checkmark.seal.fill" size={14} color={colour.primary} />
            <Text style={{ ...typography.labelS, color: colour.onNoir }}>
              SARS compliance
            </Text>
          </View>
          <Text style={{ ...typography.bodyS, color: colour.onNoir2 }}>
            Keep this receipt for 5 years from the date of assessment. Required
            for {itr12Code} deduction claims on your ITR12.
          </Text>
        </View>

        {/* Actions */}
        <TouchableOpacity
          onPress={() => router.push(`/edit-expense?id=${expense.id}` as any)}
          style={{
            backgroundColor: colour.primary,
            borderRadius: radius.pill,
            height: 52,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: space.md,
          }}
        >
          <Text style={{ ...typography.mBtn, color: colour.textOnPrimary }}>
            Edit expense
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowConvertConfirm(true)}
          disabled={converting}
          style={{
            borderRadius: radius.pill,
            borderWidth: 1.5,
            borderColor: colour.primary,
            height: 52,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: space.md,
            flexDirection: "row",
            gap: space.sm,
          }}
        >
          {converting ? (
            <ActivityIndicator color={colour.primary} />
          ) : (
            <>
              <IconSymbol name="arrow.left.arrow.right" size={16} color={colour.primary} />
              <Text style={{ ...typography.mBtn, color: colour.primary }}>
                Reclassify as income
              </Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDelete}
          disabled={deleting}
          style={{
            borderRadius: radius.pill,
            borderWidth: 1.5,
            borderColor: colour.danger,
            height: 52,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {deleting ? (
            <ActivityIndicator color={colour.danger} />
          ) : (
            <Text style={{ ...typography.mBtn, color: colour.danger }}>
              Delete expense
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      <ConfirmModal
        visible={showDeleteConfirm}
        title="Delete expense"
        message="This expense will be permanently removed. This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Keep it"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
      <ConfirmModal
        visible={showConvertConfirm}
        title="Reclassify as income?"
        message="This will remove the expense record and create a new income entry with the same amount and date."
        confirmLabel="Convert"
        cancelLabel="Cancel"
        onConfirm={confirmConvertToIncome}
        onCancel={() => setShowConvertConfirm(false)}
        icon="arrow.left.arrow.right"
      />
      <MXTabBar />
    </SafeAreaView>
  );
}
