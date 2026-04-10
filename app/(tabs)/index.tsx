import { MXButton } from "@/components/MXButton";
import { MXCard } from "@/components/MXCard";
import { MXHeader } from "@/components/MXHeader";
import MXLogo from "@/components/MXLogo";
import { expenseService } from "@/services/expenseService";
import { incomeService } from "@/services/incomeService";
import { profileService } from "@/services/profileService";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
import { ACTIVE_TAX_YEAR } from "@/types/database";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MENU_ITEMS = [
  { label: "My expenses", icon: "💳", route: "/(tabs)/reports" as const },
  { label: "Income history", icon: "💵", route: "/income-history" as any },
  { label: "Scan receipt", icon: "📷", route: "/(tabs)/scan" as const },
  { label: "ITR12 export", icon: "📄", route: "/itr12-export-setup" as const },
  { label: "Tax summary", icon: "🧾", route: "/tax-summary" as const },
  {
    label: "Deductibility guide",
    icon: "📘",
    route: "/deductibility-guide" as const,
  },
  { label: "Mileage tracker", icon: "🚗", route: "/mileage-tracker" as const },
];

const formatZAR = (amount: number) =>
  `R ${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  // Profile
  const [firstName, setFirstName] = useState("");

  // Live data
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalDeductions, setTotalDeductions] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Estimated tax saving (31% marginal rate)
  const estimatedSaving = Math.round(totalDeductions * 0.31);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [profile, totals, incomeTotals, recent] = await Promise.all([
        profileService.getProfile(user.id),
        expenseService.getTotals(user.id, ACTIVE_TAX_YEAR),
        incomeService.getTotals(user.id),
        expenseService.getRecentExpenses(user.id, 5),
      ]);
      if (profile?.full_name) {
        setFirstName(profile.full_name.split(" ")[0]);
      }
      setTotalExpenses(totals.totalExpenses);
      setTotalDeductions(totals.totalDeductions);
      setTotalIncome(incomeTotals.totalIncome);
      setRecentExpenses(recent);
    } catch (e) {
      console.error("HomeScreen load error:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Reload every time the tab comes into focus (e.g. after adding an expense)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const menuShadow =
    Platform.OS === "ios"
      ? {
          shadowColor: "#000",
          shadowOffset: { width: 4, height: 0 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
        }
      : Platform.OS === "android"
        ? { elevation: 12 }
        : { boxShadow: "4px 0px 16px rgba(0,0,0,0.15)" };

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.primary }}
    >
      <StatusBar barStyle="light-content" backgroundColor={colour.primary} />

      {/* Drawer modal */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }}
          activeOpacity={1}
          onPress={() => setMenuOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "72%",
              backgroundColor: colour.white,
              paddingTop: 60,
              paddingHorizontal: space.lg,
              ...menuShadow,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: space.xl,
              }}
            >
              <MXLogo size={36} variant="dark" />
              <View style={{ marginLeft: space.md }}>
                <Text style={{ ...typography.h4, color: colour.text }}>
                  MyExpense
                </Text>
                <Text style={{ ...typography.bodyXS, color: colour.textHint }}>
                  {firstName || user?.email} · {ACTIVE_TAX_YEAR}
                </Text>
              </View>
            </View>
            <View
              style={{
                height: 1,
                backgroundColor: colour.surface2,
                marginBottom: space.lg,
              }}
            />
            {MENU_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => {
                  setMenuOpen(false);
                  router.push(item.route);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: space.md,
                  gap: space.md,
                }}
              >
                <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                <Text style={{ ...typography.bodyM, color: colour.text }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
            <View
              style={{
                height: 1,
                backgroundColor: colour.surface2,
                marginTop: space.lg,
                marginBottom: space.md,
              }}
            />
            <TouchableOpacity
              onPress={() => setMenuOpen(false)}
              style={{ paddingVertical: space.md }}
            >
              <Text style={{ ...typography.bodyS, color: colour.textHint }}>
                ✕ Close menu
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <MXHeader
        title={`${greeting}${firstName ? `, ${firstName}` : ""}`}
        subtitle={`Tax year ${ACTIVE_TAX_YEAR}`}
        right={
          <TouchableOpacity
            onPress={() => setMenuOpen(true)}
            style={{
              width: 56,
              height: 56,
              borderRadius: radius.md,
              backgroundColor: "rgba(255,255,255,0.15)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MXLogo size={30} variant="light" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={{
          backgroundColor: colour.background,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
        }}
        contentContainerStyle={{ paddingBottom: space.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={{ alignItems: "center", paddingTop: space["5xl"] }}>
            <ActivityIndicator color={colour.primary} size="large" />
          </View>
        ) : (
          <>
            {/* Stats card */}
            <View
              style={{
                marginHorizontal: space.lg,
                marginTop: space.lg,
                marginBottom: space.md,
              }}
            >
              <MXCard style={{ padding: 0, overflow: "hidden" }}>
                <View
                  style={{
                    paddingVertical: space.lg,
                    paddingHorizontal: space.lg,
                  }}
                >
                  <Text
                    style={{
                      ...typography.bodyS,
                      color: colour.textHint,
                      marginBottom: 4,
                    }}
                  >
                    Total expenses
                  </Text>
                  <Text
                    style={{
                      fontFamily: typography.amountXL.fontFamily,
                      fontSize: 48,
                      lineHeight: 56,
                      color: colour.text,
                    }}
                  >
                    {formatZAR(totalExpenses)}
                  </Text>
                </View>
                <View
                  style={{
                    height: 1,
                    backgroundColor: colour.surface2,
                    marginHorizontal: space.lg,
                  }}
                />
                <View
                  style={{
                    paddingVertical: space.lg,
                    paddingHorizontal: space.lg,
                  }}
                >
                  <Text
                    style={{
                      ...typography.bodyS,
                      color: colour.textHint,
                      marginBottom: 4,
                    }}
                  >
                    Total income
                  </Text>
                  <Text
                    style={{
                      fontFamily: typography.amountXL.fontFamily,
                      fontSize: 32,
                      lineHeight: 40,
                      color: colour.success,
                    }}
                  >
                    {formatZAR(totalIncome)}
                  </Text>
                </View>
                <View
                  style={{
                    height: 1,
                    backgroundColor: colour.surface2,
                    marginHorizontal: space.lg,
                  }}
                />
                <View
                  style={{
                    paddingVertical: space.md,
                    paddingHorizontal: space.lg,
                  }}
                >
                  <Text
                    style={{
                      ...typography.bodyS,
                      color: colour.textHint,
                      marginBottom: 2,
                    }}
                  >
                    Estimated tax saving
                  </Text>
                  <Text
                    style={{
                      fontFamily: typography.amountXL.fontFamily,
                      fontSize: 24,
                      lineHeight: 30,
                      color: colour.primary,
                    }}
                  >
                    {formatZAR(estimatedSaving)}
                  </Text>
                </View>
              </MXCard>
            </View>

            {/* Action buttons */}
            <View
              style={{
                flexDirection: "row",
                marginHorizontal: space.lg,
                gap: space.md,
                marginBottom: space.xl,
              }}
            >
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/add-expense")}
                style={{
                  flex: 1,
                  backgroundColor: colour.primary,
                  borderRadius: radius.md,
                  paddingVertical: space.lg,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ ...typography.actionM, color: colour.onPrimary }}
                >
                  + Add expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/add-income" as any)}
                style={{
                  flex: 1,
                  backgroundColor: colour.success,
                  borderRadius: radius.md,
                  paddingVertical: space.lg,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ ...typography.actionM, color: colour.onPrimary }}
                >
                  + Add income
                </Text>
              </TouchableOpacity>
            </View>

            {/* Scan Receipt banner */}
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/scan")}
              style={{ marginHorizontal: space.lg, marginBottom: space.xl }}
            >
              <MXCard
                style={{
                  backgroundColor: colour.primary,
                  alignItems: "center",
                  paddingVertical: space["3xl"],
                }}
              >
                <Text style={{ fontSize: 40, marginBottom: space.sm }}>📷</Text>
                <Text
                  style={{
                    ...typography.h2,
                    color: colour.onPrimary,
                    marginBottom: space.xs,
                  }}
                >
                  Scan receipt
                </Text>
                <Text
                  style={{
                    ...typography.bodyS,
                    color: "rgba(255,255,255,0.75)",
                    textAlign: "center",
                  }}
                >
                  Capture, extract and categorise in seconds
                </Text>
              </MXCard>
            </TouchableOpacity>

            {/* Recent Expenses */}
            <View
              style={{ marginHorizontal: space.lg, marginBottom: space.xl }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: space.md,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ ...typography.h4, color: colour.text }}>
                    Recent expenses
                  </Text>
                  <Text
                    style={{
                      ...typography.bodyXS,
                      color: colour.textHint,
                      marginTop: 2,
                    }}
                  >
                    Your latest transactions
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/reports")}
                >
                  <Text
                    style={{ ...typography.actionS, color: colour.primary }}
                  >
                    See all
                  </Text>
                </TouchableOpacity>
              </View>

              {recentExpenses.length === 0 ? (
                <MXCard
                  style={{ alignItems: "center", paddingVertical: space.xl }}
                >
                  <Text style={{ fontSize: 32, marginBottom: space.sm }}>
                    🧾
                  </Text>
                  <Text
                    style={{
                      ...typography.bodyM,
                      color: colour.textSub,
                      textAlign: "center",
                    }}
                  >
                    No expenses yet.{"\n"}Add your first expense to get started.
                  </Text>
                </MXCard>
              ) : (
                <MXCard style={{ padding: 0, overflow: "hidden" }}>
                  {recentExpenses.map((expense, index) => (
                    <View key={expense.id}>
                      <TouchableOpacity
                        onPress={() =>
                          router.push(`/expense-detail?id=${expense.id}` as any)
                        }
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: space.md,
                          paddingHorizontal: space.lg,
                        }}
                      >
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: radius.sm,
                            backgroundColor: colour.primary50,
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: space.md,
                          }}
                        >
                          <Text
                            style={{
                              ...typography.bodyS,
                              color: colour.primary,
                            }}
                          >
                            {expense.category?.charAt(0) ?? "?"}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{ ...typography.bodyM, color: colour.text }}
                          >
                            {expense.vendor}
                          </Text>
                          <Text
                            style={{
                              ...typography.bodyXS,
                              color: colour.textHint,
                              marginTop: 2,
                            }}
                          >
                            {expense.category} ·{" "}
                            {formatDate(expense.expense_date)}
                          </Text>
                        </View>
                        <Text
                          style={{
                            ...typography.bodyM,
                            color: colour.text,
                            fontWeight: "700",
                          }}
                        >
                          {formatZAR(expense.amount)}
                        </Text>
                      </TouchableOpacity>
                      {index < recentExpenses.length - 1 && (
                        <View
                          style={{
                            height: 1,
                            backgroundColor: colour.surface2,
                            marginHorizontal: space.lg,
                          }}
                        />
                      )}
                    </View>
                  ))}
                </MXCard>
              )}
            </View>

            {/* ITR12 Filing */}
            <View style={{ marginHorizontal: space.lg }}>
              <MXCard
                style={{
                  backgroundColor: colour.primary50,
                  borderColor: colour.primary100,
                  borderWidth: 1,
                }}
              >
                <Text
                  style={{
                    ...typography.h4,
                    color: colour.primary,
                    marginBottom: space.xs,
                  }}
                >
                  ITR12 Filing Season
                </Text>
                <Text
                  style={{
                    ...typography.bodyS,
                    color: colour.textSub,
                    marginBottom: space.md,
                  }}
                >
                  Your {ACTIVE_TAX_YEAR} deductions are ready to export.
                  Generate your SARS-ready report now.
                </Text>
                <MXButton
                  label="Prepare ITR12 export"
                  onPress={() => router.push("/itr12-export-setup")}
                  size="M"
                />
              </MXCard>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
