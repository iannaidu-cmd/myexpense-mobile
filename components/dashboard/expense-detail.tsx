import { colour, radius, space, typography } from "@/tokens";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

interface Category {
  label: string;
  icon: string;
  color: string;
}

interface ExpenseDetailData {
  id: string;
  vendor: string;
  amount: string;
  vat: string;
  date: string;
  category: Category;
  payment: string;
  deductible: boolean;
  reference: string;
  note: string;
  taxSaving: string;
  itr12Section: string;
  scanned: boolean;
  confidence: number;
  items: string[];
  receiptDate?: string;
  receiptSize?: string;
}

interface ExpenseDetailScreenProps {
  expense?: ExpenseDetailData;
  onEdit?: () => void;
  onExport?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onBack?: () => void;
}

const DEFAULT_EXPENSE: ExpenseDetailData = {
  id: "exp_1",
  vendor: "Incredible Connection",
  amount: "R 1,249.00",
  vat: "R 162.87",
  date: "12 March 2026",
  category: { label: "Software & Tech", icon: "💻", color: colour.midNavy2 },
  payment: "💳 Credit Card",
  deductible: true,
  reference: "EXP-2026-03-0041",
  note: "USB-C Hub and HDMI cables for home office setup",
  taxSaving: "R 561.88",
  itr12Section: "Section 11(a)",
  scanned: true,
  confidence: 94,
  items: ["USB-C Hub × 1 — R 849.00", "HDMI Cable × 2 — R 400.00"],
  receiptDate: "12 Mar 2026",
  receiptSize: "1.2 MB",
};

export function ExpenseDetailScreen({
  expense = DEFAULT_EXPENSE,
  onEdit,
  onExport,
  onDuplicate,
  onDelete,
  onBack,
}: ExpenseDetailScreenProps) {
  const [showActionSheet, setShowActionSheet] = useState(false);

  const actions = [
    { icon: "✏️", label: "Edit expense",    color: colour.primary,  onPress: onEdit      },
    { icon: "📤", label: "Export to ITR12", color: colour.info,     onPress: onExport    },
    { icon: "📋", label: "Duplicate",       color: colour.midNavy2, onPress: onDuplicate },
    { icon: "🗑️", label: "Delete expense", color: colour.danger,   onPress: onDelete    },
  ];

  const handleAction = (action: (typeof actions)[0]) => {
    setShowActionSheet(false);
    action.onPress?.();
  };

  // ── Detail row helper ──────────────────────────────────────────────────────
  const DetailRow = ({
    label,
    value,
    highlight,
    isLast,
  }: {
    label: string;
    value: string;
    highlight?: boolean;
    isLast?: boolean;
  }) => (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: space.md,
        ...(isLast ? {} : { borderBottomWidth: 1, borderBottomColor: colour.border }),
      }}
    >
      <Text style={{ ...typography.bodyS, color: colour.textSub, fontWeight: "600" }}>
        {label}
      </Text>
      <Text
        style={{
          ...typography.bodyM,
          fontWeight: "700",
          color: highlight ? colour.primary : colour.text,
        }}
      >
        {value}
      </Text>
    </View>
  );

  // ── Section card helper ────────────────────────────────────────────────────
  const SectionCard = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <View
      style={{
        backgroundColor: colour.surface1,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colour.border,
        paddingHorizontal: 18,
        paddingVertical: 14,
        marginBottom: 16,
      }}
    >
      <Text
        style={{
          ...typography.labelS,
          color: colour.textSub,
          marginBottom: space.md,
          letterSpacing: 0.5,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colour.white }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: 28,
          backgroundColor: colour.primary,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <Pressable onPress={onBack}>
            <Text style={{ fontSize: 22, color: "rgba(255,255,255,0.65)" }}>←</Text>
          </Pressable>
          <Pressable
            style={{
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: radius.sm,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
            onPress={() => setShowActionSheet(true)}
          >
            <Text style={{ fontSize: 20, color: colour.white }}>⋯</Text>
          </Pressable>
        </View>

        {/* Category badge */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: space.sm,
            paddingHorizontal: 14,
            paddingVertical: 5,
            borderRadius: radius.pill,
            marginBottom: 12,
            backgroundColor: expense.category.color + "30",
            borderWidth: 1,
            borderColor: expense.category.color + "60",
            alignSelf: "flex-start",
          }}
        >
          <Text style={{ fontSize: 16 }}>{expense.category.icon}</Text>
          <Text style={{ ...typography.labelS, color: colour.white }}>
            {expense.category.label}
          </Text>
        </View>

        <Text style={{ ...typography.amountXL, color: colour.white, marginBottom: 4 }}>
          {expense.amount}
        </Text>
        <Text style={{ ...typography.bodyM, color: "rgba(255,255,255,0.55)" }}>
          {expense.vendor} • {expense.date}
        </Text>
      </View>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1, padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <SectionCard title="Expense Details">
          <DetailRow label="Reference"      value={expense.reference} />
          <DetailRow label="Payment Method" value={expense.payment}   />
          <DetailRow
            label="Deductible"
            value={expense.deductible ? "✓ Yes" : "✗ No"}
            highlight={expense.deductible}
            isLast
          />
        </SectionCard>

        <SectionCard title="Financial Summary">
          <DetailRow label="Subtotal"             value={expense.amount}    />
          <DetailRow label="VAT (15%)"            value={expense.vat}       />
          <DetailRow label="Estimated Tax Saving" value={expense.taxSaving} highlight isLast />
        </SectionCard>

        {expense.items.length > 0 && (
          <SectionCard title="Items">
            <View style={{ paddingVertical: 12 }}>
              {expense.items.map((item, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: space.md,
                    paddingVertical: space.sm,
                    ...(i < expense.items.length - 1
                      ? { borderBottomWidth: 1, borderBottomColor: colour.borderLight }
                      : {}),
                  }}
                >
                  <View
                    style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colour.primary }}
                  />
                  <Text style={{ ...typography.bodyM, color: colour.text, flex: 1 }}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </SectionCard>
        )}

        <SectionCard title="Tax Information">
          <DetailRow label="ITR12 Section"  value={expense.itr12Section} />
          <DetailRow
            label="OCR Confidence"
            value={expense.scanned ? `${expense.confidence}%` : "Manual Entry"}
            isLast
          />
        </SectionCard>

        {expense.note ? (
          <SectionCard title="Note">
            <Text style={{ ...typography.bodyM, color: colour.text, lineHeight: 22 }}>
              {expense.note}
            </Text>
          </SectionCard>
        ) : null}

        {/* Receipt */}
        {expense.scanned && (
          <Pressable
            style={{
              backgroundColor: colour.white,
              borderRadius: radius.lg,
              paddingHorizontal: 18,
              paddingVertical: 14,
              marginBottom: 20,
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              borderWidth: 1,
              borderColor: colour.border,
            }}
          >
            <View
              style={{
                width: 52,
                height: 64,
                borderRadius: 10,
                backgroundColor: colour.surface1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 26 }}>🧾</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.labelM, color: colour.text, marginBottom: 4 }}>
                Receipt Attached
              </Text>
              <Text style={{ ...typography.bodyXS, color: colour.textSub }}>
                Scanned {expense.receiptDate} · {expense.receiptSize}
              </Text>
            </View>
            <Text style={{ ...typography.labelM, color: colour.primary, fontWeight: "700" }}>
              View
            </Text>
          </Pressable>
        )}

        {/* Action buttons */}
        <View style={{ flexDirection: "row", gap: space.md }}>
          <Pressable
            style={{
              flex: 1,
              backgroundColor: colour.primary,
              borderRadius: radius.md,
              paddingVertical: 12,
              alignItems: "center",
            }}
            onPress={onEdit}
          >
            <Text style={{ ...typography.btnL, color: colour.onPrimary }}>✏️ Edit</Text>
          </Pressable>
          <Pressable
            style={{
              flex: 1,
              backgroundColor: colour.teal,
              borderRadius: radius.md,
              paddingVertical: 12,
              alignItems: "center",
            }}
            onPress={onExport}
          >
            <Text style={{ ...typography.btnL, color: colour.white }}>📤 Export</Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Action Sheet ─────────────────────────────────────────────────────── */}
      <Modal
        visible={showActionSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActionSheet(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(31,32,36,0.55)",
            justifyContent: "flex-end",
          }}
          onPress={() => setShowActionSheet(false)}
        >
          <Pressable
            style={{
              backgroundColor: colour.surface1,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              paddingTop: 20,
              paddingHorizontal: 20,
              paddingBottom: 40,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: radius.pill,
                backgroundColor: colour.border,
                alignSelf: "center",
                marginBottom: 20,
              }}
            />
            <Text style={{ ...typography.h4, color: colour.text, marginBottom: 16 }}>
              Expense Actions
            </Text>

            {actions.map((action, i) => (
              <Pressable
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderRadius: radius.md,
                  marginBottom: space.sm,
                  backgroundColor: colour.white,
                  borderWidth: 1.5,
                  borderColor: colour.border,
                }}
                onPress={() => handleAction(action)}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: radius.sm,
                    backgroundColor: action.color + "15",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 18 }}>{action.icon}</Text>
                </View>
                <Text style={{ ...typography.labelM, color: action.color, flex: 1 }}>
                  {action.label}
                </Text>
                <Text style={{ ...typography.bodyL, color: colour.textSub }}>›</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
