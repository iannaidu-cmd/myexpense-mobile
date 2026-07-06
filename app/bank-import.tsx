import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { SuccessModal } from "@/components/SuccessModal";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { CATEGORIES, NON_DEDUCTIBLE_LABEL } from "@/constants/categories";
import {
  ParsedTransaction,
  pickAndParseStatement,
} from "@/services/bankImportService";
import { taxYearForDate } from "@/lib/taxRules";
import { expenseService } from "@/services/expenseService";
import { incomeService } from "@/services/incomeService";
import { useAuthStore } from "@/stores/authStore";
import { useExpenseStore } from "@/stores/expenseStore";
import { colour, radius, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Category picker modal ────────────────────────────────────────────────────

function CategoryPickerModal({
  visible,
  current,
  onSelect,
  onClose,
}: {
  visible: boolean;
  current: string;
  onSelect: (cat: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
        activeOpacity={1}
        onPress={onClose}
      />
      <View
        style={{
          backgroundColor: colour.white,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          maxHeight: "65%",
          paddingTop: space.md,
          paddingBottom: space.xl,
        }}
      >
        <View
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: colour.borderLight,
            alignSelf: "center",
            marginBottom: space.md,
          }}
        />
        <Text
          style={{
            ...typography.labelS,
            color: colour.textSub,
            letterSpacing: 0.5,
            paddingHorizontal: space.lg,
            marginBottom: space.sm,
          }}
        >
          SELECT CATEGORY
        </Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {CATEGORIES.map((cat) => {
            const isSelected = cat.label === current;
            return (
              <TouchableOpacity
                key={cat.label}
                onPress={() => { onSelect(cat.label); onClose(); }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: space.lg,
                  paddingVertical: 12,
                  backgroundColor: isSelected ? colour.primary50 : colour.white,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: radius.md,
                    backgroundColor: isSelected ? colour.primary : colour.surface1,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: space.md,
                  }}
                >
                  <IconSymbol
                    name={cat.icon as any}
                    size={14}
                    color={isSelected ? colour.white : colour.textSub}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: isSelected ? "600" : "400",
                      color: isSelected ? colour.primary : colour.text,
                    }}
                  >
                    {cat.label}
                  </Text>
                  {!cat.deductible && (
                    <Text style={{ fontSize: 11, color: colour.textHint }}>Not deductible</Text>
                  )}
                </View>
                {isSelected && (
                  <IconSymbol name="checkmark" size={14} color={colour.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Transaction row ──────────────────────────────────────────────────────────

function TransactionRow({
  tx,
  selected,
  onToggle,
  onCategoryPress,
  onToggleBusiness,
}: {
  tx: ParsedTransaction;
  selected: boolean;
  onToggle: () => void;
  onCategoryPress: () => void;
  onToggleBusiness: () => void;
}) {
  const cat = CATEGORIES.find((c) => c.label === tx.suggestedCategory);
  const isPersonal = tx.suggestedCategory === NON_DEDUCTIBLE_LABEL;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: space.md,
        borderBottomWidth: 1,
        borderBottomColor: colour.borderLight,
        backgroundColor: selected ? colour.white : colour.surface1,
        opacity: selected ? 1 : 0.55,
      }}
    >
      {/* Checkbox */}
      <TouchableOpacity onPress={onToggle} style={{ marginRight: space.sm }} hitSlop={8}>
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            borderWidth: 2,
            borderColor: selected ? colour.primary : colour.borderLight,
            backgroundColor: selected ? colour.primary : colour.white,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {selected && <IconSymbol name="checkmark" size={10} color={colour.white} />}
        </View>
      </TouchableOpacity>

      {/* Date + vendor + business toggle */}
      <View style={{ flex: 1, marginRight: space.sm }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: colour.text }} numberOfLines={1}>
          {tx.vendor}
        </Text>
        <Text style={{ fontSize: 11, color: colour.textSub, marginTop: 2 }}>
          {new Date(tx.date + "T00:00:00").toLocaleDateString("en-ZA", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </Text>
        {tx.type !== 'income' && (
          <TouchableOpacity
            onPress={onToggleBusiness}
            style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}
            hitSlop={4}
          >
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                borderWidth: 1.5,
                borderColor: !isPersonal ? colour.success : colour.borderLight,
                backgroundColor: !isPersonal ? colour.success : colour.white,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {!isPersonal && <IconSymbol name="checkmark" size={8} color={colour.white} />}
            </View>
            <Text style={{ fontSize: 11, fontWeight: "600", color: !isPersonal ? colour.success : colour.textSub }}>
              Business
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Amount */}
      <Text
        style={{
          fontSize: 13,
          fontWeight: "700",
          color: tx.type === 'income' ? colour.success : colour.text,
          marginRight: space.sm,
          minWidth: 72,
          textAlign: "right",
        }}
      >
        {tx.type === 'income' ? "+" : ""}R {tx.amount.toFixed(2)}
      </Text>

      {/* Category chip / Income badge */}
      {tx.type === 'income' ? (
        <View
          style={{
            backgroundColor: colour.successBg,
            borderRadius: radius.pill,
            paddingHorizontal: 8,
            paddingVertical: 4,
            maxWidth: 120,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: "700", color: colour.success }}>
            Income
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          onPress={onCategoryPress}
          style={{
            backgroundColor: isPersonal ? colour.surface2 : colour.primary50,
            borderRadius: radius.pill,
            paddingHorizontal: 8,
            paddingVertical: 4,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            maxWidth: 120,
          }}
        >
          {cat && (
            <IconSymbol
              name={cat.icon as any}
              size={10}
              color={isPersonal ? colour.textSub : colour.primary}
            />
          )}
          <Text
            style={{
              fontSize: 10,
              fontWeight: "600",
              color: isPersonal ? colour.textSub : colour.primary,
            }}
            numberOfLines={1}
          >
            {tx.suggestedCategory === NON_DEDUCTIBLE_LABEL ? "Personal" : tx.suggestedCategory}
          </Text>
          <IconSymbol
            name="chevron.down"
            size={8}
            color={isPersonal ? colour.textSub : colour.primary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Idle / empty state ───────────────────────────────────────────────────────

function IdleState({ onPick, loading }: { onPick: () => void; loading: boolean }) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: space.lg, paddingBottom: space["5xl"] }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View
        style={{
          backgroundColor: colour.noir,
          borderRadius: radius.xl,
          padding: space.lg,
          marginBottom: space.lg,
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colour.primary,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: space.md,
          }}
        >
          <IconSymbol name="tray.and.arrow.up.fill" size={24} color={colour.white} />
        </View>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: colour.onNoir,
            textAlign: "center",
            marginBottom: space.xs,
          }}
        >
          Import bank statement
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: colour.textHint,
            textAlign: "center",
            lineHeight: 19,
          }}
        >
          Export a statement from your banking app, then import it here. We'll
          automatically categorise each debit transaction.
        </Text>

        <TouchableOpacity
          onPress={onPick}
          disabled={loading}
          style={{
            marginTop: space.md,
            backgroundColor: colour.primary,
            borderRadius: radius.md,
            paddingHorizontal: space.lg,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: space.sm,
          }}
        >
          {loading ? (
            <ActivityIndicator color={colour.white} size="small" />
          ) : (
            <IconSymbol name="doc.badge.plus" size={16} color={colour.white} />
          )}
          <Text style={{ fontSize: 14, fontWeight: "700", color: colour.white }}>
            {loading ? "Parsing…" : "Choose file"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Supported formats */}
      <View
        style={{
          backgroundColor: colour.white,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colour.borderLight,
          padding: space.md,
          marginBottom: space.md,
        }}
      >
        <Text
          style={{
            ...typography.labelS,
            color: colour.textSub,
            letterSpacing: 0.5,
            marginBottom: space.sm,
          }}
        >
          SUPPORTED FORMATS
        </Text>
        {[
          ["CSV (.csv)", "Comma-separated values — most common bank export"],
          ["OFX / QFX (.ofx, .qfx)", "Open Financial Exchange — downloadable from most SA banks"],
        ].map(([fmt, desc]) => (
          <View
            key={fmt}
            style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 8 }}
          >
            <IconSymbol name="doc.text.fill" size={13} color={colour.primary} style={{ marginTop: 1, marginRight: 8 } as any} />
            <View>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colour.text }}>{fmt}</Text>
              <Text style={{ fontSize: 11, color: colour.textSub }}>{desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Supported banks */}
      <View
        style={{
          backgroundColor: colour.white,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colour.borderLight,
          padding: space.md,
          marginBottom: space.md,
        }}
      >
        <Text
          style={{
            ...typography.labelS,
            color: colour.textSub,
            letterSpacing: 0.5,
            marginBottom: space.sm,
          }}
        >
          SUPPORTED BANKS
        </Text>
        {[
          "FNB",
          "ABSA",
          "Nedbank",
          "Standard Bank",
          "Capitec",
          "Investec",
          "Discovery Bank",
          "Other SA banks (CSV export)",
        ].map((bank) => (
          <View
            key={bank}
            style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}
          >
            <IconSymbol name="building.columns.fill" size={12} color={colour.textSub} style={{ marginRight: 8 } as any} />
            <Text style={{ fontSize: 13, color: colour.text }}>{bank}</Text>
          </View>
        ))}
      </View>

      {/* How-to */}
      <View
        style={{
          backgroundColor: colour.primary50,
          borderRadius: radius.md,
          padding: space.md,
        }}
      >
        <Text
          style={{
            ...typography.labelS,
            color: colour.textSub,
            letterSpacing: 0.5,
            marginBottom: space.sm,
          }}
        >
          HOW TO EXPORT FROM YOUR BANK
        </Text>
        {[
          "FNB App → Account → Statements → Download (CSV or OFX)",
          "ABSA App → History → Export → CSV",
          "Nedbank App → Statements → Download statement",
          "Standard Bank → Transaction history → Export",
          "Capitec App → Statement → Share / Export",
        ].map((step, i) => (
          <Text
            key={i}
            style={{ fontSize: 12, color: colour.textSub, lineHeight: 18, marginBottom: 4 }}
          >
            {step}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

type FilterTab = "All" | "Deductible" | "Personal" | "Income";

export default function BankImportScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeTaxYear } = useExpenseStore();

  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pickerLoading, setPickerLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [importedIncomeCount, setImportedIncomeCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [filter, setFilter] = useState<FilterTab>("All");
  const [categoryPickerFor, setCategoryPickerFor] = useState<string | null>(null);

  const hasTransactions = transactions.length > 0;

  // ── File pick + parse ──────────────────────────────────────────────────────

  const handlePick = async () => {
    setPickerLoading(true);
    try {
      const parsed = await pickAndParseStatement();
      if (parsed === null) return; // user cancelled
      if (parsed.length === 0) {
        Alert.alert(
          "No transactions found",
          "The file was parsed but contained no debit transactions. Make sure you exported a bank statement (not an invoice or other document) and that it includes outgoing transactions.",
        );
        return;
      }
      setTransactions(parsed);
      // Select all by default
      setSelected(new Set(parsed.map((t) => t.id)));
    } catch (err: any) {
      Alert.alert("Could not parse file", err?.message ?? "Unknown error. Try a CSV export from your bank.");
    } finally {
      setPickerLoading(false);
    }
  };

  // ── Selection helpers ──────────────────────────────────────────────────────

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(transactions.map((t) => t.id)));
  const selectDeductible = () =>
    setSelected(new Set(transactions.filter((t) => t.isDeductible).map((t) => t.id)));

  // ── Category change ────────────────────────────────────────────────────────

  const updateCategory = (id: string, newCategory: string) => {
    const cat = CATEGORIES.find((c) => c.label === newCategory);
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, suggestedCategory: newCategory, isDeductible: cat?.deductible ?? false }
          : t,
      ),
    );
  };

  const toggleBusiness = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const isPersonal = t.suggestedCategory === NON_DEDUCTIBLE_LABEL;
        if (isPersonal) {
          const firstBusiness = CATEGORIES.find((c) => c.deductible);
          return { ...t, suggestedCategory: firstBusiness?.label ?? t.suggestedCategory, isDeductible: true };
        }
        return { ...t, suggestedCategory: NON_DEDUCTIBLE_LABEL, isDeductible: false };
      }),
    );
  };

  // ── Import ─────────────────────────────────────────────────────────────────

  const handleImport = async () => {
    if (!user) return;
    const toImport = transactions.filter((t) => selected.has(t.id));
    if (toImport.length === 0) {
      Alert.alert("Nothing selected", "Tick at least one transaction to import.");
      return;
    }

    setImporting(true);
    try {
      const expenseEntries = toImport.filter((t) => t.type !== 'income');
      const incomeEntries = toImport.filter((t) => t.type === 'income');

      // Deduplicate expenses against existing records
      await expenseService.removeDuplicates(user.id, activeTaxYear);
      const existing = await expenseService.getAllExpenses(user.id);
      const existingKeys = new Set(
        existing.map((e) => `${e.vendor}|${Number(e.amount).toFixed(2)}|${e.expense_date}`),
      );
      const freshExpenses = expenseEntries.filter(
        (tx) => !existingKeys.has(`${tx.vendor}|${tx.amount.toFixed(2)}|${tx.date}`),
      );
      const skipped = expenseEntries.length - freshExpenses.length;

      if (freshExpenses.length === 0 && incomeEntries.length === 0) {
        Alert.alert(
          "Already imported",
          `All ${toImport.length} selected transaction${toImport.length !== 1 ? "s" : ""} already exist in your records.`,
        );
        return;
      }

      await Promise.all([
        ...freshExpenses.map((tx) =>
          expenseService.addExpense(user.id, {
            vendor: tx.vendor,
            amount: tx.amount,
            category: tx.suggestedCategory,
            tax_year: taxYearForDate(tx.date),
            expense_date: tx.date,
            is_deductible: tx.isDeductible,
            notes: `Imported from bank statement`,
          }),
        ),
        ...incomeEntries.map((tx) =>
          incomeService.addIncome(user.id, {
            amount: tx.amount,
            source: tx.vendor,
            date: tx.date,
            description: 'Imported from bank statement',
            tax_year: taxYearForDate(tx.date),
          }),
        ),
      ]);
      setImportedCount(freshExpenses.length);
      setImportedIncomeCount(incomeEntries.length);
      setSkippedCount(skipped);
      setShowSuccess(true);
      setTransactions([]);
      setSelected(new Set());
      setFilter("All");
    } catch (err: any) {
      Alert.alert("Import failed", err?.message ?? "Please try again.");
    } finally {
      setImporting(false);
    }
  };

  // ── Filtered list ──────────────────────────────────────────────────────────

  const filtered = transactions.filter((t) => {
    if (filter === "Deductible") return t.isDeductible && t.type !== 'income';
    if (filter === "Personal") return !t.isDeductible && t.type !== 'income';
    if (filter === "Income") return t.type === 'income';
    return true;
  });

  const selectedCount = transactions.filter((t) => selected.has(t.id)).length;
  const selectedTotal = transactions
    .filter((t) => selected.has(t.id))
    .reduce((sum, t) => sum + t.amount, 0);

  const activePickerTx = transactions.find((t) => t.id === categoryPickerFor);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />
      <MXHeader title="Import transactions" showBack />

      {!hasTransactions ? (
        <IdleState onPick={handlePick} loading={pickerLoading} />
      ) : (
        <>
          {/* Summary bar */}
          <View
            style={{
              paddingHorizontal: space.lg,
              paddingVertical: space.sm,
              backgroundColor: colour.white,
              borderBottomWidth: 1,
              borderBottomColor: colour.borderLight,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View>
              <Text style={{ fontSize: 13, fontWeight: "700", color: colour.text }}>
                {transactions.length} transactions found
              </Text>
              <Text style={{ fontSize: 11, color: colour.textSub }}>
                {selectedCount} selected · R{" "}
                {selectedTotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: space.sm }}>
              <TouchableOpacity onPress={selectDeductible}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: colour.primary }}>
                  Deductible only
                </Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 11, color: colour.borderLight }}>|</Text>
              <TouchableOpacity onPress={selectAll}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: colour.primary }}>
                  Select all
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Filter tabs */}
          <View
            style={{
              flexDirection: "row",
              paddingHorizontal: space.lg,
              paddingVertical: space.xs,
              backgroundColor: colour.background,
              borderBottomWidth: 1,
              borderBottomColor: colour.borderLight,
              gap: space.xs,
            }}
          >
            {(["All", "Deductible", "Personal", "Income"] as FilterTab[]).map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={{
                  paddingHorizontal: space.md,
                  paddingVertical: 6,
                  borderRadius: radius.pill,
                  backgroundColor: filter === f ? colour.noir : colour.surface1,
                  borderWidth: 1,
                  borderColor: filter === f ? colour.noir : colour.borderLight,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: filter === f ? colour.onNoir : colour.textSub,
                  }}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Transaction list */}
          <FlatList
            data={filtered}
            keyExtractor={(t) => t.id}
            renderItem={({ item }) => (
              <TransactionRow
                tx={item}
                selected={selected.has(item.id)}
                onToggle={() => toggleSelected(item.id)}
                onCategoryPress={() => setCategoryPickerFor(item.id)}
                onToggleBusiness={() => toggleBusiness(item.id)}
              />
            )}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            ListEmptyComponent={
              <View style={{ padding: space.xl, alignItems: "center" }}>
                <IconSymbol name="tray" size={32} color={colour.textSub} />
                <Text style={{ fontSize: 13, color: colour.textSub, marginTop: space.md }}>
                  No {filter.toLowerCase()} transactions
                </Text>
              </View>
            }
          />

          {/* Import button */}
          <View
            style={{
              position: "absolute",
              bottom: 72,
              left: space.lg,
              right: space.lg,
              backgroundColor: colour.white,
              borderRadius: radius.md,
              shadowColor: colour.noir,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.12,
              shadowRadius: 8,
              elevation: 6,
              overflow: "hidden",
            }}
          >
            <TouchableOpacity
              onPress={handleImport}
              disabled={importing || selectedCount === 0}
              style={{
                backgroundColor: selectedCount > 0 ? colour.primary : colour.surface2,
                paddingVertical: 14,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: space.sm,
              }}
            >
              {importing ? (
                <ActivityIndicator color={colour.white} size="small" />
              ) : (
                <IconSymbol
                  name="tray.and.arrow.down.fill"
                  size={16}
                  color={selectedCount > 0 ? colour.white : colour.textSub}
                />
              )}
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: selectedCount > 0 ? colour.white : colour.textSub,
                }}
              >
                {importing
                  ? "Importing…"
                  : (() => {
                      const expCount = transactions.filter((t) => selected.has(t.id) && t.type !== 'income').length;
                      const incCount = transactions.filter((t) => selected.has(t.id) && t.type === 'income').length;
                      if (expCount > 0 && incCount > 0) return `Import ${expCount} expense${expCount !== 1 ? "s" : ""} + ${incCount} income`;
                      if (incCount > 0) return `Import ${incCount} income entr${incCount !== 1 ? "ies" : "y"}`;
                      return `Import ${expCount} expense${expCount !== 1 ? "s" : ""}`;
                    })()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setTransactions([]);
                setSelected(new Set());
                setFilter("All");
              }}
              style={{ paddingVertical: 10, alignItems: "center" }}
            >
              <Text style={{ fontSize: 13, color: colour.textSub }}>Choose a different file</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Category picker modal */}
      {activePickerTx && (
        <CategoryPickerModal
          visible={!!categoryPickerFor}
          current={activePickerTx.suggestedCategory}
          onSelect={(cat) => updateCategory(activePickerTx.id, cat)}
          onClose={() => setCategoryPickerFor(null)}
        />
      )}

      {/* Success modal */}
      <SuccessModal
        visible={showSuccess}
        title="Import complete"
        message={[
          importedCount > 0 ? `${importedCount} expense${importedCount !== 1 ? "s" : ""} added to ${activeTaxYear}` : "",
          importedIncomeCount > 0 ? `${importedIncomeCount} income entr${importedIncomeCount !== 1 ? "ies" : "y"} saved` : "",
          skippedCount > 0 ? `${skippedCount} duplicate${skippedCount !== 1 ? "s" : ""} skipped` : "",
        ].filter(Boolean).join("\n")}
        primaryLabel="Done"
        onPrimary={() => {
          setShowSuccess(false);
          router.replace("/(tabs)");
        }}
      />

      <MXTabBar />
    </SafeAreaView>
  );
}
