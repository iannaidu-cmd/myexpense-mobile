import { MXTabBar } from "@/components/MXTabBar";
import { colour, radius, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DeleteConfirmationScreen() {
  const router = useRouter();
  const expense = {
    description: "Telkom Fibre — March 2026",
    amount: 1250,
    category: "Phone & Internet",
    date: "15 Mar 2026",
  };
  const [loading, setLoading] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setDeleted(true);
    setTimeout(() => router.replace("/expense-history" as any), 1200);
  };

  if (deleted) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colour.bgPage,
          alignItems: "center",
          justifyContent: "center",
          padding: space.lg,
        }}
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: colour.successLight,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: space.xl,
          }}
        >
          <Text style={{ fontSize: 32 }}>✓</Text>
        </View>
        <Text
          style={[
            typography.heading3,
            {
              color: colour.textPrimary,
              textAlign: "center",
              marginBottom: space.sm,
            },
          ]}
        >
          Expense Deleted
        </Text>
        <Text
          style={[
            typography.bodyM,
            { color: colour.textSecondary, textAlign: "center" },
          ]}
        >
          The expense has been removed from your records.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.bgPage }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colour.bgPage} />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: space.lg,
          borderBottomWidth: 1,
          borderBottomColor: colour.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text
            style={{
              fontSize: 26,
              color: colour.textSecondary,
              lineHeight: 30,
            }}
          >
            ‹
          </Text>
        </TouchableOpacity>
        <Text
          style={[
            typography.heading4,
            { color: colour.textPrimary, marginLeft: space.md },
          ]}
        >
          Delete Expense
        </Text>
      </View>

      <View
        style={{ flex: 1, padding: space.lg, justifyContent: "space-between" }}
      >
        <View>
          {/* Warning icon */}
          <View
            style={{
              alignItems: "center",
              marginTop: space["3xl"],
              marginBottom: space["2xl"],
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colour.dangerLight,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 36 }}>🗑️</Text>
            </View>
          </View>

          <Text
            style={[
              typography.heading3,
              {
                color: colour.textPrimary,
                textAlign: "center",
                marginBottom: space.sm,
              },
            ]}
          >
            Delete this expense?
          </Text>
          <Text
            style={[
              typography.bodyM,
              {
                color: colour.textSecondary,
                textAlign: "center",
                marginBottom: space["2xl"],
              },
            ]}
          >
            This action cannot be undone. The expense will be permanently
            removed from your records and tax calculations.
          </Text>

          {/* Expense summary card */}
          <View
            style={{
              backgroundColor: colour.dangerLight,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colour.danger,
              padding: space.lg,
            }}
          >
            <Text
              style={[
                typography.labelM,
                { color: colour.danger, marginBottom: space.md },
              ]}
            >
              Expense to be deleted
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: space.sm,
              }}
            >
              <Text style={[typography.bodyS, { color: colour.textSecondary }]}>
                Description
              </Text>
              <Text
                style={[
                  typography.bodyM,
                  { color: colour.textPrimary, fontWeight: "500" },
                ]}
                numberOfLines={1}
              >
                {expense.description}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: space.sm,
              }}
            >
              <Text style={[typography.bodyS, { color: colour.textSecondary }]}>
                Amount
              </Text>
              <Text style={[typography.amountS, { color: colour.danger }]}>
                R{" "}
                {Number(expense.amount).toLocaleString("en-ZA", {
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: space.sm,
              }}
            >
              <Text style={[typography.bodyS, { color: colour.textSecondary }]}>
                Category
              </Text>
              <Text style={[typography.bodyM, { color: colour.textPrimary }]}>
                {expense.category}
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={[typography.bodyS, { color: colour.textSecondary }]}>
                Date
              </Text>
              <Text style={[typography.bodyM, { color: colour.textPrimary }]}>
                {expense.date}
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: colour.warningLight,
              borderRadius: radius.sm,
              padding: space.md,
              marginTop: space.lg,
            }}
          >
            <Text style={[typography.bodyS, { color: colour.warning }]}>
              ⚠️ Deleting this expense will affect your ITR12 deduction
              calculations for the current tax year.
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={{ gap: space.md }}>
          <TouchableOpacity
            onPress={handleDelete}
            disabled={loading}
            style={{
              backgroundColor: loading ? colour.border : colour.danger,
              borderRadius: radius.pill,
              height: 52,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {loading ? (
              <ActivityIndicator color={colour.textOnPrimary} />
            ) : (
              <Text style={[typography.btnL, { color: colour.textOnPrimary }]}>
                Yes, Delete Expense
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              borderRadius: radius.pill,
              borderWidth: 1.5,
              borderColor: colour.border,
              height: 52,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={[typography.btnL, { color: colour.textSecondary }]}>
              Cancel — Keep Expense
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <MXTabBar />
    </SafeAreaView>
  );
}
