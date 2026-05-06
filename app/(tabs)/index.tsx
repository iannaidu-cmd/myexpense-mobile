import MXLogo from "@/components/MXLogo";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SA_MARGINAL_TAX_RATE } from "@/constants/tax";
import { expenseService } from "@/services/expenseService";
import { incomeService } from "@/services/incomeService";
import { profileService } from "@/services/profileService";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
import { ACTIVE_TAX_YEAR, Expense } from "@/types/database";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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

  const [firstName, setFirstName] = useState("");
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalDeductions, setTotalDeductions] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const hour = now.getHours();
  const dayName = DAY_NAMES[now.getDay()];
  const greeting = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
  const estimatedSaving = Math.round(totalDeductions * SA_MARGINAL_TAX_RATE);

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
      if (profile?.full_name) setFirstName(profile.full_name.split(" ")[0]);
      setTotalExpenses(totals.totalExpenses);
      setTotalDeductions(totals.totalDeductions);
      setTotalIncome(incomeTotals.totalIncome);
      setRecentExpenses(recent);
    } catch (e) {
      console.error("HomeScreen load error:", e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => { loadData(); }, [loadData])
  );

  const cardShadow =
    Platform.OS === "ios"
      ? { shadowColor: "#0F0F1E", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }
      : { elevation: 1 };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: space.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header row ── */}
        <View style={{
          flexDirection: "row", justifyContent: "space-between",
          alignItems: "center", marginBottom: 14, marginTop: 6,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{
              width: 38, height: 38, borderRadius: 11,
              borderWidth: 1, borderColor: colour.borderLight,
              alignItems: "center", justifyContent: "center", overflow: "hidden",
            }}>
              <MXLogo size={26} variant="dark" />
            </View>
            <View>
              <Text style={{ fontSize: 11, color: colour.textSub, fontWeight: "500" }}>{dayName}</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colour.text, letterSpacing: -0.3, marginTop: 1 }}>
                {greeting}{firstName ? `, ${firstName}` : ""}
              </Text>
            </View>
          </View>

          {/* Bell button */}
          <TouchableOpacity
            onPress={() => router.push("/notifications-settings" as any)}
            style={{ position: "relative" }}
          >
            <View style={{
              width: 38, height: 38, borderRadius: 19,
              backgroundColor: colour.white, borderWidth: 1, borderColor: colour.borderLight,
              alignItems: "center", justifyContent: "center",
            }}>
              <IconSymbol name="bell.fill" size={16} color={colour.text} />
            </View>
            <View style={{
              position: "absolute", width: 8, height: 8, borderRadius: 4,
              backgroundColor: colour.primary, top: 7, right: 7,
              borderWidth: 2, borderColor: colour.background,
            }} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ alignItems: "center", paddingTop: space["5xl"] }}>
            <ActivityIndicator color={colour.primary} size="large" />
          </View>
        ) : (
          <>
            {/* ── Noir hero card ── */}
            <View style={{
              backgroundColor: colour.noir, borderRadius: radius.xl,
              padding: 24, paddingBottom: 28, marginBottom: 10, overflow: "hidden",
            }}>
              {/* Periwinkle blob top-right */}
              <View style={{
                position: "absolute", width: 200, height: 200, borderRadius: 100,
                backgroundColor: colour.primary, opacity: 0.55, top: -70, right: -50,
              }} />
              {/* Periwinkle blob bottom-left */}
              <View style={{
                position: "absolute", width: 120, height: 120, borderRadius: 60,
                backgroundColor: colour.primary, opacity: 0.25, bottom: -40, left: -20,
              }} />

              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colour.primary }} />
                <Text style={{ fontSize: 12, color: colour.onNoir2, fontWeight: "500" }}>
                  Tax saved so far
                </Text>
              </View>

              <Text style={{ fontSize: 56, lineHeight: 58, letterSpacing: -2.5, fontWeight: "800", color: colour.onNoir, marginBottom: 6 }}>
                <Text style={{ color: colour.primary }}>R </Text>
                {Math.round(estimatedSaving).toLocaleString("en-ZA")}
              </Text>

              <Text style={{ fontSize: 12, color: colour.onNoir2, fontWeight: "400", marginBottom: 20, opacity: 0.7 }}>
                estimated tax refund · {ACTIVE_TAX_YEAR}
              </Text>

              <View style={{
                flexDirection: "row", paddingTop: 16,
                borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.10)",
              }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: colour.onNoir2, fontWeight: "500", marginBottom: 6 }}>
                    Income
                  </Text>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: colour.onNoir, letterSpacing: -0.5 }}>
                    {formatZAR(totalIncome)}
                  </Text>
                </View>
                <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.10)" }} />
                <View style={{ flex: 1, paddingLeft: 16 }}>
                  <Text style={{ fontSize: 11, color: colour.onNoir2, fontWeight: "500", marginBottom: 6 }}>
                    Expenses
                  </Text>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: colour.onNoir, letterSpacing: -0.5 }}>
                    {formatZAR(totalExpenses)}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── Shortcut row ── */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
              <TouchableOpacity
                onPress={() => router.push("/add-income" as any)}
                style={{
                  flex: 1, backgroundColor: colour.white, borderRadius: radius.md,
                  padding: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: colour.borderLight,
                  flexDirection: "row", alignItems: "center", gap: 10, ...cardShadow,
                }}
              >
                <View style={{
                  width: 28, height: 28, borderRadius: 8,
                  backgroundColor: colour.successBg, alignItems: "center", justifyContent: "center",
                }}>
                  <Text style={{ fontSize: 14, color: colour.success }}>+</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colour.text }}>Add income</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/(tabs)/add-expense")}
                style={{
                  flex: 1, backgroundColor: colour.white, borderRadius: radius.md,
                  padding: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: colour.borderLight,
                  flexDirection: "row", alignItems: "center", gap: 10, ...cardShadow,
                }}
              >
                <View style={{
                  width: 28, height: 28, borderRadius: 8,
                  backgroundColor: colour.primary50, alignItems: "center", justifyContent: "center",
                }}>
                  <Text style={{ fontSize: 14, color: colour.accentDeep }}>−</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colour.text }}>Add expense</Text>
              </TouchableOpacity>
            </View>

            {/* ── Scan CTA banner ── */}
            <TouchableOpacity
              onPress={() => router.push("/scan-receipt-camera" as any)}
              style={{
                backgroundColor: colour.primary, borderRadius: radius.lg,
                paddingVertical: 28, paddingHorizontal: 18, flexDirection: "row",
                alignItems: "center", gap: 16, marginBottom: 14, overflow: "hidden",
              }}
            >
              <View style={{
                position: "absolute", width: 180, height: 180, borderRadius: 90,
                backgroundColor: "rgba(255,255,255,0.12)", top: -70, right: -50,
              }} />
              {/* Receipt illustration */}
              <View style={{
                width: 60, height: 64, alignItems: "center", justifyContent: "center",
              }}>
                {/* Receipt body */}
                <View style={{
                  width: 38, height: 48, backgroundColor: "rgba(255,255,255,0.95)",
                  borderRadius: 5, justifyContent: "center", alignItems: "center",
                  paddingHorizontal: 5,
                }}>
                  {/* Receipt lines */}
                  <View style={{ width: "80%", height: 2.5, backgroundColor: "rgba(107,106,216,0.4)", borderRadius: 2, marginBottom: 4 }} />
                  <View style={{ width: "60%", height: 2.5, backgroundColor: "rgba(107,106,216,0.25)", borderRadius: 2, marginBottom: 4 }} />
                  <View style={{ width: "80%", height: 2.5, backgroundColor: "rgba(107,106,216,0.25)", borderRadius: 2, marginBottom: 4 }} />
                  <View style={{ width: "50%", height: 2.5, backgroundColor: "rgba(107,106,216,0.4)", borderRadius: 2 }} />
                </View>
                {/* Scan corner brackets */}
                {/* top-left */}
                <View style={{ position: "absolute", top: 0, left: 2, width: 10, height: 10, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderColor: colour.white, borderTopLeftRadius: 3 }} />
                {/* top-right */}
                <View style={{ position: "absolute", top: 0, right: 2, width: 10, height: 10, borderTopWidth: 2.5, borderRightWidth: 2.5, borderColor: colour.white, borderTopRightRadius: 3 }} />
                {/* bottom-left */}
                <View style={{ position: "absolute", bottom: 0, left: 2, width: 10, height: 10, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderColor: colour.white, borderBottomLeftRadius: 3 }} />
                {/* bottom-right */}
                <View style={{ position: "absolute", bottom: 0, right: 2, width: 10, height: 10, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderColor: colour.white, borderBottomRightRadius: 3 }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colour.onNoir, letterSpacing: -0.3 }}>
                  Scan a receipt
                </Text>
                <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 4, fontWeight: "500" }}>
                  Auto-filled in 2 seconds
                </Text>
              </View>
              <View style={{
                width: 34, height: 34, borderRadius: 17,
                backgroundColor: "rgba(255,255,255,0.20)", alignItems: "center", justifyContent: "center",
              }}>
                <Text style={{ color: colour.onNoir, fontSize: 18 }}>›</Text>
              </View>
            </TouchableOpacity>

            {/* ── Recent transactions ── */}
            <View style={{
              flexDirection: "row", justifyContent: "space-between",
              alignItems: "baseline", marginBottom: 8, marginHorizontal: 2,
            }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colour.text, letterSpacing: -0.2 }}>
                Recent
              </Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/reports")}>
                <Text style={{ ...typography.labelS, color: colour.primary }}>See all</Text>
              </TouchableOpacity>
            </View>

            {recentExpenses.length === 0 ? (
              <View style={{
                backgroundColor: colour.white, borderRadius: radius.md,
                borderWidth: 1, borderColor: colour.borderLight,
                padding: 24, alignItems: "center",
              }}>
                <IconSymbol name="doc.text.fill" size={28} color={colour.textHint} style={{ marginBottom: 8 } as any} />
                <Text style={{ ...typography.bodyS, color: colour.textSub, textAlign: "center" }}>
                  No expenses yet.{"\n"}Add your first expense to get started.
                </Text>
              </View>
            ) : (
              recentExpenses.map((expense) => (
                <TouchableOpacity
                  key={expense.id}
                  onPress={() => router.push(`/expense-detail?id=${expense.id}` as any)}
                  style={{
                    backgroundColor: colour.white, borderRadius: radius.md,
                    borderWidth: 1, borderColor: colour.borderLight,
                    padding: 10, paddingHorizontal: 12,
                    flexDirection: "row", alignItems: "center", gap: 10,
                    marginBottom: 7, ...cardShadow,
                  }}
                >
                  <View style={{
                    width: 32, height: 32, borderRadius: 10,
                    backgroundColor: colour.surface1,
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colour.textMid }}>
                      {expense.category?.charAt(0)?.toUpperCase() ?? "?"}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colour.text }}>
                      {expense.vendor}
                    </Text>
                    <Text style={{ fontSize: 11, color: colour.textSub, marginTop: 1, fontWeight: "500" }}>
                      {expense.category} · {formatDate(expense.expense_date)}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: colour.text }}>
                      {formatZAR(expense.amount)}
                    </Text>
                    {expense.is_deductible && (
                      <Text style={{ fontSize: 11, color: colour.success, fontWeight: "500", marginTop: 1 }}>
                        deductible
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}

            {/* ── ITR12 Filing Season ── */}
            <View style={{
              backgroundColor: colour.primary50, borderRadius: radius.lg,
              padding: space.lg, borderWidth: 1, borderColor: colour.primary100,
              marginTop: space.md,
            }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colour.primary, marginBottom: 6 }}>
                ITR12 Filing Season
              </Text>
              <Text style={{ fontSize: 13, color: colour.textSub, marginBottom: 14, lineHeight: 19 }}>
                Your {ACTIVE_TAX_YEAR} deductions are ready to export. Generate your SARS-ready report now.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/itr12-export-setup")}
                style={{
                  backgroundColor: colour.primary, borderRadius: radius.pill,
                  paddingVertical: 11, paddingHorizontal: 20, alignSelf: "flex-start",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: colour.onPrimary }}>
                  Prepare ITR12 export
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
